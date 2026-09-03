# 可配置项全景矩阵

本文档梳理系统中所有应该做成可配置的参数。首期实现时可以硬编码，但**数据库表结构必须首期建好**，代码层必须统一从配置服务读取，而非散落在各业务模块。

## 一、配置分类体系

| 配置类型 | 存储位置 | 变更频率 | 生效方式 | 首期实现 |
|---|---|---|---|---|
| **业务规则配置** | 数据库 `config` 表 | 周/月 | 重启或定时刷新 | 必须 |
| **限额与阈值** | 数据库 `config` 表 | 周 | 实时生效（Redis 缓存 + TTL） | 必须 |
| **审核策略** | 数据库 `audit_rules` 表 | 天 | 实时生效 | 必须 |
| **消息模板** | 数据库 `message_templates` 表 | 月 | 实时生效 | 建议 |
| **AI 参数** | 配置文件 + 环境变量 | 低（迁移时） | 重启 | 必须 |
| **基础设施** | 配置文件 + 环境变量 | 极低 | 重启 | 必须 |

## 二、业务规则配置（37 项）

### 2.1 账号与权限（7 项）

| 配置项 key | 说明 | 默认值 | 单位 | 可调范围 | 对应需求 |
|---|---|---|---|---|---|
| `user.daily_post_limit.normal` | 普通用户日发布条数 | 3 | 条 | 1–10 | FR-ACC-05 |
| `user.daily_post_limit.verified` | 认证用户日发布条数 | 10 | 条 | 5–50 | FR-ACC-05 |
| `user.daily_view_limit` | 每日查看联系方式上限 | 20 | 次 | 10–100 | FR-ACC-05 |
| `user.report_reward.post` | 举报通过奖励发布条数 | 1 | 条 | 0–5 | FR-ACC-06 |
| `user.report_reward.view` | 举报通过奖励查看次数 | 5 | 次 | 0–20 | FR-ACC-06 |
| `user.new_account_days` | 新账号定义（注册后 N 天内） | 3 | 天 | 1–7 | FR-AUDIT-03 |
| `user.similar_post_check_days` | 相似信息去重检查窗口 | 3 | 天 | 1–7 | FR-PUB-10 |

### 2.2 发布与有效期（8 项）

| 配置项 key | 说明 | 默认值 | 单位 | 可调范围 | 对应需求 |
|---|---|---|---|---|---|
| `post.validity.daily_work` | 零工/有偿任务默认有效期 | 2 | 天 | 1–7 | FR-PUB-11 |
| `post.validity.farm` | 助农供求默认有效期 | 7 | 天 | 3–30 | FR-PUB-11 |
| `post.validity.secondhand` | 二手市场默认有效期 | 15 | 天 | 7–60 | FR-PUB-11 |
| `post.validity.activity` | 约局默认有效期（默认到活动日） | 7 | 天 | 1–30 | FR-PUB-11 |
| `post.validity.custom_max` | 自定义有效期最大值 | 90 | 天 | 30–365 | FR-PUB-14 |
| `post.expiry_reminder_hours` | 到期前 N 小时推送续期提醒 | 4 | 小时 | 1–24 | FR-PUB-13 |
| `post.max_images` | 单条信息最多图片数 | 6 | 张 | 3–9 | FR-PUB-05 |
| `post.image_max_width` | 图片压缩目标长边 | 1280 | px | 800–1920 | 7.6 |

### 2.3 审核规则（12 项）

