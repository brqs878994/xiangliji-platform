import { randomUUID } from 'node:crypto';
import type { AgentContext, AgentTool, ToolResult } from '@xiangliji/ai-contracts';

export class CreateDraftTool implements AgentTool {
  readonly name = 'create_draft';
  readonly description = '创建待用户确认的发布草稿';
  readonly inputSchema = { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] };
  readonly requiresLogin = true;
  readonly requiresConfirmation = true;

  async execute(input: unknown, context: AgentContext): Promise<ToolResult> {
    if (!context.userId) {
      return { ok: false, errorCode: 'login_required' };
    }

    const text = typeof input === 'object' && input !== null && 'text' in input
      ? String((input as { text: unknown }).text)
      : '';

    return {
      ok: true,
      data: {
        draftId: 'draft-' + randomUUID(),
        body: text,
        status: 'draft',
        requiresConfirmation: true,
      },
    };
  }
}

