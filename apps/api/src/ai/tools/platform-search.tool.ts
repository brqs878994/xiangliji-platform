import type { AgentContext, AgentTool, SearchProvider, ToolResult } from '@xiangliji/ai-contracts';

export class PlatformSearchTool implements AgentTool {
  readonly name = 'search_platform_posts';
  readonly description = '查询指定乡镇内已发布的信息';
  readonly inputSchema = { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] };
  readonly requiresLogin = false;
  readonly requiresConfirmation = false;

  constructor(private readonly provider: SearchProvider) {}

  execute(input: unknown, context: AgentContext): Promise<ToolResult> {
    const query = typeof input === 'object' && input !== null && 'query' in input
      ? String((input as { query: unknown }).query)
      : '';

    return this.provider.search({ query, townCode: context.townCode }).then((results) => ({
      ok: true,
      data: results,
    }));
  }
}

