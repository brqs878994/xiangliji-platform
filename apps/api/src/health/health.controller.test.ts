import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('returns the API health payload', () => {
    const controller = new HealthController(new HealthService());
    expect(controller.getHealth()).toEqual({ status: 'ok', service: 'api' });
  });
});

