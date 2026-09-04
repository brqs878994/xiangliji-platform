# 乡里集县域生活信息服务平台

双端目标：微信小程序 + H5。

## 当前阶段

第一轮工程地基和智能体壳层：Taro 客户端、NestJS API、共享 AI 契约、MockProvider 和 SSE 演示链路。

## 本地准备

- Node.js 22
- pnpm 11
- Docker Desktop（用于 MySQL 8、Redis 7）
- 微信开发者工具（生成 dist/weapp 后导入）

真实 API Key 只放在 .env.local 或部署平台密钥管理中，不提交到 Git。

## 常用命令

```powershell
pnpm install
pnpm typecheck
pnpm test
pnpm dev:api
pnpm dev:h5
pnpm build:weapp
```

`pnpm dev:h5` 会先构建 H5、生成入口页，再在 `http://127.0.0.1:10086` 提供静态服务；需要热更新时使用 `pnpm --filter @xiangliji/client dev:h5:watch`。

## 后台 MVP

当前后台使用 NestJS 模块化单体和 Repository 接口，开发环境默认使用带 JSON 持久化的本地 Repository，接口已经覆盖分类、乡镇、信息列表、发布草稿、审核、响应和 AI Provider 路由。运行数据写入 `infra/data/platform.json`（已加入 Git 忽略），API 重启后仍可查询；生产环境可在不改 Controller 的前提下替换为 MySQL Repository。

API 地址：`http://127.0.0.1:3000`

管理台：启动 H5 后打开 `/pages/admin/index`（首页左侧“运营台”入口）。

主要接口：

- `GET /categories`、`GET /towns`、`GET /posts`
- `POST /posts/drafts`、`PATCH /posts/drafts/:id`
- `POST /posts/drafts/:id/submit-review`
- `GET /admin/audits`、`POST /admin/audits/:id/approve`、`POST /admin/audits/:id/reject`
- `GET /admin/stats`
- `GET/POST/PATCH /admin/ai/providers`、`GET /admin/ai/routes`、`PUT /admin/ai/routes/:capability`

普通信息提交后立即展示，同时生成后台审核记录；审核驳回时自动下架。发布和审核动作都要求显式确认；Provider 的 API Key 只在服务端保存，接口返回掩码值。

如果 `pnpm --filter @xiangliji/api build` 触发 `magic-string` ESM 工具链错误，可使用仓库当前可用的编译方式：

```powershell
pnpm --filter @xiangliji/api exec tsc -p tsconfig.json
pnpm --filter @xiangliji/api start
```

Docker 本地依赖：

```powershell
docker compose -f infra/docker-compose.yml up -d mysql redis
```

Git 命令必须在仓库目录执行：

```powershell
Set-Location "C:\Users\蒙多\Desktop\网站开发\县域生活信息服务平台开发"
git status
git push
```

现有 high-fi-home/ 是视觉回归基准，原型文件保持不变。
