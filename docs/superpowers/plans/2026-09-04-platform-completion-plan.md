# 乡里集首期闭环完善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按需求规格和高保真交付说明补齐首期查找、发布、回应、回访和运营配置闭环。

**Architecture:** 保持 NestJS 模块化单体和 Taro 双端客户端。业务状态继续由平台 Repository 管理，客户端通过已有 service 访问 API；页面新增详情、消息和我的视图，复用现有视觉 Token 和高保真布局节奏。

**Tech Stack:** NestJS, TypeScript, Taro 4, React 18, SCSS, Vitest, Playwright。

## Global Constraints

- H5 与微信小程序共用 HTTP 契约和业务组件。
- 普通信息发布后立即展示，同时保留异步审核记录；驳回时自动下架。
- AI Provider 按能力可配置，API Key 只在服务端保存并掩码返回。
- 不改写 `high-fi-home/` 原型，不引入与现有 Token 冲突的视觉系统。

---

### Task 1: 完善平台数据接口

**Files:**
- Modify: `apps/api/src/platform/platform.types.ts`
- Modify: `apps/api/src/platform/in-memory.repository.ts`
- Modify: `apps/api/src/platform/platform.controller.ts`
- Modify: `apps/client/src/services/platform.ts`

**Deliverable:** 详情响应、我的信息、状态更新、举报和搜索接口可用。

### Task 2: 补齐 Explore / Detail 浏览闭环

**Files:**
- Modify: `apps/client/src/pages/explore/index.tsx`
- Create: `apps/client/src/pages/detail/index.tsx`
- Create: `apps/client/src/pages/detail/detail.scss`
- Modify: `apps/client/src/app.config.ts`

**Deliverable:** 卡片进入详情，详情可收藏、联系、报名、举报并返回列表。

### Task 3: 完善 Publish 草稿闭环

**Files:**
- Modify: `apps/client/src/pages/publish/index.tsx`
- Modify: `apps/client/src/pages/publish/publish.scss`

**Deliverable:** 草稿自动保存/恢复、AI 提取结果可编辑、分类和有效期可调整、提交后状态明确。

### Task 4: 完善 AI Assistant

**Files:**
- Modify: `apps/client/src/pages/ai/index.tsx`
- Modify: `apps/client/src/pages/ai/ai.scss`

**Deliverable:** 展示平台卡片和来源，卡片可进入详情，无结果时“帮我发布”进入发布页并携带原问题。

### Task 5: 补齐 Messages / Mine / Admin 配置

**Files:**
- Create: `apps/client/src/pages/messages/index.tsx`
- Create: `apps/client/src/pages/messages/messages.scss`
- Create: `apps/client/src/pages/mine/index.tsx`
- Create: `apps/client/src/pages/mine/mine.scss`
- Modify: `apps/client/src/pages/admin/index.tsx`
- Modify: `apps/client/src/pages/admin/admin.scss`
- Modify: `apps/client/src/app.config.ts`

**Deliverable:** 消息安全提示、我的信息状态和 Provider/路由配置可操作。

### Task 6: 回归验证与交付

**Files:**
- Modify: `README.md`
- Test: `apps/api/src/platform/platform.controller.test.ts`
- Test: `apps/api/src/platform/in-memory.repository.test.ts`

**Deliverable:** API/client tests、H5/微信构建、四尺寸浏览器检查和 Git 推送全部通过。
