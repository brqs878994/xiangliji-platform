# 工程地基与智能体壳层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立乡里集双端 monorepo、NestJS API、Taro 客户端和可插拔 Mock 智能体，让 H5/微信小程序完成“提问 → SSE 回答 → 信息卡片/发布草稿动作”的第一周演示闭环。

**Architecture:** 采用 pnpm workspace 的模块化单体。客户端使用 Taro + React + TypeScript，API 使用 NestJS；共享包提供领域类型、错误码和 AI Provider/Tool 契约。首期使用 MockProvider，不连接真实模型；MySQL/Redis 通过 Docker Compose 预留本地运行环境。

**Tech Stack:** Node.js 22、pnpm 11、TypeScript、Taro + React、NestJS、Zod、Vitest、Playwright、Docker Compose、MySQL 8、Redis 7。

## Global Constraints

- 首期同时支持 H5 和微信小程序。
- 业务层只依赖 `AiGateway`，禁止直接导入模型供应商 SDK。
- 智能体只调用白名单工具，不能直接访问数据库、拼接 SQL 或访问任意 HTTP 地址。
- 平台结果必须携带 `post_id`；生成发布草稿必须经过用户确认，不能自动发布。
- 没有真实 API Key 时必须使用 `MockProvider` 完成演示。
- API Key 只保存在服务端环境变量或密钥管理中，禁止写入 Git。
- 所有代码通过 TypeScript 类型检查、单元测试和至少一条 Playwright 流程测试。
- 不提交现有 `output/`、`.playwright-cli/`、`__pycache__/` 和临时脚本。
- 现有 `high-fi-home/` 只作为视觉回归基准，不删除、不覆盖、不重写。

---

### Task 1: 初始化 monorepo 与本地开发命令

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.editorconfig`
- Create: `.env.example`
- Create: `README.md`
- Create: `apps/client/`, `apps/api/`, `packages/shared/`, `packages/domain/`, `packages/ai-contracts/`, `infra/`, `tests/`

**Interfaces:**
- Produces workspace packages `@xiangliji/client`, `@xiangliji/api`, `@xiangliji/shared`, `@xiangliji/domain`, `@xiangliji/ai-contracts`.
- Produces root commands `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm dev:api`, `pnpm dev:h5`.

- [ ] **Step 1: Write the workspace manifest**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
  - tests/*
```

Create the root `package.json` with scripts delegating to workspace packages:

```json
{
  "name": "xiangliji-platform",
  "private": true,
  "packageManager": "pnpm@11.19.0",
  "scripts": {
    "typecheck": "pnpm -r --if-present typecheck",
    "test": "pnpm -r --if-present test",
    "lint": "pnpm -r --if-present lint",
    "dev:api": "pnpm --filter @xiangliji/api dev",
    "dev:h5": "pnpm --filter @xiangliji/client dev:h5",
    "build:h5": "pnpm --filter @xiangliji/client build:h5",
    "build:weapp": "pnpm --filter @xiangliji/client build:weapp"
  }
}
```

- [ ] **Step 2: Add shared defaults**

Create `tsconfig.base.json` with strict TypeScript, source maps, and bundler-compatible module resolution. Create `.editorconfig` using UTF-8, two spaces, LF, and a final newline.

- [ ] **Step 3: Add safe environment examples**

Create `.env.example`:

```dotenv
NODE_ENV=development
API_PORT=3000
MYSQL_URL=mysql://xiangliji:xiangliji@127.0.0.1:3306/xiangliji
REDIS_URL=redis://127.0.0.1:6379
AI_DEFAULT_PROVIDER=mock
AI_GENERAL_CHAT_PROVIDER=mock
AI_TOWN_SEARCH_PROVIDER=mock
AI_WEB_SEARCH_PROVIDER=mock
```

- [ ] **Step 4: Document the local workflow**

Document `pnpm install`, `pnpm dev:api`, `pnpm dev:h5`, `pnpm build:weapp`, tests, Docker startup, and the rule that real credentials belong in `.env.local`.

- [ ] **Step 5: Verify the empty workspace**

