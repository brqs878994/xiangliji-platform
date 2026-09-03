import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AgentService } from './agent.service';
import { AiConfigModule } from '../config/ai-config.module';

@Module({
  imports: [AiConfigModule],
  controllers: [AiController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AiModule {}
