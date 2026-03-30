#!/usr/bin/env python3
import argparse
import json
import sqlite3
import sys
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from local_app.db import connect_db, init_db


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build daily/weekly/monthly reports from SQLite and miniapp logs."
    )
    parser.add_argument("--output-dir", default="data/reports")
    parser.add_argument("--logs-input", default="data/moments_logs.json")
    parser.add_argument("--subject", default="小满")
    return parser.parse_args()


def load_logs(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else []


def ts_to_dt(ts_ms: int) -> datetime:
    return datetime.fromtimestamp(ts_ms / 1000)


def start_of_week(dt: datetime) -> datetime:
    return dt - timedelta(days=dt.weekday())


def filter_logs(logs: list[dict], predicate) -> list[dict]:
    return sorted([log for log in logs if predicate(log)], key=lambda x: x["timestamp"], reverse=True)


def build_stats(logs: list[dict]) -> dict:
    active_days = len({ts_to_dt(int(log.get("timestamp", 0))).strftime("%Y-%m-%d") for log in logs}) if logs else 0
    magnet_total = sum(int(log.get("amount", 0)) for log in logs)
    return {
        "count": len(logs),
        "magnet_total": magnet_total,
        "type_breakdown": dict(Counter(log.get("type", "") for log in logs)),
        "active_days": active_days,
        "average_magnets": round(magnet_total / len(logs), 1) if logs else 0,
    }


def simplify_item(log: dict) -> dict:
    return {
        "id": log.get("id"),
        "type": log.get("type"),
        "description": log.get("description", "").replace("磁贴时刻: ", "").replace("完成约定: ", ""),
        "amount": int(log.get("amount", 0)),
        "source": log.get("source"),
        "timestamp": int(log.get("timestamp", 0)),
    }


def latest_raw_meta() -> dict | None:
    conn = connect_db()
    try:
        init_db(conn)
        row = conn.execute(
            """
            SELECT happened_at, source_file, query, answer
            FROM raw_conversations
            ORDER BY happened_at DESC, id DESC
            LIMIT 1
            """
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def render_markdown(payload: dict) -> str:
    lines = [
        f"# {payload['title']}",
        "",
        f"- 时间范围：{payload['label']}",
        f"- 记录数：{payload['stats']['count']}",
        f"- 磁贴总计：{payload['stats']['magnet_total']}",
        "",
        "## 摘要",
        payload["summary"],
        "",
        "## 亮点",
    ]
    if payload["highlights"]:
        for item in payload["highlights"]:
            lines.append(f"- {item['description']}（+{item['amount']}）")
    else:
        lines.append("- 暂无亮点记录")
    lines.extend(["", "## 全部记录"])
    if payload["items"]:
        for item in payload["items"]:
            dt = ts_to_dt(item["timestamp"]).strftime("%m-%d %H:%M")
            lines.append(f"- [{dt}] {item['description']}（+{item['amount']}）")
    else:
        lines.append("- 暂无记录")
    return "\n".join(lines) + "\n"


def render_message(payload: dict) -> str:
    if payload["stats"]["count"] == 0:
        return f"{payload['title']}：今天暂无新的小满记录。\n截图：data/screenshots/{payload['kind']}_summary.png\n"
    highlights = payload["highlights"][:3]
    lines = [f"{payload['title']}：{payload['summary']}"]
    if highlights:
        lines.append("亮点：" + "；".join(f"{item['description']}（+{item['amount']}）" for item in highlights))
    lines.append(f"截图：data/screenshots/{payload['kind']}_summary.png")
    return "\n".join(lines) + "\n"


def build_period_payload(kind: str, logs: list[dict], subject: str) -> tuple[dict, str, str]:
    now = datetime.now()
    if kind == "daily":
        selected = filter_logs(logs, lambda l: ts_to_dt(int(l["timestamp"])).date() == now.date())
        label = now.strftime("%Y-%m-%d")
        title = f"{subject}日报"
        hero_tagline = "聚焦今天新增的记录和当下状态。"
        period_caption = "今天"
    elif kind == "weekly":
        week_start = start_of_week(now)
        week_end = week_start + timedelta(days=7)
        selected = filter_logs(logs, lambda l: week_start.date() <= ts_to_dt(int(l["timestamp"])).date() < week_end.date())
        label = f"{week_start.strftime('%Y-%m-%d')} ~ {(week_end - timedelta(days=1)).strftime('%Y-%m-%d')}"
        title = f"{subject}周报"
        hero_tagline = "回看这一周里持续发生的高光片段。"
        period_caption = "本周"
    else:
        selected = filter_logs(logs, lambda l: ts_to_dt(int(l["timestamp"])).strftime("%Y-%m") == now.strftime("%Y-%m"))
        label = now.strftime("%Y-%m")
        title = f"{subject}月报"
        hero_tagline = "把这个月积累下来的变化整理成一张完整切面。"
        period_caption = "本月"

    stats = build_stats(selected)
    highlights = [simplify_item(log) for log in selected[:5]]
    grouped_timeline = []
    for day in sorted({ts_to_dt(item["timestamp"]).strftime("%Y-%m-%d") for item in highlights + [simplify_item(log) for log in selected]}, reverse=True):
        day_items = [
            simplify_item(log)
            for log in selected
            if ts_to_dt(int(log["timestamp"])).strftime("%Y-%m-%d") == day
        ]
        grouped_timeline.append(
            {
                "date": day,
                "count": len(day_items),
                "magnet_total": sum(int(item["amount"]) for item in day_items),
                "items": day_items[:8],
            }
        )
    summary = (
        f"{label}共记录 {stats['count']} 条，累计 {stats['magnet_total']} 个磁贴。"
        if selected
        else f"{label}暂无新的相关记录。"
    )
    payload = {
        "kind": kind,
        "label": label,
        "subject": subject,
        "title": title,
        "hero_tagline": hero_tagline,
        "period_caption": period_caption,
        "summary": summary,
        "items": [simplify_item(log) for log in selected],
        "highlights": highlights,
        "timeline": grouped_timeline,
        "stats": stats,
        "latest_raw": latest_raw_meta(),
        "generated_at": now.isoformat(timespec="seconds"),
    }
    return payload, render_markdown(payload), render_message(payload)


def write_outputs(output_dir: Path, kind: str, payload: dict, markdown: str, message: str) -> None:
    (output_dir / f"{kind}_summary.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output_dir / f"{kind}_summary.md").write_text(markdown, encoding="utf-8")
    (output_dir / f"{kind}_message.txt").write_text(message, encoding="utf-8")


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    logs = load_logs(Path(args.logs_input))
    for kind in ("daily", "weekly", "monthly"):
        payload, markdown, message = build_period_payload(kind, logs, args.subject)
        write_outputs(output_dir, kind, payload, markdown, message)
    print(f"output_dir={output_dir}")
    print("reports=3")


if __name__ == "__main__":
    main()
