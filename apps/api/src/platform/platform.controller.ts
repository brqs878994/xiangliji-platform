import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { InMemoryPlatformRepository } from './in-memory.repository';

interface DraftBody { userId?: string; title?: string; category?: string; townCode?: string; body?: string; validDays?: number; confirmed?: boolean; }
interface ResponseBody { userId?: string; type?: 'contact' | 'signup' | 'favorite'; message?: string; }

@Controller()
export class PlatformController {
  constructor(private readonly repository: InMemoryPlatformRepository) {}

  @Get('categories')
  listCategories() { return { items: this.repository.listCategories() }; }

  @Get('towns')
  listTowns() { return { items: this.repository.listTowns() }; }

  @Get('posts')
  listPosts(@Query('townCode') townCode?: string, @Query('category') category?: string, @Query('keyword') keyword?: string) {
    return { items: this.repository.listPosts({ townCode, category, keyword }) };
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    const post = this.repository.getPost(id);
    if (!post) throw new HttpException({ code: 'not_found', message: '信息不存在或已下架' }, HttpStatus.NOT_FOUND);
    return post;
  }

  @Post('posts/drafts')
  createDraft(@Body() body: DraftBody) {
    if (!body.userId || !body.title?.trim() || !body.category?.trim() || !body.townCode?.trim() || !body.body?.trim()) {
      throw new HttpException({ code: 'invalid_request', message: 'userId、title、category、townCode、body 均不能为空' }, HttpStatus.BAD_REQUEST);
    }
    return this.repository.createDraft({ userId: body.userId, title: body.title.trim(), category: body.category.trim(), townCode: body.townCode.trim(), body: body.body.trim(), validDays: body.validDays });
  }

  @Patch('posts/drafts/:id')
  updateDraft(@Param('id') id: string, @Body() body: DraftBody) {
    if (!body.userId) throw new HttpException({ code: 'login_required', message: '登录后才能编辑草稿' }, HttpStatus.UNAUTHORIZED);
    const draft = this.repository.updateDraft(id, body.userId, { title: body.title?.trim(), category: body.category?.trim(), townCode: body.townCode?.trim(), body: body.body?.trim(), validDays: body.validDays });
    if (!draft) throw new HttpException({ code: 'not_found', message: '草稿不存在或不可编辑' }, HttpStatus.NOT_FOUND);
    return draft;
  }

  @Post('posts/drafts/:id/submit-review')
  submitDraft(@Param('id') id: string, @Body() body: DraftBody) {
    if (!body.userId) throw new HttpException({ code: 'login_required', message: '登录后才能提交审核' }, HttpStatus.UNAUTHORIZED);
    try { return this.repository.submitDraft(id, body.userId, body.confirmed === true); }
    catch (error) {
      const message = error instanceof Error && error.message === 'confirmation_required' ? '提交审核前需要确认' : '草稿不存在或状态不可提交';
      throw new HttpException({ code: 'invalid_request', message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('admin/audits')
  listAudits() {
    return { items: this.repository.listAudits().map((audit) => ({ ...audit, draft: this.repository.getDraft(audit.draftId) || null })) };
  }

  @Get('admin/stats')
  adminStats() {
    const posts = this.repository.listPosts({});
    const audits = this.repository.listAudits();
    return { publishedPosts: posts.length, pendingAudits: audits.filter((item) => item.status === 'pending').length, categories: this.repository.listCategories().length, towns: this.repository.listTowns().length };
  }

  @Post('admin/audits/:id/approve')
  approve(@Param('id') id: string, @Body() body: { confirmed?: boolean }) {
    if (body.confirmed !== true) throw new HttpException({ code: 'confirmation_required', message: '审核操作需要确认' }, HttpStatus.BAD_REQUEST);
    const post = this.repository.reviewAudit(id, true);
    if (!post) throw new HttpException({ code: 'not_found', message: '审核记录不存在或已处理' }, HttpStatus.NOT_FOUND);
    return post;
  }

  @Post('admin/audits/:id/reject')
  reject(@Param('id') id: string, @Body() body: { confirmed?: boolean; reason?: string }) {
    if (body.confirmed !== true) throw new HttpException({ code: 'confirmation_required', message: '审核操作需要确认' }, HttpStatus.BAD_REQUEST);
    const audit = this.repository.listAudits().find((item) => item.id === id);
    if (!audit || audit.status !== 'pending') throw new HttpException({ code: 'not_found', message: '审核记录不存在或已处理' }, HttpStatus.NOT_FOUND);
    this.repository.reviewAudit(id, false, body.reason || '未通过平台审核');
    return { ...audit, status: 'rejected', reason: body.reason || '未通过平台审核' };
  }

  @Post('posts/:id/responses')
  addResponse(@Param('id') id: string, @Body() body: ResponseBody) {
    if (!body.userId || !body.type) throw new HttpException({ code: 'invalid_request', message: 'userId 和 type 不能为空' }, HttpStatus.BAD_REQUEST);
    const response = this.repository.addResponse(id, { userId: body.userId, type: body.type, message: body.message });
    if (!response) throw new HttpException({ code: 'not_found', message: '信息不存在或已下架' }, HttpStatus.NOT_FOUND);
    return response;
  }

  @Get('posts/:id/responses')
  listResponses(@Param('id') id: string) { return { items: this.repository.listResponses(id) }; }

  @Delete('posts/:id/responses')
  removeResponse(@Param('id') id: string, @Query('userId') userId?: string, @Query('type') type?: ResponseBody['type']) {
    if (!userId || !type) throw new HttpException({ code: 'invalid_request', message: 'userId 和 type 不能为空' }, HttpStatus.BAD_REQUEST);
    const response = this.repository.removeResponse(id, userId, type);
    if (!response) throw new HttpException({ code: 'not_found', message: '收藏记录不存在' }, HttpStatus.NOT_FOUND);
    return response;
  }
}