Run:

```powershell
pnpm install
pnpm typecheck
pnpm test
```

Expected: all commands complete successfully with no application package errors.

### Task 2: 建立共享领域类型与智能体契约

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/src/errors.ts`
- Create: `packages/shared/src/events.ts`
- Create: `packages/domain/package.json`
- Create: `packages/domain/src/post.ts`
- Create: `packages/ai-contracts/package.json`
- Create: `packages/ai-contracts/src/types.ts`
- Create: `packages/ai-contracts/src/gateway.ts`
- Create: `packages/ai-contracts/src/provider.ts`
- Create: `packages/ai-contracts/src/tool.ts`
- Test: `packages/ai-contracts/src/types.test.ts`

**Interfaces:**
- Consumes: `tsconfig.base.json` from Task 1.
- Produces: `AiGateway`, `LlmProvider`, `SearchProvider`, `AgentTool`, `ChatEvent`, `PostCard`, `PostDraft`, and `PostStatus`.

- [ ] **Step 1: Define domain types**

Implement:

```ts
export type PostStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'closed'
  | 'expired'
  | 'removed'
  | 'rejected';

export interface PostCard {
  id: string;
  category: string;
  title: string;
  townCode: string;
  townName: string;
  distanceKm: number | null;
  publishedAt: string;
  validUntil: string;
  summary: string;
  responseLabel: string | null;
}
```

- [ ] **Step 2: Define stream events and sources**

Implement discriminated `ChatEvent` variants `text_delta`, `cards`, `sources`, `action`, `warning`, `error`, and `done`. Define `AnswerSource` variants `platform`, `web`, and `model`; platform sources require `postId`, web sources require `title` and `url`.

- [ ] **Step 3: Define gateway/provider interfaces**

Implement:

```ts
export interface AiGateway {
  classifyIntent(input: IntentInput): Promise<IntentResult>;
  chat(input: ChatInput): AsyncIterable<ChatEvent>;
  extractPostFields(input: ExtractInput): Promise<PostDraft>;
}

export interface LlmProvider {
  chat(input: ChatInput): AsyncIterable<ChatEvent>;
  extract(input: ExtractInput): Promise<PostDraft>;
}

export interface SearchProvider {
  search(input: SearchInput): Promise<SearchResult[]>;
}
```

`ChatInput` includes `sessionId`, nullable `userId`, `townCode`, `message`, `mode`, and at most the last three turns.

- [ ] **Step 4: Define tool permissions**

Implement `AgentTool` with `name`, `description`, `inputSchema`, `requiresLogin`, `requiresConfirmation`, and `execute(input, context)`. Define actions `open_post`, `create_draft`, and `create_subscription`.

- [ ] **Step 5: Test contract serialization**

Assert that representative `ChatEvent` and `AgentAction` objects serialize and preserve their discriminant fields.

Run:

```powershell
pnpm --filter @xiangliji/ai-contracts test
```

Expected: PASS.

### Task 3: 建立 Docker 本地依赖与 API 健康检查

**Files:**
- Create: `infra/docker-compose.yml`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.service.ts`
- Test: `apps/api/src/health/health.controller.test.ts`

**Interfaces:**
- Produces: `GET /health` returning `{ status: 'ok', service: 'api' }`.
- Produces local service names `mysql` and `redis`.

- [ ] **Step 1: Add MySQL and Redis services**

Create `infra/docker-compose.yml` with MySQL 8 and Redis 7, named volumes, health checks, and credentials matching `.env.example`. Do not mount production secrets.

- [ ] **Step 2: Scaffold NestJS**

Configure `dev`, `build`, `start`, `typecheck`, `test`, and `lint` scripts. Add NestJS core/common/platform-express, `reflect-metadata`, `rxjs`, `zod`, and test tooling.

- [ ] **Step 3: Implement health route**

`HealthService.status()` returns the exact object and `HealthController.getHealth()` exposes it with HTTP 200.

- [ ] **Step 4: Verify**

Run:

