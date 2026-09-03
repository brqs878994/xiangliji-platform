import type { PostCard, PostDraft, PostStatus } from '@xiangliji/domain';

export interface CategoryItem { id: string; name: string; subtitle: string; enabled: boolean; sort: number; }
export interface TownItem { code: string; name: string; countyName: string; enabled: boolean; }
export interface DraftRecord extends Omit<PostDraft, 'status'> { status: PostStatus; userId: string; createdAt: string; updatedAt: string; }
export interface AuditRecord { id: string; draftId: string; status: 'pending' | 'approved' | 'rejected'; reason: string | null; createdAt: string; reviewedAt: string | null; }
export interface ResponseRecord { id: string; postId: string; userId: string; type: 'contact' | 'signup' | 'favorite'; message: string | null; createdAt: string; }
export interface PostRecord extends PostCard { body: string; status: PostStatus; ownerId: string; }
export interface PostFilters { townCode?: string; category?: string; keyword?: string; }

export interface PlatformRepository {
  listCategories(): CategoryItem[];
  listTowns(): TownItem[];
  listPosts(filters: PostFilters): PostRecord[];
  getPost(id: string): PostRecord | undefined;
  getDraft(id: string): DraftRecord | undefined;
  createDraft(input: { userId: string; title: string; category: string; townCode: string; body: string; validDays?: number }): DraftRecord;
  updateDraft(id: string, userId: string, patch: Partial<Pick<DraftRecord, 'title' | 'category' | 'townCode' | 'body'>>): DraftRecord | undefined;
  submitDraft(id: string, userId: string, confirmed: boolean): AuditRecord;
  listAudits(): AuditRecord[];
  reviewAudit(id: string, approved: boolean, reason?: string): PostRecord | undefined;
  addResponse(postId: string, input: { userId: string; type: ResponseRecord['type']; message?: string }): ResponseRecord | undefined;
  listResponses(postId: string): ResponseRecord[];
}
