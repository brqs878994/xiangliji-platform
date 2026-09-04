import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import type { CategoryItem, DraftRecord, AuditRecord, ConversationRecord, MessageRecord, PlatformRepository, PostFilters, PostRecord, PostStatus, ResponseRecord, ReportRecord, TownItem } from './platform.types';
import { seedCategories, seedPosts, seedTowns } from './platform.seed';

@Injectable()
export class InMemoryPlatformRepository implements PlatformRepository {
  private readonly categories = seedCategories.map((item) => ({ ...item }));
  private readonly towns = seedTowns.map((item) => ({ ...item }));
  private readonly posts = seedPosts.map((item) => ({ ...item }));
  private readonly drafts = new Map<string, DraftRecord>();
  private readonly audits = new Map<string, AuditRecord>();
  private readonly draftPosts = new Map<string, string>();
  private readonly responses = new Map<string, ResponseRecord>();
  private readonly reports = new Map<string, ReportRecord>();
  private readonly conversations = new Map<string, ConversationRecord>();
  private readonly messages = new Map<string, MessageRecord>();
  private readonly persistenceEnabled = process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true';
  // Resolve from both src/platform and dist/platform back to the repository root.
  private readonly persistencePath = process.env.PLATFORM_DATA_FILE || resolve(__dirname, '../../../../infra/data/platform.json');

  constructor() {
    this.restoreState();
    if (this.conversations.size === 0) this.seedConversations();
  }

