import type {
  ChatEvent,
  ChatInput,
  ExtractInput,
  IntentInput,
  IntentResult,
  LlmProvider,
  SearchInput,
  SearchProvider,
  SearchResult,
} from '@xiangliji/ai-contracts';
import type { PostDraft } from '@xiangliji/domain';
import { AgentRouter } from './agent.router';

const cards: SearchResult[] = [
  {
    score: 0.98,
    card: {
      id: 'post-corn-001',
      category: '助农供求',
      title: '城关镇收玉米，量大可上门',
      townCode: 'chengguan',
      townName: '城关镇',
      distanceKm: 2.4,
      publishedAt: '2026-09-02T08:32:00+08:00',
      validUntil: '2026-09-09T23:59:59+08:00',
      summary: '支持湿玉米，电话联系确认数量和时间。',
      responseLabel: '2 人已联系',
    },
  },
  {
    score: 0.93,
    card: {
      id: 'post-loading-001',
      category: '有偿任务',
      title: '下午装车，找 2 个帮工',
      townCode: 'chengguan',
      townName: '城关镇',
      distanceKm: 1.1,
      publishedAt: '2026-09-02T09:05:00+08:00',
      validUntil: '2026-09-02T14:00:00+08:00',
      summary: '下午两点开始，按小时结算，做完即结。',
      responseLabel: '还缺 1 人',
    },
  },
  {
    score: 0.89,
    card: {
      id: 'post-machine-001',
      category: '二手市场',
      title: '二手小麦收割机，城关镇自提',
      townCode: 'chengguan',
      townName: '城关镇',
      distanceKm: 4.8,
      publishedAt: '2026-09-01T17:20:00+08:00',
      validUntil: '2026-09-16T23:59:59+08:00',
      summary: '车况可现场试机，支持视频看机。',
      responseLabel: '1 人已收藏',
    },
  },
];

export class MockProvider implements LlmProvider, SearchProvider {
  private readonly router = new AgentRouter();

  async classifyIntent(input: IntentInput): Promise<IntentResult> {
    return this.router.route(input.message);
  }

  async *chat(input: ChatInput): AsyncIterable<ChatEvent> {
    const intent = this.router.route(input.message);
    if (intent.mode === 'town_search') {
      const results = await this.search({ query: input.message, townCode: input.townCode });
      if (results.length) {
        yield { type: 'text_delta', text: '我在城关镇找到了这些信息：' };
        yield { type: 'cards', cards: results.map((item) => item.card) };
        yield {
          type: 'sources',
          sources: results.map((item) => ({
            type: 'platform' as const,
            postId: item.card.id,
            title: item.card.title,
          })),
        };
      } else {
        yield { type: 'text_delta', text: '暂时没有匹配到本镇信息。' };
        yield {
          type: 'action',
          action: { type: 'create_draft', draftId: 'draft-' + input.sessionId, requiresConfirmation: true },
        };
      }
      return;
    }

    if (intent.mode === 'current_qa') {
      yield { type: 'text_delta', text: '这是需要实时核验的问题，接入 WebSearchProvider 后会返回带来源的最新结果。' };
      yield { type: 'sources', sources: [{ type: 'model', label: 'general_knowledge' }] };
      return;
    }

    if (intent.mode === 'draft_creation') {
      yield { type: 'text_delta', text: '我可以先把这句话整理成发布草稿，确认后再保存。' };
      yield {
        type: 'action',
        action: { type: 'create_draft', draftId: 'draft-' + input.sessionId, requiresConfirmation: true },
      };
      return;
    }

    yield { type: 'text_delta', text: '可以。我会结合问题给出实用建议；涉及本镇信息时，可以切换到平台信息查询。' };
    yield { type: 'sources', sources: [{ type: 'model', label: 'general_knowledge' }] };
  }

  async search(input: SearchInput): Promise<SearchResult[]> {
    const query = input.query;
    const matched = cards.filter(({ card }) => {
      const haystack = card.title + ' ' + card.summary + ' ' + card.category;
      return (
        (query.includes('玉米') && haystack.includes('玉米')) ||
        (query.includes('装车') && haystack.includes('装车')) ||
        (query.includes('农机') && haystack.includes('农机'))
      );
    });
    return matched.filter(({ card }) => !input.townCode || card.townCode === input.townCode).slice(0, input.limit || 5);
  }

  async extract(input: ExtractInput): Promise<PostDraft> {
    const draftId = 'draft-' + Date.now();
    const title = input.text.trim().slice(0, 42) || '本镇需求';
    return {
      id: draftId,
      title,
      category: input.category || null,
      townCode: input.townCode || null,
      body: input.text.trim(),
      missingFields: input.townCode ? [] : ['townCode'],
      warnings: [],
      status: 'draft',
    };
  }
}

