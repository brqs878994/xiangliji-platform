# 乡里集县域生活信息服务平台设计规格

> 状态：已确认设计
>
> 日期：2026-09-02

## 1. 目标与范围

乡里集是面向单乡镇试点的县域生活信息交换平台，首期同时支持微信小程序和 H5。平台围绕“查找 → 发布 → 回应 → 回访”的 A/B/C 闭环，让用户更容易找到本镇信息、发布后获得真实回应，并通过本镇脉搏和摘要持续回来。

首期 P0 闭环：

1. 游客浏览本镇信息。
2. 用户通过文字或语音创建发布草稿。
3. AI 整理标题、类别、地点、价格、数量和有效期。
4. 用户确认后提交审核。
5. 审核通过后展示在首页、逛一逛和详情页。
6. 其他用户收藏、联系、报名或举报。
7. 发布者收到真实响应并更新“已找到 / 已招满 / 已完成”状态。
8. AI 支持本镇信息查询、普通问题问答、实时联网问答和零结果转发布草稿。

首期明确不做：支付、担保交易、会员、推广收费、多县多租户和复杂 RBAC。这些能力通过领域字段和 Provider 接口预留迁移窗口。

## 2. 视觉与交互基准

现有 `high-fi-home/` 为视觉交接基准，包含首页及 Explore、Publish、Detail、AI、Messages、Mine 视图的高保真原型、响应式样式、交互脚本和浏览器截图。

必须保留的设计约束：

- 视觉方向为“田野信号 + 县域蓝图 + 夜市信号”的 A/B/C 融合。
- 首页语音入口、文字输入、热搜词、本镇脉搏和反诈提示是首屏核心。
- 桌面端使用侧边导航，移动端使用固定底部五 Tab，中间为发布入口。
- 所有主要触控目标不小于 44px。
- H5 验收尺寸至少覆盖 1440px 桌面、1280px 桌面、390px 移动和 375px 移动。
- `prefers-reduced-motion` 下禁用非必要动效。
- 原型中的静态事件必须替换为真实事件聚合，禁止虚假浏览量、响应量和倒计时压力。

## 3. 总体技术架构

采用模块化单体和纵向切片开发，不首期拆成微服务。

```text
repo/
├─ apps/
│  ├─ client/              # Taro + React + TypeScript，H5/微信小程序
│  ├─ api/                 # NestJS + TypeScript API
│  └─ admin/               # Vue 3 管理后台
├─ packages/
│  ├─ domain/              # User/Post/Config/状态机
│  ├─ shared/              # DTO、枚举、错误码、日志
│  ├─ platform-adapter/    # 微信登录、录音、定位、订阅
│  └─ ai-contracts/        # AiGateway、Provider、Tool 契约
├─ workers/
│  ├─ asr.worker.ts
│  ├─ post-extract.worker.ts
│  ├─ audit.worker.ts
│  ├─ notify.worker.ts
│  └─ embedding.worker.ts
├─ database/
│  ├─ migrations/
│  ├─ seeds/
│  └─ sql/
├─ infra/
│  ├─ docker-compose.yml
│  ├─ nginx.conf
│  └─ backup.ps1
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  ├─ e2e/
│  └─ eval/
└─ docs/
   ├─ architecture/
   ├─ api/
   ├─ runbook/
   └─ eval/
```

技术选型：

| 层 | 选择 | 边界 |
|---|---|---|
| 客户端 | Taro + React + TypeScript | H5 与微信小程序共用业务组件，平台差异进入 adapter |
| API | NestJS + TypeScript | 模块化单体，统一鉴权、校验、错误码和日志 |
| 数据库 | MySQL 8 | 唯一业务数据、Post、会话、配置、审计和事件 |
| 缓存/队列 | Redis 7 + Redis Stream | 缓存、限流、会话短状态和异步任务，不保存唯一业务数据 |
| 文件 | OSS + CDN | 图片和语音使用签名 URL 直传 |
| 管理端 | Vue 3 | 审核、举报、配置、运营指标和操作日志 |
| 部署 | Docker Compose + Nginx | 单机试点，后续保留迁移到集群的边界 |

## 4. 产品智能体设计

