import type { AgentMode, IntentResult } from '@xiangliji/ai-contracts';

const platformTerms = /有没有人.*收|收玉米|收荔枝|装车|农机|招工|零工|二手|拼车|求购|本镇|附近/;
const draftTerms = /发布|找[一二两三四五六七八九十0-9]+个|求购|招工|帮我发|找活/;
const currentTerms = /今天|现在|最新|当前|实时|天气|价格走势|通知/;

export class AgentRouter {
  route(message: string): IntentResult {
    const text = message.trim();
    if (draftTerms.test(text) && !/有没有人|附近/.test(text)) {
      return { mode: 'draft_creation', confidence: 0.94, needsWebSearch: false };
    }
    if (currentTerms.test(text)) {
      return { mode: 'current_qa', confidence: 0.88, needsWebSearch: true };
    }
    if (platformTerms.test(text)) {
      return { mode: 'town_search', confidence: 0.96, needsWebSearch: false };
    }
    return { mode: 'general_qa', confidence: 0.72, needsWebSearch: false };
  }
}
