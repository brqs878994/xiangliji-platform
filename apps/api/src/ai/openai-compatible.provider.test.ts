import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';

afterEach(() => vi.unstubAllGlobals());

describe('OpenAiCompatibleProvider', () => {
  it('calls the configured chat completions endpoint and emits text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '模型回答' } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const provider = new OpenAiCompatibleProvider({ id: 'p1', name: 'Relay', protocol: 'openai-compatible', baseUrl: 'https://example.com/v1', apiKey: 'sk-live', model: 'demo', timeoutMs: 2000, maxTokens: 1000, enabled: true });
    const events = [];
    for await (const event of provider.chat({ sessionId: 's1', userId: null, townCode: 'chengguan', message: '你好', history: [] })) events.push(event);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/v1/chat/completions', expect.objectContaining({ method: 'POST' }));
    expect(events[0]).toEqual({ type: 'text_delta', text: '模型回答' });
  });
});
