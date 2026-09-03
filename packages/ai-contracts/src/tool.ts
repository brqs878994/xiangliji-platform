export interface AgentContext {
  sessionId: string;
  userId: string | null;
  townCode: string;
  requestId: string;
}

export interface ToolResult {
  ok: boolean;
  data?: unknown;
  errorCode?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: object;
  requiresLogin: boolean;
  requiresConfirmation: boolean;
  execute(input: unknown, context: AgentContext): Promise<ToolResult>;
}

