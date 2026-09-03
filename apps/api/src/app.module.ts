import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