```powershell
docker compose -f infra/docker-compose.yml config
docker compose -f infra/docker-compose.yml up -d mysql redis
pnpm --filter @xiangliji/api dev
Invoke-RestMethod http://127.0.0.1:3000/health
```

Expected: Compose config is valid, containers become healthy, and the API returns the exact health object.

### Task 4: 实现 MockProvider、AgentRouter 和受控工具运行时

**Files:**
- Create: `apps/api/src/ai/mock.provider.ts`
- Create: `apps/api/src/ai/agent.router.ts`
- Create: `apps/api/src/ai/agent.service.ts`
- Create: `apps/api/src/ai/tools/platform-search.tool.ts`
- Create: `apps/api/src/ai/tools/create-draft.tool.ts`
- Create: `apps/api/src/ai/ai.module.ts`
- Modify: `apps/api/src/main.ts`
- Test: `apps/api/src/ai/agent.service.test.ts`

**Interfaces:**
- Consumes: contracts from Task 2.
- Produces: `POST /ai/chat/stream` as an SSE endpoint and deterministic MockProvider responses for `town_search`, `general_qa`, `current_qa`, and `draft_creation`.

- [ ] **Step 1: Create deterministic mock data**

Provide three platform cards for `收玉米`, `装车`, and `农机`; provide a general answer for `注意安全`; return a no-result action for other queries. Every platform card includes a stable `id` and `townCode`.

- [ ] **Step 2: Implement intent routing**

Implement `AgentRouter.route(message)`:

```text
platform terms or categories → town_search
current/time-sensitive terms   → current_qa
“发布/找两个/求购/招工”       → draft_creation
otherwise                      → general_qa
```

Return exactly one primary mode per request.

- [ ] **Step 3: Enforce tool permissions**

Register only `search_platform_posts`, `get_post_detail`, and `create_draft`. `create_draft` requires confirmation; anonymous calls emit `login_required` and do not persist data.

- [ ] **Step 4: Implement SSE**

Write each `ChatEvent` as:

```text
event: <event.type>
data: <JSON>

```

On failure emit one stable `error` event and close the stream.

- [ ] **Step 5: Test all modes**

Cover platform cards, general answer, current question routing, no-result draft action, and anonymous `login_required`. Run:

```powershell
pnpm --filter @xiangliji/api test -- agent.service.test.ts
```

Expected: PASS.

### Task 5: 建立 Taro 双端客户端壳层

**Files:**
- Create: `apps/client/package.json`
- Create: `apps/client/tsconfig.json`
- Create: `apps/client/src/app.config.ts`
- Create: `apps/client/src/app.tsx`
- Create: `apps/client/src/pages/home/index.tsx`
- Create: `apps/client/src/pages/ai/index.tsx`
- Create: `apps/client/src/services/api.ts`
- Create: `apps/client/src/services/ai.ts`
- Create: `apps/client/src/styles/tokens.scss`

**Interfaces:**
- Consumes: `POST /ai/chat/stream` and shared `ChatEvent`.
- Produces: H5 route `/pages/ai/index` and matching WeChat Mini Program page.

- [ ] **Step 1: Configure targets and scripts**

Configure:

```json
{
  "dev:h5": "taro build --type h5 --watch",
  "build:h5": "taro build --type h5",
  "dev:weapp": "taro build --type weapp --watch",
  "build:weapp": "taro build --type weapp"
}
```

Set pages to `pages/home/index` and `pages/ai/index`.

- [ ] **Step 2: Implement API and stream adapters**

Implement:

```ts
export async function streamChat(
  input: ChatRequest,
  onEvent: (event: ChatEvent) => void,
): Promise<void>;
```

Use browser `fetch` and `ReadableStream` for H5. Use a Taro-compatible request adapter for WeChat; if streaming is unavailable, accumulate a JSON fallback response without exposing a technical error.

- [ ] **Step 3: Implement AI page states**

Support idle, submitting, streaming, cards, action confirmation, login-required, and error states. Keep input and submit targets at least 44px high.

- [ ] **Step 4: Verify both targets**

Run:

