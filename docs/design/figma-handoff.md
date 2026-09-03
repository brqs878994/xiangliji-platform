# Figma 设计交接

## 当前文件

- 文件：[乡里集平台设计文件](https://www.figma.com/design/Mr3v0AiBcOgpvhNdVSjpt2/Untitled?node-id=0-1)
- File key：`Mr3v0AiBcOgpvhNdVSjpt2`
- 当前状态：已登录，文件已创建，等待首页画板导入和组件整理。

## 首页画板

按高保真交付说明建立以下画板：

- `Home / Desktop / 1440`：1440 × 1024
- `Home / Desktop / 1280`：1280 × 900
- `Home / Mobile / 390`：390 × 844
- `Home / Mobile / 375`：375 × 812
- `Home / Components`：组件、状态和 Token

## 视觉 Token

| Token | Value |
| --- | --- |
| `color.ink` | `#102624` |
| `color.green` | `#163732` |
| `color.green-2` | `#2E6E5C` |
| `color.paper` | `#F4F5EF` |
| `color.warm` | `#FBFAF4` |
| `color.yellow` | `#E8B84A` |
| `color.orange` | `#E76445` |
| `color.mint` | `#DDEBE5` |
| `color.line` | `#D5DED6` |
| `color.muted` | `#718078` |

字体使用 `Noto Sans SC`（正文）和 `Noto Serif SC`（标题/数据）。

## 同步规则

1. Figma 只维护页面结构、组件状态和视觉 Token，业务数据仍以代码和 API 为准。
2. 首页优先同步语音入口、文字态、本镇脉搏、反诈提示、快速分类和最新信息卡片。
3. 设计变更先更新 Figma 画板与 Token，再同步到 `apps/client/src/pages`。
4. 代码验收覆盖 1440px、1280px、390px 和 375px 四个尺寸。
