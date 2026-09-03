import { describe, expect, it } from 'vitest';
import { InMemoryPlatformRepository } from './in-memory.repository';
import { PlatformController } from './platform.controller';

describe('PlatformController', () => {
  it('exposes categories and seeded posts', () => {
    const controller = new PlatformController(new InMemoryPlatformRepository());
    expect(controller.listCategories().items.map((item) => item.name)).toContain('二手市场');
    expect(controller.listPosts('chengguan', '助农').items[0].id).toBe('post-corn-001');
  });

  it('requires confirmation before submitting a draft', () => {
    const controller = new PlatformController(new InMemoryPlatformRepository());
    const draft = controller.createDraft({ userId: 'u1', title: '招工', category: '求职招工', townCode: 'chengguan', body: '找两个人' });
    expect(() => controller.submitDraft(draft.id, { userId: 'u1', confirmed: false })).toThrow();
  });

  it('returns admin stats and hides expired detail records', () => {
    const controller = new PlatformController(new InMemoryPlatformRepository());
    expect(controller.adminStats().categories).toBeGreaterThan(0);
    expect(() => controller.getPost('missing')).toThrow();
  });
});