```powershell
pnpm --filter @xiangliji/client typecheck
pnpm --filter @xiangliji/client build:h5
pnpm --filter @xiangliji/client build:weapp
```

Expected: both builds complete without route or TypeScript errors.

### Task 6: 将高保真首页迁移到正式客户端

**Files:**
- Create: `apps/client/src/pages/home/components/VoiceCard.tsx`
- Create: `apps/client/src/pages/home/components/TownPulse.tsx`
- Create: `apps/client/src/pages/home/components/QuickEntry.tsx`
- Create: `apps/client/src/pages/home/components/PostCard.tsx`
- Create: `apps/client/src/pages/home/components/TrustStrip.tsx`
- Create: `apps/client/src/pages/home/home.scss`
- Modify: `apps/client/src/pages/home/index.tsx`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: approved tokens and states from `high-fi-home/styles.css`, `high-fi-home/index.html`, and `DESIGN_HANDOFF.md`.
- Produces: responsive home page linking to AI, explore, publish, messages, and mine routes.

- [ ] **Step 1: Extract visual tokens**

Copy only approved color, typography, spacing, radius, and motion values into `tokens.scss` and `home.scss`; leave the prototype files unchanged.

- [ ] **Step 2: Split components by responsibility**

Implement `VoiceCard`, `TownPulse`, `TrustStrip`, `QuickEntry`, and `PostCard`. The home page owns bootstrap data and navigation callbacks only.

- [ ] **Step 3: Implement voice/text states**

Support default voice, press-and-hold recording, AI整理中, text input, hot hint filling, and zero-result `帮我发布`. Use MockProvider until ASR exists.

- [ ] **Step 4: Add responsive regression test**

Create a Playwright test at 1440×1024 and 390×844. Assert the voice card, pulse, quick entries, trust strip, and first feed card are visible; assert `scrollWidth <= viewport.width`.

- [ ] **Step 5: Run browser verification**

Run:

```powershell
pnpm dev:h5
playwright test tests/e2e/home.spec.ts
```

Expected: both viewports pass with no horizontal overflow and the AI action navigates correctly.

### Task 7: 集成质量门禁与提交

**Files:**
- Create: `tests/e2e/agent-home.spec.ts`
- Create: `docs/runbook/local-development.md`
- Modify: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: completed workspace packages and routes from Tasks 1-6.
- Produces: reproducible local startup and one end-to-end first-week acceptance flow.

- [ ] **Step 1: Write the acceptance flow**

Cover:

```text
open home
→ click 问问 AI
→ ask 有没有人收玉米
→ assert platform card with post_id-backed result
→ ask 有没有人收荔枝
→ assert 生成发布草稿 action
→ assert anonymous user sees login_required before persistence
```

- [ ] **Step 2: Add the runbook**

Document Docker startup, API, H5, WeChat build, test commands, SSH Git remote, and `.env.local` handling. State that Git commands must run from the repository directory.

- [ ] **Step 3: Run all checks**

Run:

```powershell
docker compose -f infra/docker-compose.yml config
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build:h5
pnpm build:weapp
playwright test tests/e2e/agent-home.spec.ts
```

Expected: all commands pass; API tests use in-process mocks when Docker is unavailable.

- [ ] **Step 4: Commit and push**

```powershell
git add package.json pnpm-workspace.yaml tsconfig.base.json .editorconfig .env.example README.md apps packages infra tests docs/runbook
git commit -m "feat: scaffold dual-platform client and agent shell"
git push
```

### Later Plans

These remain separate plans so each subsystem is independently testable:

1. `identity-and-post-domain`: 微信登录、乡镇、Post 数据库、草稿和状态机。
2. `publish-and-audit`: 语音上传、ASR、字段抽取、审核和反诈。
3. `search-and-web-provider`: MySQL ngram、混合检索、WebSearchProvider 和来源引用。
4. `messages-and-safety`: 私聊、举报、联系方式授权和反诈处置。
5. `ai-provider-admin`: Provider 配置、加密 Key、路由、连接测试和成本监控。
6. `ops-and-release`: 管理端、评测集、备份恢复、灰度和上线门禁。

