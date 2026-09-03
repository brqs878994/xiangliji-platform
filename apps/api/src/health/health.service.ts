import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  status() {
    return { status: 'ok' as const, service: 'api' as const };
  }
}

