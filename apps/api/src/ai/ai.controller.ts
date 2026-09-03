import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { ChatEvent, ChatInput } from '@xiangliji/ai-contracts';
import { AgentService } from './agent.service';

interface ChatBody {
  message?: string;
  sessionId?: string;
  userId?: string | null;
  townCode?: string;
  history?: ChatInput['history'];
}

@Controller('ai')
export class AiController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat/stream')
  async chatStream(@Body() body: ChatBody, @Res() response: Response) {
    const input: ChatInput = {
      message: body.message?.trim() || '',
      sessionId: body.sessionId || 'session-demo',
      userId: body.userId || null,
      townCode: body.townCode || 'chengguan',
      history: (body.history || []).slice(-3),
    };

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');

    if (!input.message) {
      const error: ChatEvent = { type: 'error', code: 'invalid_request', message: 'message 不能为空' };
      response.write('event: ' + error.type + '\ndata: ' + JSON.stringify(error) + '\n\n');
      response.end();
      return;
    }

    try {
      for await (const event of this.agentService.stream(input)) {
        response.write('event: ' + event.type + '\ndata: ' + JSON.stringify(event) + '\n\n');
      }
    } catch {
      const error: ChatEvent = { type: 'error', code: 'internal_error', message: 'AI 暂时不可用，请稍后重试' };
      response.write('event: ' + error.type + '\ndata: ' + JSON.stringify(error) + '\n\n');
    } finally {
      response.end();
    }
  }
}

