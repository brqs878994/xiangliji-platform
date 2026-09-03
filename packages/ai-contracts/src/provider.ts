import type { AiGateway } from './gateway';
import type { ChatEvent, ChatInput, ExtractInput, SearchInput, SearchResult } from './types';
import type { PostDraft } from '@xiangliji/domain';

export interface LlmProvider {
  chat(input: ChatInput): AsyncIterable<ChatEvent>;
  extract(input: ExtractInput): Promise<PostDraft>;
}

export interface SearchProvider {
  search(input: SearchInput): Promise<SearchResult[]>;
}

export type ProviderProtocol = 'openai-compatible' | 'web-search' | 'asr' | 'embedding' | 'moderation' | 'tts' | 'mock';

export interface ProviderProfile {
  id: string;
  name: string;
  protocol: ProviderProtocol;
  baseUrl: string | null;
  modelName: string | null;
  timeoutMs: number;
  enabled: boolean;
  fallbackProviderId: string | null;
}

export type { AiGateway };

