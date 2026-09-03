import { requestJson } from './api';

export interface PlatformCategory { id: string; name: string; subtitle: string; enabled: boolean; sort: number; }
export interface PlatformPost { id: string; category: string; title: string; townCode: string; townName: string; distanceKm: number | null; publishedAt: string; validUntil: string; summary: string; responseLabel: string | null; }

export const fallbackCategories: PlatformCategory[] = [
  { id: 'farm', name: '助农供求', subtitle: '卖货 · 找收', enabled: true, sort: 1 },
  { id: 'jobs', name: '求职招工', subtitle: '找活 · 找人', enabled: true, sort: 2 },
  { id: 'tasks', name: '有偿任务', subtitle: '跑腿 · 代办', enabled: true, sort: 3 },
  { id: 'secondhand', name: '二手市场', subtitle: '闲置 · 农机', enabled: true, sort: 4 },
  { id: 'social', name: '约局互动', subtitle: '球局 · 拼车', enabled: true, sort: 5 },
];

export const fallbackPosts: PlatformPost[] = [
  { id: 'post-corn-001', category: '助农供求', title: '收土鸡蛋，长期要货', townCode: 'chengguan', townName: '城关镇', distanceKm: 2.4, publishedAt: '2026-09-03T08:32:00+08:00', validUntil: '2026-09-10T23:59:59+08:00', summary: '每周稳定收 200 斤 · 城关镇可上门看货', responseLabel: '2 人已联系' },
  { id: 'post-loading-001', category: '日结零工', title: '下午装车，缺 5 人', townCode: 'chengguan', townName: '城关镇', distanceKm: 1.1, publishedAt: '2026-09-03T09:05:00+08:00', validUntil: '2026-09-03T14:00:00+08:00', summary: '今天 14:00 集合 · 做完结算', responseLabel: '还缺 3 人' },
  { id: 'post-machine-001', category: '二手市场', title: '旧打谷机，正常使用', townCode: 'chengguan', townName: '城关镇', distanceKm: 4.8, publishedAt: '2026-09-02T17:20:00+08:00', validUntil: '2026-09-16T23:59:59+08:00', summary: '配件齐全 · 王家镇自提', responseLabel: '1 人已收藏' },
  { id: 'post-task-001', category: '有偿任务', title: '帮忙把两袋化肥送到村口', townCode: 'chengguan', townName: '城关镇', distanceKm: 3.2, publishedAt: '2026-09-03T08:57:00+08:00', validUntil: '2026-09-04T23:59:59+08:00', summary: '今天内 · 报酬面议', responseLabel: '可联系' },
];

export async function getCategories(): Promise<PlatformCategory[]> {
  try { return (await requestJson<{ items: PlatformCategory[] }>('/categories')).items; } catch { return fallbackCategories; }
}

export async function getPosts(filters: { townCode?: string; category?: string; keyword?: string } = {}): Promise<PlatformPost[]> {
  try { return (await requestJson<{ items: PlatformPost[] }>(`/posts?${new URLSearchParams(filters).toString()}`)).items; } catch { return fallbackPosts; }
}

export interface DraftResponse { id: string; title: string; category: string; townCode: string; body: string; validDays: number; status: string; userId: string; }
export async function createDraft(input: { userId: string; title: string; category: string; townCode: string; body: string; validDays?: number }) {
  return requestJson<DraftResponse>('/posts/drafts', { method: 'POST', body: JSON.stringify(input) });
}
export async function updateDraft(id: string, input: { userId: string; title?: string; category?: string; townCode?: string; body?: string; validDays?: number }) {
  return requestJson<DraftResponse>(`/posts/drafts/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function submitDraftReview(id: string, userId: string) {
  return requestJson<{ id: string; status: string }>(`/posts/drafts/${id}/submit-review`, { method: 'POST', body: JSON.stringify({ userId, confirmed: true }) });
}

export interface PostResponse { id: string; postId: string; userId: string; type: 'contact' | 'signup' | 'favorite'; message: string | null; createdAt: string; }
export async function getResponses(postId: string) {
  return requestJson<{ items: PostResponse[] }>(`/posts/${postId}/responses`);
}
export async function addResponse(postId: string, input: { userId: string; type: PostResponse['type']; message?: string }) {
  return requestJson<PostResponse>(`/posts/${postId}/responses`, { method: 'POST', body: JSON.stringify(input) });
}
export async function removeResponse(postId: string, userId: string, type: PostResponse['type']) {
  return requestJson<PostResponse>(`/posts/${postId}/responses?${new URLSearchParams({ userId, type }).toString()}`, { method: 'DELETE' });
}
export async function toggleFavorite(postId: string, userId: string, saved: boolean) {
  return saved ? removeResponse(postId, userId, 'favorite') : addResponse(postId, { userId, type: 'favorite' });
}

export interface PlatformAudit { id: string; draftId: string; status: 'pending' | 'approved' | 'rejected'; reason: string | null; createdAt: string; reviewedAt: string | null; draft: { title: string; category: string; townCode: string; body: string; userId: string } | null; }
export interface AiProvider { id: string; name: string; protocol: string; baseUrl: string | null; apiKey: string | null; model: string; timeoutMs: number; maxTokens: number; enabled: boolean; }
export interface AiRoute { capability: string; primaryProviderId: string; fallbackProviderId: string | null; enabled: boolean; }

export async function getAdminStats() { return requestJson<{ publishedPosts: number; pendingAudits: number; categories: number; towns: number }>('/admin/stats'); }
export async function getAdminAudits() { return requestJson<{ items: PlatformAudit[] }>('/admin/audits'); }
export async function reviewAudit(id: string, approved: boolean, reason?: string) {
  return requestJson(`/admin/audits/${id}/${approved ? 'approve' : 'reject'}`, { method: 'POST', body: JSON.stringify({ confirmed: true, reason }) });
}
export async function getAiProviders() { return requestJson<{ items: AiProvider[] }>('/admin/ai/providers'); }
export async function getAiRoutes() { return requestJson<{ items: AiRoute[] }>('/admin/ai/routes'); }
