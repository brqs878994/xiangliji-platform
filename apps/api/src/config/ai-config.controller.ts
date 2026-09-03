import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { AiConfigService } from './ai-config.service';
import type { AiCapability, ProviderInput } from './ai-config.types';

@Controller('admin/ai')
export class AiConfigController {
  constructor(private readonly service: AiConfigService) {}
  @Get('providers') listProviders() { return { items: this.service.listProviders() }; }
  @Post('providers') createProvider(@Body() body: ProviderInput) { return this.wrap(() => this.service.createProvider(body)); }
  @Patch('providers/:id') updateProvider(@Param('id') id: string, @Body() body: ProviderInput) { const result = this.service.updateProvider(id, body); if (!result) throw new HttpException({ code: 'not_found', message: 'Provider 不存在' }, HttpStatus.NOT_FOUND); return result; }
  @Get('routes') listRoutes() { return { items: this.service.listRoutes() }; }
  @Put('routes/:capability') setRoute(@Param('capability') capability: AiCapability, @Body() body: { primaryProviderId?: string; fallbackProviderId?: string | null; enabled?: boolean }) { if (!body.primaryProviderId) throw new HttpException({ code: 'invalid_request', message: 'primaryProviderId 不能为空' }, HttpStatus.BAD_REQUEST); return this.wrap(() => this.service.setRoute(capability, body.primaryProviderId!, body.fallbackProviderId || null, body.enabled ?? true)); }
  private wrap<T>(action: () => T): T { try { return action(); } catch (error) { const message = error instanceof Error ? error.message : '配置无效'; throw new HttpException({ code: 'invalid_request', message }, HttpStatus.BAD_REQUEST); } }
}
