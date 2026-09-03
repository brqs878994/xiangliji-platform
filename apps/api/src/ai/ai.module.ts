import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AgentService } from './agent.service';

@Module({
  controllers: [AiController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AiModule {}

