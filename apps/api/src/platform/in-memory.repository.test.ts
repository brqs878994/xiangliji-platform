import { describe, expect, it } from 'vitest';
import { InMemoryPlatformRepository } from './in-memory.repository';

describe('InMemoryPlatformRepository', () => {
  it('filters seeded posts by category and town', () => {
    const repository = new InMemoryPlatformRepository();
    expect(repository.listPosts({ townCode: 'chengguan', category: '助农' })).toHaveLength(1);
    expect(repository.listPosts({ townCode: 'unknown' })).toHaveLength(0);
  });

  it('publishes a confirmed draft immediately and keeps review asynchronous', () => {
    const repository = new InMemoryPlatformRepository();
    const draft = repository.createDraft({ userId: 'u1', title: '收红薯', category: '助农供求', townCode: 'chengguan', body: '长期收红薯', validDays: 14 });
    const audit = repository.submitDraft(draft.id, 'u1', true);
    expect(audit.status).toBe('pending');
    expect(repository.getDraft(draft.id)?.status).toBe('published');
    expect(repository.listPosts({ keyword: '收红薯' })).toHaveLength(1);
    const post = repository.reviewAudit(audit.id, true);
    expect(post?.status).toBe('published');
    expect(post && Date.parse(post.validUntil) - Date.parse(post.publishedAt)).toBe(14 * 86400000);
    expect(repository.listPosts({ keyword: '收红薯' })).toHaveLength(1);
  });

  it('removes an immediately visible post when review rejects it', () => {
    const repository = new InMemoryPlatformRepository();
    const draft = repository.createDraft({ userId: 'u1', title: '违规信息', category: '助农供求', townCode: 'chengguan', body: '待审核内容' });
    const audit = repository.submitDraft(draft.id, 'u1', true);
    expect(repository.listPosts({ keyword: '违规信息' })).toHaveLength(1);
    repository.reviewAudit(audit.id, false, '不符合发布规则');
    expect(repository.listPosts({ keyword: '违规信息' })).toHaveLength(0);
  });

  it('adds and removes a favorite idempotently', () => {
    const repository = new InMemoryPlatformRepository();
    const response = repository.addResponse('post-corn-001', { userId: 'u1', type: 'favorite' });
    expect(response?.type).toBe('favorite');
    expect(repository.addResponse('post-corn-001', { userId: 'u1', type: 'favorite' })?.id).toBe(response?.id);
    expect(repository.removeResponse('post-corn-001', 'u1', 'favorite')?.id).toBe(response?.id);
    expect(repository.listResponses('post-corn-001')).toHaveLength(0);
  });

  it('persists platform conversation messages and rejects other users', async () => {
    const repository = new InMemoryPlatformRepository();
    const conversations = repository.listConversations('user-demo');
    expect(conversations.length).toBeGreaterThan(0);
    const conversation = conversations[0];
    expect(repository.listMessages(conversation.id, 'other-user')).toHaveLength(0);
    const message = repository.sendMessage(conversation.id, 'user-demo', '我这边还有，可以看图确认');
    expect(message?.content).toContain('可以看图');
    expect(repository.listMessages(conversation.id, 'user-demo').at(-1)?.id).toBe(message?.id);
  });
});
