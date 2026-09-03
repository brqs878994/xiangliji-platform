import { describe, expect, it } from 'vitest';
import { AiConfigService } from './ai-config.service';

describe('AiConfigService', () => {
  it('masks keys and resolves independent capability routes', () => {
    const service = new AiConfigService();
    const provider = service.createProvider({ name: 'Relay', baseUrl: 'https://example.com/v1', apiKey: 'sk-test-1234', model: 'demo' });
    expect(provider.apiKey).toBe('sk-t***1234');
    service.setRoute('general_chat', provider.id, 'mock');
    expect(service.resolve('general_chat')?.id).toBe(provider.id);
  });

  it('rejects insecure provider URLs', () => {
    const service = new AiConfigService();
    expect(() => service.createProvider({ baseUrl: 'http://127.0.0.1:8080' })).toThrow('base_url_must_use_https');
  });
});
