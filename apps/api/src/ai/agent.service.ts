import { Injectable } from '@nestjs/common';
import type { AgentContext, ChatEvent, ChatInput } from '@xiangliji/ai-contracts';
import { MockProvider } from './mock.provider';
import { CreateDraftTool } from './tools/create-draft.tool';
import { AiConfigService } from '../config/ai-config.service';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';

@Injectable()
export class AgentService {
  private readonly mockProvider = new MockProvider();

  constructor(private readonly configService: AiConfigService = new AiConfigService()) {}

  async *stream(input: ChatInput): AsyncIterable<ChatEvent> {
    const requestId = 'run-' + Date.now();

    const intent = await this.mockProvider.classifyIntent({ message: input.message, townCode: input.townCode });
    const configured = this.configService.resolve('general_chat');
    if (configured?.protocol === 'openai-compatible' && (intent.mode === 'general_qa' || intent.mode === 'current_qa')) {
      try {
        const provider = new OpenAiCompatibleProvider(configured);
        for await (const event of provider.chat(input)) yield event;
        yield { type: 'done', runId: requestId };
        return;
      } catch {
        yield { type: 'warning', code: 'provider_fallback', message: '外部模型暂时不可用，已切换本地回答' };
      }
    }

    for await (const event of this.mockProvider.chat(input)) {
      if (event.type === 'action' && event.action.type === 'create_draft' && !input.userId) {
        yield { type: 'warning', code: 'login_required', message: '登录后才能保存发布草稿' };
      }
      yield event;
    }

    yield { type: 'done', runId: requestId };
  }

  async classifyIntent(input: { message: string; townCode: string }) {
    return this.mockProvider.classifyIntent(input);
  }

  async executeDraft(input: { text: string }, context: AgentContext) {
    const configured = this.configService.resolve('post_field_extraction');
    if (configured?.protocol === 'openai-compatible') {
      try { return await new OpenAiCompatibleProvider(configured).extract({ text: input.text, townCode: context.townCode }); } catch { /* fall back to deterministic tool */ }
    }
    return new CreateDraftTool().execute(input, context);
  }
}
