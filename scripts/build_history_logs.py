#!/usr/bin/env python3
import argparse
import json
import re
from datetime import datetime
from pathlib import Path


HEADER_RE = re.compile(r"^##\s+(?P<label>\d{2})月(?P<day>\d{2})日\s*$")
ITEM_RE = re.compile(r"^- (?P<desc>.+?) \(\+(?P<amount>\d+)\)\s*$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert docs/historyInfo.md into miniapp-compatible magnet-moment logs."
    )
    parser.add_argument("--input", default="docs/historyInfo.md")
    parser.add_argument("--output", default="data/history_logs.json")
    parser.add_argument("--year", type=int, default=datetime.now().year)
    return parser.parse_args()


def build_timestamp(year: int, month: int, day: int, seq: int) -> int:
    return int(datetime(year, month, day, 12, min(seq, 59), 0).timestamp() * 1000)


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        output_path.write_text("[]\n", encoding="utf-8")
        print(f"output={output_path}")
        return

    current_month = None
    current_day = None
    seq = 0
    logs: list[dict] = []

    for raw_line in input_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        header = HEADER_RE.match(line)
        if header:
            current_month = int(header.group("label"))
            current_day = int(header.group("day"))
            seq = 0
            continue
        item = ITEM_RE.match(line)
        if item and current_month and current_day:
            seq += 1
            desc = item.group("desc").strip()
            amount = int(item.group("amount"))
            ts = build_timestamp(args.year, current_month, current_day, seq)
            logs.append(
                {
                    "id": f"history-{ts}-{seq}",
                    "type": "magnet-moment",
                    "amount": amount,
                    "description": f"磁贴时刻: {desc}",
                    "timestamp": ts,
                    "source": "historyInfo",
                    "rawQuery": desc,
                    "matchedKeyword": "小满",
                    "alignedTaskTitle": None,
                }
            )

    output_path.write_text(
        json.dumps(logs, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"output={output_path}")
    print(f"logs={len(logs)}")


if __name__ == "__main__":
    main()
