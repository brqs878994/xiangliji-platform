# 乡里集高保真设计交付说明

## 视觉方向

本版采用 A+B+C 融合：

- A「田野信号」：墨绿、纸白、稻穗黄，建立县域、本地、可信的第一印象。
- B「县域蓝图」：侧边导航、信息分区、数据脉搏和稳定网格，强化工具化秩序。
- C「夜市信号」：语音波形、橙色操作点和实时状态，让首页有年轻记忆点。

## A/B/C 信息交换闭环

- **A｜让人想查**：首屏把搜索框放在语音入口旁边，同时露出“本镇刚刚有人在找”的热搜词；搜索结果必须带距离、时间和响应状态。无结果时提供相近词、订阅提醒和“帮我发布”。
- **B｜让人想发**：语音/文字输入后由 AI 整理成草稿；发布结果展示真实浏览、收藏、联系、报名人数，并提供补图、续期和“已找到/已招满/已完成”状态更新。
- **C｜让人常回来**：本镇脉搏、刚刚/急需/即将截止标签、赶集日提醒和每日摘要，持续告诉用户“今天镇上发生了什么”。

增长交互只使用真实事件，不做虚假热度、虚假响应、复杂积分或红包裂变。核心事件包括：`search_submitted`、`search_zero_result`、`draft_created`、`post_published`、`response_received`、`post_completed`、`digest_opened`。

## 首页画板建议

| 画板 | 尺寸 | 用途 |
| --- | ---: | --- |
| `Home / Desktop / 1440` | 1440 × 1024 | 桌面端首页主画板 |
| `Home / Desktop / 1280` | 1280 × 900 | 常见办公屏适配检查 |
| `Home / Mobile / 390` | 390 × 844 | iPhone 主流窄屏 |
| `Home / Mobile / 375` | 375 × 812 | 小屏兼容检查 |
| `Home / Components` | 1440 × 1200 | 组件和状态集中维护 |

## 颜色 Token

```text
color.ink        #102624  主要文字 / 深色按钮
color.green      #163732  语音主入口 / 导航选中
color.green-2    #2E6E5C  辅助强调
color.paper      #F4F5EF  页面底色
color.warm       #FBFAF4  内容面板
color.yellow     #E8B84A  语音按钮 / 关键数字
color.orange     #E76445  发布、提醒、收藏反馈
color.mint       #DDEBE5  反诈提示底色
color.line       #D5DED6  分隔线 / 边框
color.muted      #718078  次要文字
```

## 字体与排版

- 中文正文：`Noto Sans SC`，400 / 500 / 600 / 700 / 800。
- 数据与标题：`Noto Serif SC`，600 / 700。
- 桌面 H1：36px；移动 H1 隐藏，保留品牌和核心语音入口。
- 区块标题：24px / 21px；卡片标题：16px / 14px。
- 主要触控目标不小于 44px，移动端底部导航固定在安全区上方。

## 组件清单

- `Navigation / SideRail`：桌面左侧主导航，含位置切换、页面入口、防骗指南、用户状态。
- `Navigation / BottomTabs`：移动端五 Tab，中间发布按钮上浮。
- `Voice / RecordCard`：默认、按住录音、AI 整理中三种状态；语音为默认主态。
- `Input / TextMode`：由“改用文字输入”进入独立文本态，使用 3-5 行文本域，支持较长描述、字数提示、搜索和生成发布草稿。
- `Pulse / TownPulse`：新信息总量、招工、响应、新发布及柱状脉搏图。
- `Banner / TrustStrip`：高对比反诈与免责提示，桌面提供安全规则入口。
- `Category / QuickEntry`：助农供求、求职招工、有偿任务、二手市场、约局互动。
- `Feed / PostCard`：带图、无图、招工信息三种卡片结构。
- `Aside / MarketDay`：赶集日提醒和发布 CTA。
- `Aside / SafetyGuide`：防骗短清单和完整指南入口。
- `Feedback / Toast`：操作后即时反馈，自动消失。
- `Search / HotHints`：本镇热搜词快捷填充，点击后自动聚焦搜索框。
- `Signal / ResponseNote`：信息卡展示已联系、已收藏、还缺人数等真实响应状态。

## 页面状态

## 页面画板与关键流程

### `Explore / Nearby` 逛一逛

- 顶部为关键词搜索、类别筛选和“本镇热搜”，让用户先从已有信息开始浏览。
- 主区使用“1 张重点信息 + 3 张同类信息”的节奏，卡片固定展示类别、距离、发布时间、价格/缺口和联系动作。
- 右侧趋势模块回答“大家正在找什么”，无结果时统一导向“帮我发布”。
- 移动端改为单列卡片，筛选项横向滚动，趋势模块下沉，避免首屏出现双栏挤压。

### `Publish / VoiceDraft` 发布

- 三步进度：说一说、核对一下、发布结果。
- 左侧为按住说话采集区，保留波形、预计耗时、安全提示和文字切换入口。
- 右侧为 AI 草稿预览，展示分类、标题、地点、有效期和未识别提醒。
- 草稿自动保存；正式开发接入语音转写、字段抽取、位置校验、图片补充和审核状态。
- 移动端仍保持语音卡优先，预览区纵向排列，整体操作不超过一屏半。

### `Post / Detail` 信息详情

- 先图后信息：主图、位置、类别、标题、价格/报酬、正文、数量/有效期/响应数据。
- 安全提示和发布者认证紧跟在核心信息之后，联系按钮与举报入口保持可见。
- “真实回音”模块展示浏览、收藏、联系等真实事件聚合，不使用虚假热度。
- 附近同类信息用于继续浏览，点击可回到详情流程。

