import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
  private readonly draftPosts = new Map<string, string>();
  private readonly responses = new Map<string, ResponseRecord>();
  private readonly persistenceEnabled = process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true';
  // Resolve from both src/platform and dist/platform back to the repository root.
  private readonly persistencePath = process.env.PLATFORM_DATA_FILE || resolve(__dirname, '../../../../infra/data/platform.json');

  constructor() {
    this.restoreState();
  }

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

  private restoreState() {
    if (!this.persistenceEnabled || !existsSync(this.persistencePath)) return;
    try {
      const state = JSON.parse(readFileSync(this.persistencePath, 'utf8')) as { posts?: PostRecord[]; drafts?: DraftRecord[]; audits?: AuditRecord[]; responses?: ResponseRecord[]; draftPosts?: Record<string, string> };
      if (Array.isArray(state.posts)) this.posts.splice(0, this.posts.length, ...state.posts);
      if (Array.isArray(state.drafts)) state.drafts.forEach((item) => this.drafts.set(item.id, item));
      if (Array.isArray(state.audits)) state.audits.forEach((item) => this.audits.set(item.id, item));
      if (Array.isArray(state.responses)) state.responses.forEach((item) => this.responses.set(item.id, item));
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
      writeFileSync(tempPath, JSON.stringify({ posts: this.posts, drafts: [...this.drafts.values()], audits: [...this.audits.values()], responses: [...this.responses.values()], draftPosts: Object.fromEntries(this.draftPosts) }, null, 2), 'utf8');
      renameSync(tempPath, this.persistencePath);
    } catch {
      // Persistence is best-effort in the MVP; API operations still return their in-memory result.
    }
  }
}
