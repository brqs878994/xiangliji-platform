import type { ChatEvent, ChatInput, ExtractInput, LlmProvider } from '@xiangliji/ai-contracts';
import type { PostDraft } from '@xiangliji/domain';
import type { AiProviderProfile } from '../config/ai-config.types';

export class OpenAiCompatibleProvider implements LlmProvider {
  constructor(private readonly profile: AiProviderProfile) {}

  async *chat(input: ChatInput): AsyncIterable<ChatEvent> {
    const payload = await this.request({
      messages: [{ role: 'system', content: '你是乡里集县域生活助手。用简洁、可信、可执行的中文回答。' }, ...input.history, { role: 'user', content: input.message }],
    });
    const text = this.readText(payload) || '暂时没有拿到模型回复，请稍后再试。';
    yield { type: 'text_delta', text };
    yield { type: 'sources', sources: [{ type: 'model', label: 'general_knowledge' }] };
  }

  async extract(input: ExtractInput): Promise<PostDraft> {
    const payload = await this.request({
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: '从用户文本提取发布草稿 JSON，只返回 title、category、townCode、body、missingFields、warnings。' },
        { role: 'user', content: JSON.stringify(input) },
      ],
    });
    const text = this.readText(payload);
    const parsed = JSON.parse(text) as Partial<PostDraft>;
    return {
      id: `draft-${Date.now()}`,
      title: parsed.title || input.text.trim().slice(0, 42) || '本镇需求',
      category: parsed.category || input.category || null,
      townCode: parsed.townCode || input.townCode || null,
      body: parsed.body || input.text.trim(),
      missingFields: parsed.missingFields || [],
      warnings: parsed.warnings || [],
      status: 'draft',
    };
  }

  private async request(body: Record<string, unknown>): Promise<any> {
    if (!this.profile.baseUrl || !this.profile.apiKey) throw new Error('provider_not_configured');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.profile.timeoutMs);
    try {
      const response = await fetch(`${this.profile.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.profile.apiKey}` },
        body: JSON.stringify({ model: this.profile.model, max_tokens: this.profile.maxTokens, temperature: 0.2, ...body }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`provider_http_${response.status}`);
      return response.json();
    } finally { clearTimeout(timer); }
  }

  private readText(payload: any): string { return payload?.choices?.[0]?.message?.content || payload?.choices?.[0]?.text || ''; }
}