| 配置项 key | 说明 | 默认值 | 单位 | 可调范围 | 对应需求 |
|---|---|---|---|---|---|
| `audit.price_threshold` | 金额触发人工审核阈值 | 1000 | 元 | 500–10000 | 4.4.5 |
| `audit.new_user_first_post` | 新用户首次发布是否人工审核 | true | bool | - | FR-AUDIT-03 |
| `audit.daily_post_spam_limit` | 24h 内发布超过 N 条触发人审 | 10 | 条 | 5–20 | FR-AUDIT-03 |
| `audit.repeat_post_window_minutes` | 同类目重复发布拦截窗口 | 60 | 分钟 | 30–180 | FR-AUDIT-03 |
| `audit.report_count_threshold` | 账号被举报超过 N 次触发人审 | 3 | 次 | 2–10 | FR-AUDIT-03 |
| `audit.manual_review_sla` | 人工审核 SLA 承诺时长 | 2 | 小时 | 1–24 | FR-AUDIT-08 |
| `audit.random_check_rate` | 已发布信息随机抽检比例 | 5 | % | 0–20 | 4.4.4 L4 |
| `audit.image_check_enabled` | 是否启用云端图片审核 | true | bool | - | FR-AUDIT-01 |
| `audit.high_risk_keywords` | 高风险关键词（JSON 数组） | ["定金","押金","保证金","刷单","日入","上下分"] | - | - | FR-ANTI-01 |
| `audit.sensitive_fields` | 涉敏字段触发人审（JSON 数组） | ["证件","身份证","营业执照","医疗","法律","金融"] | - | - | 4.4.5 |
| `audit.dangerous_work_keywords` | 危险作业关键词（JSON 数组） | ["高空","电焊","矿井","化工","爆破"] | - | - | 4.4.5 |
| `audit.auto_pass_rate_target` | 自动审核通过率目标 | 90 | % | 80–95 | 4.4.4 |

### 2.4 反诈拦截（5 项）

| 配置项 key | 说明 | 默认值 | 单位 | 可调范围 | 对应需求 |
|---|---|---|---|---|---|
| `antifraud.chat_alert_keywords` | 私聊实时拦截关键词（JSON） | ["定金","押金","扫码","点链接","加微信转账"] | - | - | FR-ANTI-06 |
| `antifraud.alert_cooldown_minutes` | 同一用户防骗弹窗冷却时间 | 30 | 分钟 | 10–120 | FR-ANTI-06 |
| `antifraud.url_pattern_block` | 是否拦截私聊发送 URL | true | bool | - | FR-ANTI-07 |
| `antifraud.wechat_id_block` | 是否拦截私聊发送微信号 | true | bool | - | FR-ANTI-07 |
| `antifraud.guide_page_force_view` | 新用户首次查看联系方式前是否强制浏览防骗指南 | true | bool | - | FR-ANTI-11 |

### 2.5 浏览与搜索（5 项）

| 配置项 key | 说明 | 默认值 | 单位 | 可调范围 | 对应需求 |
|---|---|---|---|---|---|
| `browse.page_size` | 列表分页每页条数 | 20 | 条 | 10–50 | FR-BRW-06 |
| `browse.hot_threshold_days` | 热门标签触发条件（N 天内浏览数） | 7 | 天 | 3–30 | FR-BRW-04 |
| `browse.hot_threshold_views` | 热门标签触发条件（浏览数阈值） | 50 | 次 | 20–200 | FR-BRW-04 |
| `search.no_result_threshold` | 无结果触发 AI 兜底的阈值（连续 N 次） | 3 | 次 | 1–5 | 7.5 (4) |
| `search.cache_ttl_seconds` | 搜索结果缓存 TTL | 300 | 秒 | 60–3600 | 7.2 |

## 三、AI 参数配置（11 项）

