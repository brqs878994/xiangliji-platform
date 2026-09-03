import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { CategoryItem, DraftRecord, AuditRecord, PlatformRepository, PostFilters, PostRecord, ResponseRecord, TownItem } from './platform.types';
import { seedCategories, seedPosts, seedTowns } from './platform.seed';

@Injectable()
export class InMemoryPlatformRepository implements PlatformRepository {
  private readonly categories = seedCategories.map((item) => ({ ...item }));
  private readonly towns = seedTowns.map((item) => ({ ...item }));
  private readonly posts = seedPosts.map((item) => ({ ...item }));
  private readonly drafts = new Map<string, DraftRecord>();
  private readonly audits = new Map<string, AuditRecord>();
  private readonly responses = new Map<string, ResponseRecord>();

  listCategories(): CategoryItem[] { return this.categories.filter((item) => item.enabled).sort((a, b) => a.sort - b.sort).map((item) => ({ ...item })); }
  listTowns(): TownItem[] { return this.towns.filter((item) => item.enabled).map((item) => ({ ...item })); }
  listPosts(filters: PostFilters): PostRecord[] {
    const now = Date.now();
    return this.posts.filter((post) => post.status === 'published' && Date.parse(post.validUntil) >= now)
      .filter((post) => !filters.townCode || post.townCode === filters.townCode)
      .filter((post) => !filters.category || post.category.includes(filters.category) || filters.category.includes(post.category))
      .filter((post) => !filters.keyword || `${post.title}${post.summary}${post.category}`.includes(filters.keyword))
      .map((post) => ({ ...post }));
  }
  getPost(id: string): PostRecord | undefined {
    const post = this.posts.find((item) => item.id === id && item.status === 'published' && Date.parse(item.validUntil) >= Date.now());
    return post ? { ...post } : undefined;
  }
  getDraft(id: string): DraftRecord | undefined { const draft = this.drafts.get(id); return draft ? { ...draft } : undefined; }
  createDraft(input: { userId: string; title: string; category: string; townCode: string; body: string; validDays?: number }): DraftRecord {
    const now = new Date().toISOString();
    const validDays = Math.min(30, Math.max(1, Math.round(input.validDays || 7)));
    const record: DraftRecord = { id: `draft-${randomUUID()}`, title: input.title, category: input.category, townCode: input.townCode, body: input.body, missingFields: [], warnings: [], status: 'draft', userId: input.userId, validDays, createdAt: now, updatedAt: now };
    this.drafts.set(record.id, record);
    return { ...record };
  }
  updateDraft(id: string, userId: string, patch: Partial<Pick<DraftRecord, 'title' | 'category' | 'townCode' | 'body' | 'validDays'>>): DraftRecord | undefined {
    const draft = this.drafts.get(id);
    if (!draft || draft.userId !== userId || draft.status !== 'draft') return undefined;
    const normalized = patch.validDays === undefined ? {} : { validDays: Math.min(30, Math.max(1, Math.round(patch.validDays || 7))) };
    Object.assign(draft, { ...patch, ...normalized }, { updatedAt: new Date().toISOString() });
    return { ...draft };
  }
  submitDraft(id: string, userId: string, confirmed: boolean): AuditRecord {
    const draft = this.drafts.get(id);
    if (!draft || draft.userId !== userId) throw new Error('draft_not_found');
    if (!confirmed) throw new Error('confirmation_required');
    if (draft.status !== 'draft') throw new Error('draft_not_editable');
    draft.status = 'pending_review';
    const audit: AuditRecord = { id: `audit-${randomUUID()}`, draftId: id, status: 'pending', reason: null, createdAt: new Date().toISOString(), reviewedAt: null };
    this.audits.set(audit.id, audit);
    return { ...audit };
  }
  listAudits(): AuditRecord[] { return [...this.audits.values()].map((item) => ({ ...item })); }
  reviewAudit(id: string, approved: boolean, reason?: string): PostRecord | undefined {
    const audit = this.audits.get(id);
    if (!audit || audit.status !== 'pending') return undefined;
    const draft = this.drafts.get(audit.draftId);
    if (!draft) return undefined;
    audit.status = approved ? 'approved' : 'rejected'; audit.reason = reason || null; audit.reviewedAt = new Date().toISOString();
    draft.status = approved ? 'published' : 'rejected';
    if (!approved) return undefined;
    const town = this.towns.find((item) => item.code === draft.townCode);
    const post: PostRecord = { id: `post-${randomUUID()}`, category: draft.category || '其他', title: draft.title, townCode: draft.townCode || 'chengguan', townName: town?.name || draft.townCode || '城关镇', distanceKm: null, publishedAt: new Date().toISOString(), validUntil: new Date(Date.now() + draft.validDays * 86400000).toISOString(), summary: draft.body.slice(0, 120), responseLabel: null, body: draft.body, status: 'published', ownerId: draft.userId };
    this.posts.unshift(post);
    return { ...post };
  }
  addResponse(postId: string, input: { userId: string; type: ResponseRecord['type']; message?: string }): ResponseRecord | undefined {
    if (!this.getPost(postId)) return undefined;
    const exists = [...this.responses.values()].find((item) => item.postId === postId && item.userId === input.userId && item.type === input.type);
    if (exists) return { ...exists };
    const response: ResponseRecord = { id: `response-${randomUUID()}`, postId, userId: input.userId, type: input.type, message: input.message || null, createdAt: new Date().toISOString() };
    this.responses.set(response.id, response); return { ...response };
  }
  removeResponse(postId: string, userId: string, type: ResponseRecord['type']): ResponseRecord | undefined {
    const entry = [...this.responses.entries()].find(([, item]) => item.postId === postId && item.userId === userId && item.type === type);
    if (!entry) return undefined;
    this.responses.delete(entry[0]);
    return { ...entry[1] };
  }
  listResponses(postId: string): ResponseRecord[] { return [...this.responses.values()].filter((item) => item.postId === postId).map((item) => ({ ...item })); }
}
