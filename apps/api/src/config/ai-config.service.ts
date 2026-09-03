import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AiCapability, AiCapabilityRoute, AiProviderProfile, ProviderInput } from './ai-config.types';

@Injectable()
export class AiConfigService {
  private readonly providers = new Map<string, AiProviderProfile>([['mock', { id: 'mock', name: '本地 Mock', protocol: 'mock', baseUrl: null, apiKey: null, model: 'mock', timeoutMs: 3000, maxTokens: 1200, enabled: true }]]);
  private readonly routes = new Map<AiCapability, AiCapabilityRoute>([
    ['general_chat', { capability: 'general_chat', primaryProviderId: 'mock', fallbackProviderId: null, enabled: true }],
    ['town_search', { capability: 'town_search', primaryProviderId: 'mock', fallbackProviderId: null, enabled: true }],
    ['post_field_extraction', { capability: 'post_field_extraction', primaryProviderId: 'mock', fallbackProviderId: null, enabled: true }],
  ]);

  listProviders() { return [...this.providers.values()].map((provider) => this.publicProvider(provider)); }
  listRoutes() { return [...this.routes.values()].map((route) => ({ ...route })); }
  createProvider(input: ProviderInput): AiProviderProfile {
    const profile = this.normalize(input);
    const record = { ...profile, id: `provider-${randomUUID()}` };
    this.providers.set(record.id, record); return this.publicProvider(record);
  }
  updateProvider(id: string, input: ProviderInput): AiProviderProfile | undefined {
    const current = this.providers.get(id); if (!current) return undefined;
    const next = this.normalize({ ...current, ...input, apiKey: input.apiKey === undefined ? current.apiKey : input.apiKey });
    const record = { ...next, id }; this.providers.set(id, record); return this.publicProvider(record);
  }
  setRoute(capability: AiCapability, primaryProviderId: string, fallbackProviderId: string | null, enabled = true): AiCapabilityRoute {
    if (!this.providers.has(primaryProviderId)) throw new Error('provider_not_found');
    if (fallbackProviderId && !this.providers.has(fallbackProviderId)) throw new Error('provider_not_found');
    const route = { capability, primaryProviderId, fallbackProviderId, enabled }; this.routes.set(capability, route); return { ...route };
  }
  resolve(capability: AiCapability): AiProviderProfile | undefined {
    const route = this.routes.get(capability); const provider = route && this.providers.get(route.primaryProviderId);
    return route?.enabled && provider?.enabled ? { ...provider } : undefined;
  }
  private normalize(input: ProviderInput): Omit<AiProviderProfile, 'id'> {
    const protocol = input.protocol || 'openai-compatible';
    const baseUrl = input.baseUrl === undefined ? null : input.baseUrl;
    if (protocol === 'openai-compatible' && baseUrl && !/^https:\/\//i.test(baseUrl)) throw new Error('base_url_must_use_https');
    const timeoutMs = input.timeoutMs ?? 15000; const maxTokens = input.maxTokens ?? 2000;
    if (timeoutMs < 500 || timeoutMs > 120000 || maxTokens < 1 || maxTokens > 100000) throw new Error('provider_limits_invalid');
    return { name: input.name?.trim() || '未命名 Provider', protocol, baseUrl, apiKey: input.apiKey || null, model: input.model?.trim() || 'default', timeoutMs, maxTokens, enabled: input.enabled ?? true };
  }
  private publicProvider(provider: AiProviderProfile): AiProviderProfile { return { ...provider, apiKey: provider.apiKey ? `${provider.apiKey.slice(0, 4)}***${provider.apiKey.slice(-4)}` : null }; }
}