| 配置项 key | 说明 | 默认值 | 单位 | 可调范围 | 备注 |
|---|---|---|---|---|---|
| `ai.asr.timeout_seconds` | ASR 超时阈值 | 8 | 秒 | 5–15 | 超时后降级纯语音发布 |
| `ai.asr.provider` | ASR 提供商 | `aliyun` | - | `aliyun` / `tencent` / `minimax` | 迁移窗口 |
| `ai.llm.extraction_model` | 信息抽取模型 | `qwen-turbo` | - | - | 迁移窗口 |
| `ai.llm.extraction_max_tokens` | 抽取任务 max_tokens | 512 | token | 256–1024 | 成本控制 |
| `ai.llm.chat_model` | AI 对话模型 | `qwen-turbo` | - | - | 迁移窗口 |
| `ai.llm.chat_max_tokens` | 对话任务 max_tokens | 256 | token | 128–512 | 成本控制 |
| `ai.llm.temperature` | LLM 温度参数 | 0.3 | - | 0–1 | 抽取用低温、对话可调高 |
| `ai.tts.cache_enabled` | TTS 缓存开关 | true | bool | - | FR-VOI-09 |
| `ai.tts.cache_ttl_days` | TTS 缓存 TTL | 7 | 天 | 3–30 | 成本 vs 存储权衡 |
| `ai.vector.batch_size` | 向量化批处理大小 | 50 | 条 | 20–100 | 7.5 |
| `ai.vector.rebuild_interval_hours` | 向量索引重建间隔 | 24 | 小时 | 6–72 | 7.5 |

## 四、消息与推送配置（6 项）

| 配置项 key | 说明 | 默认值 | 单位 | 可调范围 | 对应需求 |
|---|---|---|---|---|---|
| `message.unread_retention_days` | 未读消息保留天数 | 30 | 天 | 7–90 | FR-MSG-04 |
| `push.expiry_reminder_enabled` | 是否启用到期提醒推送 | true | bool | - | FR-PUB-13 |
| `push.audit_result_enabled` | 是否启用审核结果推送 | true | bool | - | FR-AUDIT-09 |
| `push.new_message_enabled` | 是否启用新消息推送 | true | bool | - | FR-MSG-05 |
| `wechat.article_bottom_post_count` | 公众号图文底部挂载信息条数 | 5 | 条 | 3–10 | FR-WX-04 |
| `wechat.weekly_digest_day` | 周报推送星期几 | 1 | (周一) | 1–7 | FR-WX-03 |

## 五、性能与成本配置（5 项）

| 配置项 key | 说明 | 默认值 | 单位 | 可调范围 | 备注 |
|---|---|---|---|---|---|
| `perf.redis_maxmemory_mb` | Redis 最大内存 | 512 | MB | 256–2048 | 3.4 |
| `perf.list_cache_ttl_seconds` | 列表页缓存 TTL | 60 | 秒 | 30–300 | 7.2 |
| `perf.detail_cache_ttl_seconds` | 详情页缓存 TTL | 300 | 秒 | 60–3600 | 7.2 |
| `cost.single_post_target` | 单条信息服务端成本目标 | 0.02 | 元 | - | KPI，1.5 |
| `cost.daily_audit_budget` | 日审核成本预算 | 100 | 元 | 50–500 | 4.4.5 |

## 六、数据库设计（config 表结构）

```sql
CREATE TABLE config (
  `key` VARCHAR(64) PRIMARY KEY COMMENT '配置项唯一键',
  `value` TEXT COMMENT '配置值（支持 JSON）',
  `type` ENUM('int','float','bool','string','json') COMMENT '值类型',
  `category` VARCHAR(32) COMMENT '分类：account/post/audit/antifraud/ai/message/perf',
  `description` VARCHAR(255) COMMENT '配置说明',
  `editable` BOOLEAN DEFAULT TRUE COMMENT '是否允许后台编辑',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT COMMENT '最后修改人 admin_id',
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全局配置表';
```

**关键字段说明**：
- `editable=false`：AI 提供商、数据库连接等基础设施配置，不允许后台改（需改配置文件重启）
- `type`：前端根据类型渲染不同表单控件（数字框/开关/文本框/JSON 编辑器）
- `updated_by`：配置变更必须留痕，追溯到人

## 七、配置服务设计（代码层）

### 7.1 统一配置读取接口

