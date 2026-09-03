import { Injectable } from '@nestjs/common';
import type { AgentContext, ChatEvent, ChatInput } from '@xiangliji/ai-contracts';
import { MockProvider } from './mock.provider';
import { CreateDraftTool } from './tools/create-draft.tool';

@Injectable()
export class AgentService {
  private readonly mockProvider = new MockProvider();

  async *stream(input: ChatInput): AsyncIterable<ChatEvent> {
    const requestId = 'run-' + Date.now();

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
    return new CreateDraftTool().execute(input, context);
  }
}

