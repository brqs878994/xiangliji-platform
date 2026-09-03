# Backend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable NestJS backend MVP that supports category browsing, post publishing, review, responses, town data, and configurable AI provider routing for H5 and WeChat clients.

**Architecture:** Keep the modular monolith in `apps/api`. Business modules depend on repository interfaces; the first implementation uses an in-memory repository seeded with deterministic town/category/post data, so the complete workflow is testable without Docker. HTTP DTOs remain stable for a later MySQL repository swap.

**Tech Stack:** NestJS 12, TypeScript, Vitest, shared domain contracts, Taro client fetch adapters.

## Global Constraints

- H5 and WeChat Mini Program must share the same HTTP contracts.
- API keys remain server-side and are returned only as masked values.
- Draft creation and publish actions require explicit user confirmation.
- Platform search results must include stable post IDs.
- No destructive changes to existing user files or prototype assets.

---

### Task 1: Backend domain repository and seed data

**Files:**
- Create: `apps/api/src/platform/platform.types.ts`
- Create: `apps/api/src/platform/platform.repository.ts`
- Create: `apps/api/src/platform/in-memory.repository.ts`
- Create: `apps/api/src/platform/platform.seed.ts`
- Create: `apps/api/src/platform/platform.module.ts`
- Test: `apps/api/src/platform/in-memory.repository.test.ts`

**Interfaces:**
- Produces `PlatformRepository` methods for categories, towns, posts, drafts, audits, and responses.
- Provides deterministic `chengguan` seed data matching the current UI cards.

- [ ] Define repository types and status transitions.
- [ ] Implement seeded in-memory storage with copy-on-read objects.
- [ ] Test category lookup, post filtering, draft creation, and publish transition.

### Task 2: HTTP modules for categories, towns, and posts

**Files:**
- Create: `apps/api/src/platform/platform.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/platform/platform.controller.test.ts`

**Interfaces:**
- `GET /categories`
- `GET /towns`
- `GET /posts?townCode=&category=&keyword=`
- `GET /posts/:id`

- [ ] Add DTO validation and stable JSON responses.
- [ ] Return only published, non-expired posts from list endpoints.
- [ ] Test category filtering and 404 detail behavior.

### Task 3: Draft, audit, publish, and response APIs

**Files:**
- Modify: `apps/api/src/platform/platform.controller.ts`
- Modify: `apps/api/src/platform/platform.repository.ts`
- Test: `apps/api/src/platform/platform.controller.test.ts`

**Interfaces:**
- `POST /posts/drafts`
- `PATCH /posts/drafts/:id`
- `POST /posts/drafts/:id/submit-review`
- `GET /admin/audits`
- `POST /admin/audits/:id/approve`
- `POST /admin/audits/:id/reject`
- `POST /posts/:id/responses`
- `GET /posts/:id/responses`

- [ ] Enforce required title/body/category/town fields.
- [ ] Require an explicit confirmation flag for submit and approve actions.
- [ ] Make response creation idempotent by user/post/type.
- [ ] Cover happy paths and rejected transitions.

### Task 4: Configurable AI provider profiles and routing

**Files:**
- Create: `apps/api/src/config/ai-config.types.ts`
- Create: `apps/api/src/config/ai-config.service.ts`
- Create: `apps/api/src/config/ai-config.controller.ts`
- Create: `apps/api/src/config/ai-config.module.ts`
- Modify: `apps/api/src/ai/agent.service.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/config/ai-config.service.test.ts`

**Interfaces:**
- `GET /admin/ai/providers`
- `POST /admin/ai/providers`
- `PATCH /admin/ai/providers/:id`
- `GET /admin/ai/routes`
- `PUT /admin/ai/routes/:capability`

- [ ] Store provider profiles in memory with masked API keys.
- [ ] Validate HTTPS/base URL and positive timeout/token limits.
- [ ] Route `general_chat`, `town_search`, and `post_field_extraction` independently.
- [ ] Keep MockProvider as the default when no configured provider is enabled.

### Task 5: Client category selection and API integration

**Files:**
- Modify: `apps/client/src/pages/publish/index.tsx`
- Modify: `apps/client/src/pages/publish/publish.scss`
- Modify: `apps/client/src/pages/explore/index.tsx`
- Modify: `apps/client/src/services/api.ts`
- Create: `apps/client/src/services/platform.ts`

- [ ] Make the publish draft category row open a cross-platform selector.
- [ ] Load categories/posts from API with a deterministic fallback when API is offline.
- [ ] Preserve current high-fidelity layout and loading/error states.

### Task 6: Verification and runbook

**Files:**
- Modify: `README.md`
- Create: `apps/api/src/platform/platform.e2e.test.ts`

- [ ] Run API tests, client typecheck, H5 build, and WeChat build.
- [ ] Start API and verify `/health`, `/categories`, `/posts` with HTTP requests.
- [ ] Document startup commands and current in-memory persistence limitation.