```go
// config/service.go
type ConfigService interface {
    GetInt(key string) int
    GetFloat(key string) float64
    GetBool(key string) bool
    GetString(key string) string
    GetJSON(key string) interface{}
    Set(key, value string, adminID int) error
    Reload() error  // 从数据库重新加载到内存
}
```

### 7.2 三层读取策略

1. **内存缓存**（启动时加载 + 定时刷新）：常用配置常驻内存，避免每次查库
2. **Redis 缓存**（TTL 300s）：变更后主动刷新，多实例间共享
3. **数据库兜底**：前两层未命中时查库

### 7.3 配置变更生效机制

| 配置类型 | 生效方式 | 实现 |
|---|---|---|
| 限额类（发布条数、查看次数） | **实时生效** | 写入 config 表 → 清除 Redis 缓存 → 下次请求读取新值 |
| 审核规则 | **实时生效** | 单独的 `audit_rules` 表 + Worker 定时加载（60s） |
| AI 参数 | **重启生效** | 配置文件 + 环境变量，迁移时改 |
| 消息模板 | **实时生效** | `message_templates` 表 + Redis 缓存 |

### 7.4 首期实现建议

**首期必须做**：
1. `config` 表结构建好，初始数据全部入库
2. ConfigService 封装好，**业务代码禁止硬编码任何数值**
3. 后台管理端"系统配置"页面，按 category 分 tab 展示可编辑项

**首期可以省略**：
- 配置变更审批流（直接改即生效，留操作日志即可）
- 配置版本管理与回滚（记录到 `config_history` 表但不做 UI）
- 配置 A/B 测试能力

## 八、后台管理端配置页面原型

```
┌─ 系统配置 ────────────────────────────────────────┐
│ [账号与权限] [发布规则] [审核策略] [反诈拦截]      │
│ [AI参数] [消息推送] [性能与成本]                   │
├──────────────────────────────────────────────────┤
│ ▼ 账号与权限                                      │
│                                                   │
│  普通用户日发布条数    [  3  ] 条   (1–10)        │
│  认证用户日发布条数    [ 10  ] 条   (5–50)        │
│  每日查看联系方式上限  [ 20  ] 次   (10–100)      │
│  举报通过奖励发布条数  [  1  ] 条   (0–5)         │
│  举报通过奖励查看次数  [  5  ] 次   (0–20)        │
│  新账号定义天数        [  3  ] 天   (1–7)         │
│                                                   │
│  ✅ 所有改动实时生效   [保存修改]                  │
│                                                   │
│ ▼ 发布规则                                        │
│  零工/有偿任务默认有效期  [  2  ] 天              │
│  助农供求默认有效期      [  7  ] 天               │
│  二手市场默认有效期      [ 15  ] 天               │
│  ... (以此类推)                                   │
└──────────────────────────────────────────────────┘
```

**交互要点**：
1. 每个数字框右侧显示可调范围，超范围不允许保存
2. 保存前二次确认："此修改将影响所有用户，确认吗？"
3. 保存后记录操作日志：时间、操作人、改了什么、旧值 → 新值

## 九、配置变更操作日志表

```sql
CREATE TABLE config_change_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(64),
  old_value TEXT,
  new_value TEXT,
  admin_id INT,
  admin_name VARCHAR(64),
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_key_time (config_key, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配置变更日志';
```

每次调用 `ConfigService.Set()` 必须同时写入此表，审计溯源。

---

**总结**：本文档列出 67 项可配置参数（业务 37 + AI 11 + 消息 6 + 性能 5 + 其他 8），首期实现时必须做到**三个统一**：

1. **统一存储**：所有配置入 `config` 表，禁止散落在代码常量
2. **统一读取**：所有业务代码通过 ConfigService 读取，禁止硬编码
3. **统一管理**：后台管理端提供可视化编辑界面，留操作日志

这是"留后门"的正确姿势——不是事后打补丁，而是第一行代码就按可配置架构写。
