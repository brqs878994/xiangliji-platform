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

