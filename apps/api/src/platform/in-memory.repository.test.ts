import { describe, expect, it } from 'vitest';
import { InMemoryPlatformRepository } from './in-memory.repository';

describe('InMemoryPlatformRepository', () => {
  it('filters seeded posts by category and town', () => {
    const repository = new InMemoryPlatformRepository();
    expect(repository.listPosts({ townCode: 'chengguan', category: '助农' })).toHaveLength(1);
    expect(repository.listPosts({ townCode: 'unknown' })).toHaveLength(0);
  });

  it('moves a confirmed draft through review into a published post', () => {
    const repository = new InMemoryPlatformRepository();
    const draft = repository.createDraft({ userId: 'u1', title: '收红薯', category: '助农供求', townCode: 'chengguan', body: '长期收红薯' });
    const audit = repository.submitDraft(draft.id, 'u1', true);
    expect(audit.status).toBe('pending');
    const post = repository.reviewAudit(audit.id, true);
    expect(post?.status).toBe('published');
    expect(repository.listPosts({ keyword: '收红薯' })).toHaveLength(1);
  });
});
