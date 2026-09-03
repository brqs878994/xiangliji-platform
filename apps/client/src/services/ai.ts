import Taro from '@tarojs/taro';
import type { ChatEvent } from '@xiangliji/ai-contracts';
import type { ChatRequest } from './api';

function parseSseBlock(block: string): ChatEvent | null {
  const eventLine = block.split(/\r?\n/).find((line) => line.startsWith('event: '));
  const dataLine = block.split(/\r?\n/).find((line) => line.startsWith('data: '));
  if (!eventLine || !dataLine) return null;

  try {
    return JSON.parse(dataLine.slice(6)) as ChatEvent;
  } catch {
    return null;
  }
}

export async function streamChat(
  input: ChatRequest,
  onEvent: (event: ChatEvent) => void,
): Promise<void> {
  const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;
  const base = runtimeEnv?.TARO_APP_API_BASE_URL || 'http://127.0.0.1:3000';
  if (typeof window !== 'undefined' || runtimeEnv?.TARO_ENV === 'h5') {
    const response = await fetch(base + '/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(input),
    });
    if (!response.ok || !response.body) throw new Error('stream_unavailable');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      pending += decoder.decode(chunk.value, { stream: true });
      const blocks = pending.split(/\r?\n\r?\n/);
      pending = blocks.pop() || '';
      blocks.forEach((block) => {
        const event = parseSseBlock(block);
        if (event) onEvent(event);
      });
    }
    const last = parseSseBlock(pending);
    if (last) onEvent(last);
    return;
  }

  const result = await Taro.request<string>({
    url: base + '/ai/chat/stream',
    method: 'POST',
    data: input,
    header: { 'content-type': 'application/json', accept: 'text/event-stream' },
    responseType: 'text',
  });
  const raw = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
  raw.split(/\r?\n\r?\n/).forEach((block) => {
    const event = parseSseBlock(block);
    if (event) onEvent(event);
  });
}