  listCategories(): CategoryItem[] { return this.categories.filter((item) => item.enabled).sort((a, b) => a.sort - b.sort).map((item) => ({ ...item })); }
  listTowns(): TownItem[] { return this.towns.filter((item) => item.enabled).map((item) => ({ ...item })); }
  listPosts(filters: PostFilters): PostRecord[] {
    const now = Date.now();
    return this.posts.filter((post) => post.status === 'published' && Date.parse(post.validUntil) >= now)
      .filter((post) => !filters.townCode || post.townCode === filters.townCode)
      .filter((post) => !filters.category || post.category.includes(filters.category) || filters.category.includes(post.category))
      .filter((post) => !filters.keyword || `${post.title}${post.summary}${post.category}`.includes(filters.keyword))
      .map((post) => this.withResponseLabel(post));
  }
  listUserPosts(userId: string): PostRecord[] {
    return this.posts.filter((post) => post.ownerId === userId).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).map((post) => this.withResponseLabel(post));
  }
  getPost(id: string): PostRecord | undefined {
    const post = this.posts.find((item) => item.id === id && item.status === 'published' && Date.parse(item.validUntil) >= Date.now());
    return post ? this.withResponseLabel(post) : undefined;
  }
  getDraft(id: string): DraftRecord | undefined { const draft = this.drafts.get(id); return draft ? { ...draft } : undefined; }
  createDraft(input: { userId: string; title: string; category: string; townCode: string; body: string; validDays?: number }): DraftRecord {
    const now = new Date().toISOString();
    const validDays = Math.min(30, Math.max(1, Math.round(input.validDays || 7)));
    const record: DraftRecord = { id: `draft-${randomUUID()}`, title: input.title, category: input.category, townCode: input.townCode, body: input.body, missingFields: [], warnings: [], status: 'draft', userId: input.userId, validDays, createdAt: now, updatedAt: now };
    this.drafts.set(record.id, record);
    this.persistState();
    return { ...record };
  }
  updateDraft(id: string, userId: string, patch: Partial<Pick<DraftRecord, 'title' | 'category' | 'townCode' | 'body' | 'validDays'>>): DraftRecord | undefined {
    const draft = this.drafts.get(id);
    if (!draft || draft.userId !== userId || draft.status !== 'draft') return undefined;
    const normalized = patch.validDays === undefined ? {} : { validDays: Math.min(30, Math.max(1, Math.round(patch.validDays || 7))) };
    Object.assign(draft, { ...patch, ...normalized }, { updatedAt: new Date().toISOString() });
    this.persistState();
    return { ...draft };
  }
  submitDraft(id: string, userId: string, confirmed: boolean): AuditRecord {
    const draft = this.drafts.get(id);
    if (!draft || draft.userId !== userId) throw new Error('draft_not_found');
    if (!confirmed) throw new Error('confirmation_required');
    if (draft.status !== 'draft') throw new Error('draft_not_editable');
    draft.status = 'published';
    const post = this.createPostFromDraft(draft);
    this.posts.unshift(post);
    this.draftPosts.set(draft.id, post.id);
    const audit: AuditRecord = { id: `audit-${randomUUID()}`, draftId: id, status: 'pending', reason: null, createdAt: new Date().toISOString(), reviewedAt: null };
    this.audits.set(audit.id, audit);
    this.persistState();
    return { ...audit };
  }
  listAudits(): AuditRecord[] { return [...this.audits.values()].map((item) => ({ ...item })); }
  reviewAudit(id: string, approved: boolean, reason?: string): PostRecord | undefined {
    const audit = this.audits.get(id);
    if (!audit || audit.status !== 'pending') return undefined;
    const draft = this.drafts.get(audit.draftId);
    if (!draft) return undefined;
    audit.status = approved ? 'approved' : 'rejected'; audit.reason = reason || null; audit.reviewedAt = new Date().toISOString();
    const postId = this.draftPosts.get(draft.id);
    const post = postId ? this.posts.find((item) => item.id === postId) : undefined;
    if (!approved) {
      draft.status = 'rejected';
      if (post) post.status = 'removed';
      this.persistState();
      return undefined;
    }
    draft.status = 'published';
    this.persistState();
    return post ? { ...post } : undefined;
  }
  private createPostFromDraft(draft: DraftRecord): PostRecord {
    const publishedAt = new Date();
    const town = this.towns.find((item) => item.code === draft.townCode);
    return { id: `post-${randomUUID()}`, category: draft.category || '其他', title: draft.title, townCode: draft.townCode || 'chengguan', townName: town?.name || draft.townCode || '城关镇', distanceKm: null, publishedAt: publishedAt.toISOString(), validUntil: new Date(publishedAt.getTime() + draft.validDays * 86400000).toISOString(), summary: draft.body.slice(0, 120), responseLabel: null, body: draft.body, status: 'published', ownerId: draft.userId };
  }
  addResponse(postId: string, input: { userId: string; type: ResponseRecord['type']; message?: string }): ResponseRecord | undefined {
    if (!this.getPost(postId)) return undefined;
    const exists = [...this.responses.values()].find((item) => item.postId === postId && item.userId === input.userId && item.type === input.type);
    if (exists) return { ...exists };
    const response: ResponseRecord = { id: `response-${randomUUID()}`, postId, userId: input.userId, type: input.type, message: input.message || null, createdAt: new Date().toISOString() };
    this.responses.set(response.id, response); this.persistState(); return { ...response };
  }
  removeResponse(postId: string, userId: string, type: ResponseRecord['type']): ResponseRecord | undefined {
    const entry = [...this.responses.entries()].find(([, item]) => item.postId === postId && item.userId === userId && item.type === type);
    if (!entry) return undefined;
    this.responses.delete(entry[0]);
    this.persistState();
    return { ...entry[1] };
  }
  listResponses(postId: string): ResponseRecord[] { return [...this.responses.values()].filter((item) => item.postId === postId).map((item) => ({ ...item })); }
  updatePostStatus(postId: string, userId: string, status: Extract<PostStatus, 'closed' | 'expired'>): PostRecord | undefined {
    const post = this.posts.find((item) => item.id === postId && item.ownerId === userId);
    if (!post) return undefined;
    post.status = status;
    this.persistState();
    return this.withResponseLabel(post);
  }
  createReport(postId: string, userId: string, reason: string): ReportRecord | undefined {
    if (!this.posts.some((post) => post.id === postId)) return undefined;
    const report: ReportRecord = { id: `report-${randomUUID()}`, postId, userId, reason: reason.trim(), createdAt: new Date().toISOString() };
    this.reports.set(report.id, report);
    this.persistState();
    return { ...report };
  }
  listConversations(userId: string): ConversationRecord[] {
    return [...this.conversations.values()].filter((item) => item.userId === userId).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).map((item) => ({ ...item }));
  }
  listMessages(conversationId: string, userId: string): MessageRecord[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || conversation.userId !== userId) return [];
    return [...this.messages.values()].filter((item) => item.conversationId === conversationId).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)).map((item) => ({ ...item }));
  }
  sendMessage(conversationId: string, userId: string, content: string): MessageRecord | undefined {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || conversation.userId !== userId || !content.trim()) return undefined;
    const now = new Date().toISOString();
    const message: MessageRecord = { id: `message-${randomUUID()}`, conversationId, senderId: userId, content: content.trim(), createdAt: now };
    this.messages.set(message.id, message);
    Object.assign(conversation, { preview: message.content, updatedAt: now });
    this.persistState();
    return { ...message };
  }

  private restoreState() {
    if (!this.persistenceEnabled || !existsSync(this.persistencePath)) return;
    try {
      const state = JSON.parse(readFileSync(this.persistencePath, 'utf8')) as { posts?: PostRecord[]; drafts?: DraftRecord[]; audits?: AuditRecord[]; responses?: ResponseRecord[]; reports?: ReportRecord[]; conversations?: ConversationRecord[]; messages?: MessageRecord[]; draftPosts?: Record<string, string> };
      if (Array.isArray(state.posts)) this.posts.splice(0, this.posts.length, ...state.posts);
      if (Array.isArray(state.drafts)) state.drafts.forEach((item) => this.drafts.set(item.id, item));
      if (Array.isArray(state.audits)) state.audits.forEach((item) => this.audits.set(item.id, item));
      if (Array.isArray(state.responses)) state.responses.forEach((item) => this.responses.set(item.id, item));
      if (Array.isArray(state.reports)) state.reports.forEach((item) => this.reports.set(item.id, item));
      if (Array.isArray(state.conversations)) state.conversations.forEach((item) => this.conversations.set(item.id, item));
      if (Array.isArray(state.messages)) state.messages.forEach((item) => this.messages.set(item.id, item));
      if (this.conversations.size === 0) this.seedConversations();
      Object.entries(state.draftPosts || {}).forEach(([draftId, postId]) => this.draftPosts.set(draftId, postId));
    } catch {
      // Keep seed data available if a partial/corrupt state file is encountered.
    }
  }

  private persistState() {
    if (!this.persistenceEnabled) return;
    try {
      mkdirSync(dirname(this.persistencePath), { recursive: true });
      const tempPath = `${this.persistencePath}.tmp`;
      writeFileSync(tempPath, JSON.stringify({ posts: this.posts, drafts: [...this.drafts.values()], audits: [...this.audits.values()], responses: [...this.responses.values()], reports: [...this.reports.values()], conversations: [...this.conversations.values()], messages: [...this.messages.values()], draftPosts: Object.fromEntries(this.draftPosts) }, null, 2), 'utf8');
      renameSync(tempPath, this.persistencePath);
    } catch {
      // Persistence is best-effort in the MVP; API operations still return their in-memory result.
    }
  }

  private seedConversations() {
    const now = new Date().toISOString();
    const first: ConversationRecord = { id: 'conversation-buyer-1', userId: 'user-demo', participantName: '王师傅', preview: '鸡蛋还有吗？', unread: 2, updatedAt: now };
    const second: ConversationRecord = { id: 'conversation-worker-1', userId: 'user-demo', participantName: '装车联系人', preview: '下午两点集合', unread: 0, updatedAt: new Date(Date.now() - 86400000).toISOString() };
    this.conversations.set(first.id, first); this.conversations.set(second.id, second);
    this.messages.set('message-buyer-1', { id: 'message-buyer-1', conversationId: first.id, senderId: 'other', content: '你好，我看到你发布的土鸡蛋信息。', createdAt: new Date(Date.now() - 120000).toISOString() });
    this.messages.set('message-buyer-2', { id: 'message-buyer-2', conversationId: first.id, senderId: 'other', content: '鸡蛋还有吗？', createdAt: new Date(Date.now() - 60000).toISOString() });
    this.messages.set('message-worker-1', { id: 'message-worker-1', conversationId: second.id, senderId: 'other', content: '下午两点在城关仓库集合，到了发我消息。', createdAt: new Date(Date.now() - 86400000).toISOString() });
  }

  private withResponseLabel(post: PostRecord): PostRecord {
    const responses = this.listResponses(post.id);
    const contacts = responses.filter((item) => item.type === 'contact').length;
    const signups = responses.filter((item) => item.type === 'signup').length;
    const favorites = responses.filter((item) => item.type === 'favorite').length;
    const responseLabel = contacts ? `${contacts} 人已联系` : signups ? `${signups} 人已报名` : favorites ? `${favorites} 人已收藏` : post.responseLabel;
    return { ...post, responseLabel };
  }
}