### `AI / Assistant` AI 对话

- 首屏提供 4 个高频问题，降低输入门槛。
- 对话结果只引用平台内已有信息，并显示价格、地点、时间和缺口。
- 找不到时提供“帮我发布”，把查找行为自然接到发布闭环。
- 移动端快捷问题为 2 列，结果卡和输入框保持 44px 以上触控目标。

### `Messages / Chat` 消息

- 桌面端左侧会话列表、右侧聊天；移动端将会话列表压缩为顶部横向会话条。
- 聊天区固定显示平台安全提醒，消息气泡区支持文字、图片和语音入口。
- 报名、联系、审核等平台事件使用独立提示卡，避免与普通聊天混淆。

### `Profile / Mine` 我的

- 顶部展示身份、位置和认证状态，下面是展示中、待审核、收到回应、收藏四项数据。
- 信息列表支持“在展示 / 待审核 / 已完成”切换，保留编辑、查看、续期等动作位。
- 右侧/底部提供本周回音和账号安全状态，强化持续回来查看回应的动机。

## 动效 Token

| Token | 取值 | 使用场景 |
| --- | --- | --- |
| `motion.route-enter` | 420ms · `cubic-bezier(.22,.8,.24,1)` | 页面切换入场 |
| `motion.card-hover` | 220ms · `ease` | 卡片上浮、边框强调 |
| `motion.card-stagger` | 40-80ms | 列表卡片依次出现 |
| `motion.voice-wave` | 1.4-1.8s · `ease-in-out` | 录音波形循环 |
| `motion.orb-pulse` | 2.4s · `ease-in-out` | AI 入口信号脉冲 |
| `motion.reduced` | 1ms / no scroll animation | `prefers-reduced-motion` |

所有动效只表达状态变化，不用于制造虚假浏览量、响应量或倒计时压力。

### 语音入口

1. 默认：`按住说话`，提示示例语句。
2. 按下：按钮放大、波形激活、状态变成「正在听」。
3. 松开：状态变成「AI 正在整理你的信息…」，Toast 提示生成发布草稿。
4. 文字切换：点击「改用文字输入」后隐藏波形和录音按钮，展示大文本域；点击「切回语音」恢复语音主态。

### 手动输入

- 文本域采用固定可视高度：桌面 88px、移动 82px；内容超出后内部滚动，确保语音态与文字态卡片整体高度一致。
- 提交按钮使用「开始查找」，根据内容进入查找反馈或发布草稿反馈。
- 热搜词只负责填入文本域，不替用户直接提交；无结果时出现「帮我发布」。

### 信息卡

- 收藏：书签变为橙色，再次点击取消收藏。
- 筛选：综合 / 最新 / 最近切换时保留当前页面位置并给出 Toast。
- 联系 / 报名：进入下一步流程，当前原型以 Toast 占位。

### 搜索与无结果

- 热搜词点击后填入搜索框，不直接替用户提交，保留确认感。
- 搜索提交后显示“正在匹配本镇信息”；无结果时必须导向相近词、订阅提醒或发布草稿。
- 搜索输入与语音入口共用 `recordStatus` 状态位，避免页面出现两套互相矛盾的反馈。

### 发布后的回音

- 信息卡底部展示 `2 人已联系`、`1 人已收藏`、`还缺 3 人` 等状态。
- 这些状态由响应事件聚合生成；原型使用静态示例，正式开发时接 `/posts/{id}/responses`。

## 原型文件

- `index.html`：页面结构与语义化区域。
- `styles.css`：响应式布局、视觉 token、组件状态。
- `app.js`：导航、筛选、收藏、语音按住交互、Toast。
- `favicon.svg`：本地品牌 favicon，避免静态服务 404。

当前交付为可运行 Web 高保真原型，Figma MCP 的 `create_new_file/use_figma` 工具在本环境未挂载，因此没有伪造 Figma 写入结果。页面已按 Figma-ready 方式整理画板命名、颜色/字体 Token、组件状态和响应式断点，可直接按本说明在 Figma 中复刻。

## 浏览器验收产物

- 桌面：`output/playwright/home-desktop.png`、`explore-desktop.png`、`publish-desktop.png`、`detail-desktop.png`、`ai-desktop.png`、`messages-desktop.png`、`mine-desktop.png`
- 移动：`output/playwright/home-mobile-viewport-final.png`、`explore-mobile.png`、`publish-mobile-viewport-fixed.png`、`detail-mobile-viewport-fixed.png`、`ai-mobile-viewport-fixed.png`、`messages-mobile-viewport-fixed.png`、`mine-mobile-viewport-fixed.png`
- 已检查 1440px 桌面和 390px 移动布局；移动端页面无横向滚动溢出。

## 单人 AI 开发落地顺序

1. 先接通静态数据模型：`posts`、`responses`、`conversations`、`drafts`、`users`。
2. 实现 `Explore / Nearby` 查询、筛选、空结果和“帮我发布”闭环。
3. 实现 `Publish / VoiceDraft` 的录音上传、转写、字段抽取和草稿确认。
4. 实现 `Post / Detail` 联系、收藏、举报及响应事件聚合。
5. 实现 `Messages / Chat` 平台内沟通和安全提示。
6. 实现 `AI / Assistant` 的检索增强问答，答案强制绑定信息卡片。
7. 实现 `Profile / Mine` 的状态管理、续期、完成和安全设置。
8. 最后补 `Growth / Digest`：每日摘要、订阅提醒、响应漏斗和运营看板。
