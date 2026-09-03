import { describe, expect, it } from 'vitest';
import { AgentService } from './agent.service';

async function collect(message: string, userId: string | null = null) {
  const service = new AgentService();
  const events = [];
  for await (const event of service.stream({
    sessionId: 'test-session',
    userId,
    townCode: 'chengguan',
    message,
    history: [],
  })) {
    events.push(event);
  }
  return events;
}

describe('AgentService', () => {
  it('returns platform cards with post-backed sources', async () => {
    const events = await collect('有没有人收玉米');
    const cards = events.find((event) => event.type === 'cards');
    expect(cards?.type).toBe('cards');
    if (cards?.type === 'cards') {
      expect(cards.cards[0].id).toBe('post-corn-001');
    }
  });

  it('returns a general answer for stable questions', async () => {
    const events = await collect('玉米什么时候收比较好');
    expect(events.some((event) => event.type === 'text_delta')).toBe(true);
  });

  it('returns a draft action and login warning for anonymous no-result queries', async () => {
    const events = await collect('有没有人收荔枝');
    expect(events.some((event) => event.type === 'action' && event.action.type === 'create_draft')).toBe(true);
    expect(events.some((event) => event.type === 'warning' && event.code === 'login_required')).toBe(true);
  });

  it('always closes with done', async () => {
    const events = await collect('你好');
    expect(events.at(-1)).toEqual(expect.objectContaining({ type: 'done' }));
  });
});

