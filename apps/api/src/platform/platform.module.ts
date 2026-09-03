import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { InMemoryPlatformRepository } from './in-memory.repository';

@Module({ controllers: [PlatformController], providers: [InMemoryPlatformRepository], exports: [InMemoryPlatformRepository] })
export class PlatformModule {}
