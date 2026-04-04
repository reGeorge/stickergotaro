# Local Architecture

这套系统目前更适合采用“宿主机采集 + 本地服务展示 + 定时整理”的结构。
脚本层现在已经是跨平台的，但服务托管层分成：

- macOS: `launchd`
- Linux: `systemd --user`

## 推荐架构

```text
                     ┌──────────────────────────────┐
                     │          你 / 家人            │
                     │   对小爱音箱说自然语言内容      │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │         小爱音箱 Play         │
                     │      小米云端会话记录接口      │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
          宿主机 macOS / Linux      ┌──────────────────────────────┐
   ┌───────────────────────────────▶│ xiaogpt listener            │
   │                                │ launchd / systemd --user    │
   │                                │ scripts/xiaogpt_markdown_   │
   │                                │ logger.py --record-only     │
   │                                └──────────────┬───────────────┘
   │                                               │
   │                                               ▼
   │                                ┌──────────────────────────────┐
   │                                │ 原始记录层                    │
   │                                │ data/raw/YYYY-MM-DD.md       │
   │                                └──────────────┬───────────────┘
   │                                               │
   │                           每天 23:00          ▼
   │                                ┌──────────────────────────────┐
   │                                │ nightly pipeline             │
   │                                │ launchd / systemd timer      │
   │                                │ extract + build logs         │
   │                                └──────────────┬───────────────┘
   │                                               │
   │                          ┌────────────────────┴────────────────────┐
   │                          ▼                                         ▼
   │           ┌──────────────────────────────┐        ┌──────────────────────────────┐
   │           │ 提取结果层                    │        │ miniapp 对齐日志              │
   │           │ data/extracted/              │        │ data/moments_logs.json        │
   │           │ xiaoman_records.ndjson/md    │        └──────────────────────────────┘
   │           └──────────────────────────────┘
   │                                               │
   │                                               ▼
   │                                ┌──────────────────────────────┐
   │                                │ 外部发布层                    │
   │                                │ obsidian / github.io         │
   │                                │ publish_external_outputs.py  │
   │                                └──────────────────────────────┘
   │
   │
   │   浏览器访问
   │                                ┌──────────────────────────────┐
   └───────────────────────────────▶│ local backend + web ui       │
                                    │ http://127.0.0.1:8765        │
                                    │ local_app/server.py          │
                                    └──────────────────────────────┘


                小程序侧
                ┌──────────────────────────────────────────────────────┐
                │ 现有 Taro 小程序                                    │
                │ 美好时光页支持导入 logs.json 剪贴板                   │
                │ src/pages/moments/index.tsx                         │
                └──────────────────────────────────────────────────────┘
```

## 分层职责

### 1. 宿主机采集层

- 负责连接本机的小爱账号环境
- 负责持续监听并记录原始对话
- 最适合交给宿主机服务管理器
- macOS 推荐 `launchd`
- Linux 推荐 `systemd --user`

### 2. 原始数据层

- 保存不可丢失的原话
- 采用 Markdown 按天滚动
- 这一层必须保真，不能依赖 LLM 成功

### 3. 规则提取层

- 提取包含“小满”的记录
- 识别磁贴数、任务别名、记录类型
- 输出成可追踪的结构化中间结果

### 4. 对齐输出层

- 把提取结果对齐成现有小程序可消费的 `Log[]`
- 当前重点对齐两类：
  - `earn`
  - `magnet-moment`

### 4.5 外部发布层

- `stickergotaro/data/*` 继续作为本地构建缓存
- 清洗后的记录同步到 `../obsidian/生活/小满成长记录/`
- 交互页、报告 JSON、摘要和截图同步到 `../regeorge.github.io/projects/xiaoman-growth-journal/`
- 发布入口统一由 `scripts/publish_external_outputs.py` 负责

### 5. 本地后端 / Web UI

- 负责查看、校验、人工确认、后续报表
- 当前是轻量本地 HTTP 服务
- 当前已接入本地 `SQLite`
- 后面可以升级成正式后端

## Docker 放在哪一层更合理

当前更推荐：

- 监听器：宿主机服务管理器
- nightly：宿主机服务管理器
- 本地后端 / Web UI：先宿主机，后续可迁到 Docker
- 数据库：如果将来引入正式数据库，这一层最适合 Docker

## 关于 Supabase

我的建议不是“现在立刻上”，而是“作为第二阶段后端数据库方案”。

### 什么时候适合用 Supabase

- 你要把原始记录、提取结果、结构化事件长期保存
- 你想做多设备访问
- 你想给 Web UI 做筛选、统计、报表
- 你以后可能会从“小程序导入”走到“直接由后端提供数据”

### 什么时候不必急着用 Supabase

- 当前采集和规则提取还在快速变化
- 你的数据量还很小
- 你现在更需要“低摩擦、随时可调”的本地开发环境

### 我的建议

第一阶段：

- 保持现在这套文件流 + 本地 Web UI
- 数据库存储先上 `SQLite`

第二阶段：

- 当字段基本稳定后，再迁到：
  - Supabase
  - 或本地 Postgres

### 为什么我不建议你现在马上上 Supabase

- 你目前还在探索事件模型
- “任务完成 / 美好记录 / 兑换 / 月度打卡” 这些结构还没最终定型
- 现在先用文件和轻量数据库，改模型成本更低

### 最终建议结论

- 短期：不必马上上 Supabase
- 中期：很适合用 Supabase 做正式后端
- 当前最优先：先把本地采集、规则、人工校验、Web UI 跑顺

## 外部代理约束

如果要让 OpenClaude / 龙虾参与这套系统，参考：

- `docs/lobster-guardrails.md`
- `docs/lobster-system-prompt.md`
- `docs/reports-protocol.md`

固定报告与群聊投喂产物：

- `data/reports/daily_summary.json`
- `data/reports/weekly_summary.json`
- `data/reports/monthly_summary.json`
- `data/reports/daily_message.txt`
- `data/reports/weekly_message.txt`
- `data/reports/monthly_message.txt`
- `data/screenshots/daily_summary.png`
- `data/screenshots/weekly_summary.png`
- `data/screenshots/monthly_summary.png`

外部发布目标：

- `../obsidian/生活/小满成长记录/source_history.md`
- `../obsidian/生活/小满成长记录/xiaoman_records.md`
- `../obsidian/生活/小满成长记录/moments_logs.json`
- `../regeorge.github.io/projects/xiaoman-growth-journal/index.html`
- `../regeorge.github.io/projects/xiaoman-growth-journal/data/*.json|*.md|*.txt`
- `../regeorge.github.io/projects/xiaoman-growth-journal/screenshots/*.png`
