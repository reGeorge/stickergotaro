# Reports Protocol

这份文档规定龙虾在 `data/reports/` 下的标准输出格式。

## 目标

让龙虾输出稳定、可消费的中间结果，而不是直接改工程代码或生成 HTML。

## 目录约定

```text
data/
  reports/
    daily_summary.json
    daily_summary.md
    weekly_summary.json
    weekly_summary.md
    monthly_summary.json
    monthly_summary.md
  screenshots/
    daily_summary.png
    weekly_summary.png
  tmp/
```

## JSON 协议

### daily_summary.json

```json
{
  "date": "2026-03-29",
  "subject": "小满",
  "summary": "今天小满有 2 条值得记录的表现。",
  "items": [
    {
      "type": "magnet-moment",
      "description": "小满今天早上主动起床",
      "amount": 1,
      "source": "historyInfo"
    }
  ],
  "stats": {
    "count": 1,
    "magnet_total": 1
  }
}
```

### weekly_summary.json

```json
{
  "week_label": "2026-W13",
  "subject": "小满",
  "summary": "本周累计 6 条记录，合计 9 个磁贴。",
  "items": [],
  "stats": {
    "count": 6,
    "magnet_total": 9
  }
}
```

### monthly_summary.json

```json
{
  "month": "2026-03",
  "subject": "小满",
  "summary": "本月累计 14 条记录。",
  "items": [],
  "stats": {
    "count": 14,
    "magnet_total": 18
  }
}
```

## Markdown 协议

### daily_summary.md

```md
# 小满日报

- 日期：2026-03-29
- 磁贴总计：1

## 记录
- 小满今天早上主动起床（+1）
```

### weekly_summary.md

```md
# 小满周报

- 周次：2026-W13
- 本周记录：6 条
- 磁贴总计：9
```

### monthly_summary.md

```md
# 小满月报

- 月份：2026-03
- 本月记录：14 条
- 磁贴总计：18
```

## 输出规则

龙虾必须遵守：

- 只写固定文件名
- 只使用 JSON / Markdown
- 不得在 `data/reports/` 下创建随机命名文件
- 不得输出 HTML 页面源码
- 不得修改现有工程目录

## 展示规则

- Web UI 读取 `data/reports/*.json` 或 `data/reports/*.md`
- 群聊里优先发摘要文本
- 如果需要视觉化展示，优先发截图，不直接发 HTML