### 4.1 智能体模式

```text
town_search       查本镇真实信息
general_qa        普通稳定问题
current_qa        需要实时信息的问题
draft_creation    生成发布草稿
```

路由策略：

```text
本镇供求/活动/招工 → PlatformSearchProvider
实时性问题         → WebSearchProvider + LLM + 来源引用
普通稳定问题       → GeneralLlmProvider
无结果             → 相近词 + 订阅提醒 + 发布草稿
```

联网搜索是从第一天预留的可插拔能力，但默认只在检测到实时性需求时触发；普通稳定问题默认不联网。

### 4.2 智能体边界

模型只能调用注册过的工具，不能直接访问数据库、拼接 SQL、访问任意 HTTP 地址或修改业务数据。

以下动作必须由用户确认后执行：

- 创建发布草稿
- 创建订阅提醒
- 联系用户
- 报名或提交响应
- 发布、完成、招满或关闭信息

AI 不得把猜测内容伪装成平台事实。平台信息必须绑定 `post_id`，联网回答必须带来源，无法核验实时信息时不得编造答案。

### 4.3 统一入口与事件

客户端统一调用：

```http
POST /ai/chat/stream
Accept: text/event-stream
```

流式事件：

```ts
type ChatEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'cards'; cards: PostCard[] }
  | { type: 'sources'; sources: AnswerSource[] }
  | { type: 'action'; action: AgentAction }
  | { type: 'warning'; code: string; message: string }
  | { type: 'done'; runId: string };
```

来源类型：

```ts
type AnswerSource =
  | { type: 'platform'; postId: string }
  | { type: 'web'; title: string; url: string }
  | { type: 'model'; label: 'general_knowledge' };
```

## 5. AI 网关与可插拔 Provider

业务模块只依赖 `AiGateway`，禁止直接导入供应商 SDK。

```ts
export interface AiGateway {
  classifyIntent(input: IntentInput): Promise<IntentResult>;
  chat(input: ChatInput): AsyncIterable<ChatEvent>;
  extractPostFields(input: ExtractInput): Promise<PostDraft>;
  transcribe(input: AudioInput): Promise<Transcript>;
  embed(input: string): Promise<number[]>;
  moderate(input: ModerationInput): Promise<ModerationResult>;
  synthesize(input: TtsInput): Promise<TtsResult>;
}
```

Provider 接口按能力拆分：

```ts
export interface LlmProvider {
  chat(input: ChatInput): AsyncIterable<ChatEvent>;
  extract(input: ExtractInput): Promise<PostDraft>;
}

export interface SearchProvider {
  search(input: SearchInput): Promise<SearchResult[]>;
}

export interface AsrProvider {
  transcribe(input: AudioInput): Promise<Transcript>;
}
```

首期适配器：

```text
OpenAICompatibleLlmAdapter
WebSearchAdapter
PlatformSearchAdapter
AsrAdapter
EmbeddingAdapter
ModerationAdapter
TtsAdapter
MockAdapter
```

### 5.1 Provider 配置

```text
ai_provider_profiles
├─ id
├─ name
├─ protocol
├─ base_url
├─ api_key_encrypted
├─ model_name
├─ timeout_ms
├─ temperature
├─ max_tokens
├─ enabled
└─ fallback_provider_id
```

```text
ai_capability_routes
├─ capability_key
├─ primary_provider_id
├─ fallback_provider_id
├─ prompt_version
├─ enabled
└─ updated_at
```

能力路由至少包括：

```text
general_chat
town_search_intent
post_field_extraction
web_search_answer
speech_to_text
embedding
moderation
text_to_speech
```

每项能力可以独立设置 `base_url`、`api_key`、模型、超时、Token 上限和备用 Provider。OpenAI-compatible 服务使用统一适配器；ASR、TTS 和图片审核使用各自协议适配器。

### 5.2 密钥和配置安全

- API Key 只存在服务端，前端永远不可见。
- 数据库存储加密值，主密钥只放环境变量或部署平台密钥管理。
- 管理后台只显示掩码，不返回完整 Key。
- `base_url` 只能由管理员配置，不能来自普通用户请求。
- 连接测试只允许 HTTPS 和域名白名单，拒绝内网地址和未授权协议。
- Provider 配置修改写入 `config_change_log`。
- 生产配置与本地 Mock 配置分离。

