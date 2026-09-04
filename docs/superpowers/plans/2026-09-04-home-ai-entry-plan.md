# 首页顶部 AI 入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove publishing actions from the homepage voice/text card and route voice interaction into the AI Q&A page.

**Architecture:** Keep the existing homepage and AI page routes. Update only the homepage copy and event wiring; retain the existing text query handoff and all other publishing entry points.

**Tech Stack:** Taro 4, React 18, TypeScript, SCSS.

## Global Constraints

- Preserve existing publish, review, persistence, and feed behavior.
- Keep H5 and WeChat mini-program behavior aligned.
- Do not add provider credentials or backend changes.

---

### Task 1: Update Homepage AI Entry

**Files:**
- Modify: `apps/client/src/pages/home/index.tsx`

**Interfaces:**
- Consumes: existing `go`, `setRecording`, and `submitSearch` helpers.
- Produces: voice release navigation to `/pages/ai/index` and a publish-free voice card.

- [ ] **Step 1: Change voice and text copy**

Replace the voice hint with `说一句，帮你查找或提问` and the text title with `写下你想找或想问的内容`.

- [ ] **Step 2: Route voice interaction to AI**

Keep touch recording state for visual feedback, then navigate to `/pages/ai/index` on click/release.

- [ ] **Step 3: Remove the card-level publish button**

Delete the `.hero-publish-button` inside `.voice-footer`; keep the existing `问问 AI` action.

- [ ] **Step 4: Verify**

Run `pnpm typecheck`, `pnpm build:h5`, and `pnpm build:weapp`. Open the H5 homepage and confirm the card has no publish action and voice interaction opens the AI route.
