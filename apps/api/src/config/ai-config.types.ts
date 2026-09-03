export type AiCapability = 'general_chat' | 'town_search' | 'post_field_extraction';
export type ProviderProtocol = 'openai-compatible' | 'mock';

export interface AiProviderProfile { id: string; name: string; protocol: ProviderProtocol; baseUrl: string | null; apiKey: string | null; model: string; timeoutMs: number; maxTokens: number; enabled: boolean; }
export interface AiCapabilityRoute { capability: AiCapability; primaryProviderId: string; fallbackProviderId: string | null; enabled: boolean; }
export interface ProviderInput { name?: string; protocol?: ProviderProtocol; baseUrl?: string | null; apiKey?: string | null; model?: string; timeoutMs?: number; maxTokens?: number; enabled?: boolean; }