## 6. 数据模型与业务状态

### 6.1 核心业务表

```text
users
posts
post_media
responses
deals
conversations
messages
audit_cases
audit_logs
config
config_change_log
dictionaries
events
```

统一信息状态：

```ts
type PostStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'closed'
  | 'expired'
  | 'removed'
  | 'rejected';
```

### 6.2 AI 运行记录

```text
ai_sessions
├─ id, user_id nullable, channel, town_code, mode, status
└─ created_at, last_active_at

ai_messages
├─ id, session_id, role, content_json, citations_json
└─ created_at

ai_runs
├─ id, session_id, capability, provider_id, model_name
├─ prompt_version, request_id, latency_ms
├─ input_tokens, output_tokens, estimated_cost
└─ status, error_code

ai_tool_calls
├─ id, run_id, tool_name, arguments_json, result_json
├─ requires_confirmation, confirmation_status
└─ created_at

ai_prompt_versions
├─ prompt_key, version, template, checksum, enabled
└─ created_at

ai_eval_cases
├─ question, expected_intent, expected_post_ids, expected_action
└─ evaluation_result
```

敏感数据脱敏记录。完整手机号、联系方式、API Key 和不必要的原始聊天内容不得进入普通日志。

## 7. 核心工具与接口

工具白名单：

```text
search_platform_posts
search_web
get_post_detail
get_town_pulse
create_draft
create_subscription
open_post
```

```ts
export interface AgentTool {
  name: string;
  description: string;
  inputSchema: object;
  requiresLogin: boolean;
  requiresConfirmation: boolean;
  execute(input: unknown, context: AgentContext): Promise<ToolResult>;
}
```

核心 HTTP 接口：

```text
POST /auth/wechat-login
GET  /home/bootstrap
POST /media/presign
POST /posts/drafts
PATCH /posts/drafts/:id
POST /posts/:id/publish
GET  /posts
GET  /posts/:id
GET  /search
POST /subscriptions
GET  /posts/:id/responses
POST /posts/:id/status
POST /events
POST /ai/chat/stream
GET/POST /conversations/:id/messages
POST /reports
GET/PATCH /admin/config
```

所有写接口带 `Idempotency-Key`；异步任务带 `trace_id`、`attempt` 和明确重试策略；联系方式必须通过独立授权接口获取。

## 8. 关键工作流

### 8.1 AI 查询

```text
用户输入
→ 意图分类
→ 平台搜索 / 普通问答 / Web 搜索
→ 返回流式文字
→ 返回卡片或引用
→ 用户确认后执行动作
```

本镇搜索先做规则、同义词、结构化过滤、MySQL ngram，再预留向量召回。平台过滤必须限制 `status = published` 且 `valid_until > now`，排序综合距离、时效和质量分。

### 8.2 无结果转草稿

```text
平台搜索无结果
→ 相近词推荐
→ 订阅提醒入口
→ create_draft 工具
→ 用户确认
→ POST /posts/drafts
```

不直接发布；草稿保留原始输入、AI 提取结果、缺失字段和风险提醒。

### 8.3 语音发布

```text
录音
→ OSS 签名直传
→ 草稿落库
→ Redis Stream: asr.request
→ ASR
→ 规则归一化
→ AI 字段抽取
→ 草稿轮询/推送
→ 用户确认
→ 审核
```

同步落库目标小于 500ms。ASR 超时或服务故障不阻塞发布，保留原始语音并后台补齐转写。

### 8.4 审核与反诈

```text
发布 / 私聊 / 举报
→ 风险词与正则
→ 图片审核
→ 新号、频次、重复、举报次数、金额阈值
→ 自动通过 / 待审 / 驳回 / 临时封禁
→ 通知用户和运营人员
```

规则优先，模型辅助，人工队列兜底。

## 9. 错误处理与降级

```text
主模型超时
→ 备用模型
→ 规则/关键词搜索
→ 明确不可用状态
```

具体约束：

