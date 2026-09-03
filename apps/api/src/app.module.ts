import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { AiModule } from './ai/ai.module';
import { PlatformModule } from './platform/platform.module';
import { AiConfigModule } from './config/ai-config.module';

@Module({
  imports: [AiModule, PlatformModule, AiConfigModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