- 平台搜索失败：降级关键词搜索。
- 普通问答失败：切备用 Provider。
- 联网搜索失败：不得伪装成实时答案，提示当前无法核验。
- 工具调用失败：不执行后续副作用。
- SSE 中断：保存运行状态，允许客户端重连。
- 未登录调用受限工具：返回 `login_required`。
- 草稿生成失败：保留用户原始输入。
- 超出 Provider 限额：切备用路由并记录原因。
- 所有写操作使用幂等键，避免重试重复发布或重复通知。

## 10. 工具准备与环境要求

当前环境已具备：

- Git `2.53.0`
- Node.js `22.22.2`
- pnpm `11.19.0`
- npm `10.9.7`
- Chrome/Edge 与 Playwright

需要补充：

- Docker Desktop
- 微信开发者工具
- 本地 MySQL 8 和 Redis 7（通过 Docker 启动）
- 远程 Git 仓库已准备：`https://github.com/brqs878994/xiangliji-platform.git`

真实服务凭证后置接入：微信 AppID、LLM、ASR、Embedding、审核、OSS/CDN、生产服务器。凭证统一放 `.env.local` 或部署平台密钥管理，禁止提交到 Git。

## 11. 分阶段交付

### 阶段 0：工程地基

- 初始化 monorepo 和 Git 工作流。
- 配置 pnpm workspace、TypeScript、ESLint、Prettier。
- Docker 启动 MySQL/Redis。
- 建立环境变量模板、健康检查、统一日志和错误码。

### 阶段 1：AI 契约与首页

- 创建 `AiGateway`、Provider、Tool 契约。
- 创建 `MockProvider`。
- 实现 `/ai/chat/stream`。
- 将高保真首页迁移到 Taro 客户端。
- H5 和微信小程序均可启动和展示。

### 阶段 2：用户与信息模型

- 微信登录、游客浏览和乡镇选择。
- 建立 `users/posts/post_media/responses`。
- 实现首页 bootstrap、逛一逛、详情、收藏和联系入口。

### 阶段 3：发布与审核

- 文字发布、草稿恢复和字段抽取。
- Post 状态机、审核和反诈规则。
- 发布后响应、完成、招满、过期和下架。

### 阶段 4：真实 AI 能力

- 通用问答。
- 平台信息搜索。
- Web 搜索与来源引用。
- 零结果转草稿。
- Provider 配置和路由管理。

### 阶段 5：语音、消息与安全

- ASR 和语音草稿。
- 私聊、未读和安全提醒。
- 举报、审核台和风险处置。

### 阶段 6：评测与上线

- AI 评测集和成本监控。
- Playwright 与小程序真机验收。
- 弱网、限流、越权和备份恢复测试。
- 单乡镇灰度部署。

## 12. 第一周验收标准

```text
H5 / 微信小程序打开首页
→ 点击“问问 AI”
→ 输入问题
→ Mock Agent 判断意图
→ 返回平台卡片或普通回答
→ 无结果时显示“生成发布草稿”
→ 用户确认
→ 草稿保存成功
```

第一周必须达到：

- 两端均可启动。
- 首页高保真视觉无明显回退。
- API、MySQL、Redis 可本地启动。
- SSE 流式响应正常。
- Provider 可通过配置切换。
- 无真实 Key 时可完整演示。
- 至少一条 Playwright 流程测试通过。

## 13. 验收与质量门禁

- 核心状态机、ConfigService、路由策略和规则匹配单元测试覆盖率目标不低于 90%。
- 每条 P0 接口至少有一条成功和一条失败用例。
- 发布、审核、搜索、AI 降级、私聊、举报和零结果转草稿均有流程测试。
- AI 评测集初始规模 100-200 条，关注 Recall@5、MRR、字段完整率、用户修改率。
- H5 覆盖桌面和移动截图回归；小程序完成开发者工具和真机冒烟。
- 重点安全测试覆盖鉴权、越权、上传、限流、密钥暴露、Provider URL 校验和联系方式授权。

平台 MVP 的完成标准不是“页面可以打开”，而是本地能够启动、完成一次语音或文字发布、经过审核、模拟私聊反诈、查看 AI 调用与业务事件，并能从备份恢复。
