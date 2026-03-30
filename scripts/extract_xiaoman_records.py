#!/usr/bin/env python3
import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path


ENTRY_PATTERN = re.compile(r"^## (?P<ts>.+?)\n(?P<body>.*?)(?=^## |\Z)", re.M | re.S)
FIELD_PATTERN = re.compile(r"^- (?P<key>[a-zA-Z0-9_]+): (?P<value>.*)$", re.M)
MAGNET_PATTERN = re.compile(r"([+-]?\d+)\s*个?磁贴")
CHINESE_MAGNET_PATTERN = re.compile(r"([零一二两三四五六七八九十百]+)\s*个?磁贴")
CHINESE_DIGITS = {
    "零": 0,
    "一": 1,
    "二": 2,
    "两": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
}


@dataclass
class ExtractedRecord:
    happened_at: str
    raw_mode: str
    query: str
    answer: str
    matched_keyword: str
    magnet_delta: int | None
    event_type: str
    aligned_log_type: str
    aligned_description: str
    aligned_amount: int
    aligned_task_title: str | None
    source_file: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract XiaoMan-related records from raw Markdown logs."
    )
    parser.add_argument("--input-dir", default="data/raw")
    parser.add_argument("--output-dir", default="data/extracted")
    parser.add_argument("--keyword", default="小满")
    parser.add_argument(
        "--alignment-config",
        default="config/local_ai_alignment.json",
    )
    return parser.parse_args()


def parse_entry(block: str) -> dict[str, str]:
    fields = {}
    for match in FIELD_PATTERN.finditer(block):
        fields[match.group("key")] = match.group("value").strip()
    return fields


def detect_magnet_delta(text: str) -> int | None:
    match = MAGNET_PATTERN.search(text)
    if not match:
        match = CHINESE_MAGNET_PATTERN.search(text)
        if not match:
            return None
        return chinese_number_to_int(match.group(1))
    return int(match.group(1))


def chinese_number_to_int(text: str) -> int | None:
    text = text.strip()
    if not text:
        return None
    if text == "十":
        return 10
    if "百" in text:
        parts = text.split("百", 1)
        hundreds = CHINESE_DIGITS.get(parts[0], 1) if parts[0] else 1
        remainder = chinese_number_to_int(parts[1]) or 0
        return hundreds * 100 + remainder
    if "十" in text:
        parts = text.split("十", 1)
        tens = CHINESE_DIGITS.get(parts[0], 1) if parts[0] else 1
        ones = CHINESE_DIGITS.get(parts[1], 0) if parts[1] else 0
        return tens * 10 + ones
    if len(text) == 1:
        return CHINESE_DIGITS.get(text)
    total = 0
    for ch in text:
        value = CHINESE_DIGITS.get(ch)
        if value is None:
            return None
        total = total * 10 + value
    return total


def detect_event_type(text: str) -> str:
    if re.search(r"兑换|换了|换成", text):
        return "redeem"
    if re.search(r"赚了|获得|得了|奖励", text):
        return "earn"
    if re.search(r"做了什么|做了|完成了|去了|玩了", text):
        return "activity"
    return "note"


def load_alignment_config(path: str) -> list[dict]:
    p = Path(path)
    if not p.exists():
        return []
    return json.loads(p.read_text(encoding="utf-8")).get("tasks", [])


def match_task_title(text: str, task_configs: list[dict]) -> str | None:
    for task in task_configs:
        title = task.get("title", "")
        aliases = task.get("aliases", [])
        if title and title in text:
            return title
        for alias in aliases:
            if alias and alias in text:
                return title
    return None


def build_aligned_record(
    happened_at: str,
    raw_mode: str,
    query: str,
    answer: str,
    keyword: str,
    source_file: str,
    task_configs: list[dict],
) -> ExtractedRecord:
    joined = f"{query}\n{answer}"
    magnet_delta = detect_magnet_delta(joined)
    task_title = match_task_title(joined, task_configs)

    if task_title:
        return ExtractedRecord(
            happened_at=happened_at,
            raw_mode=raw_mode,
            query=query,
            answer=answer,
            matched_keyword=keyword,
            magnet_delta=magnet_delta,
            event_type="task-complete",
            aligned_log_type="earn",
            aligned_description=f"完成约定: {task_title}",
            aligned_amount=magnet_delta or 1,
            aligned_task_title=task_title,
            source_file=source_file,
        )

    clean_text = query.strip() or answer.strip()
    if clean_text.startswith("测试记录"):
        clean_text = clean_text.replace("测试记录", "", 1).strip()
    return ExtractedRecord(
        happened_at=happened_at,
        raw_mode=raw_mode,
        query=query,
        answer=answer,
        matched_keyword=keyword,
        magnet_delta=magnet_delta,
        event_type="magnet-moment",
        aligned_log_type="magnet-moment",
        aligned_description=f"磁贴时刻: {clean_text}",
        aligned_amount=magnet_delta or 1,
        aligned_task_title=None,
        source_file=source_file,
    )


def main() -> None:
    args = parse_args()
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    task_configs = load_alignment_config(args.alignment_config)

    extracted: list[ExtractedRecord] = []
    for path in sorted(input_dir.glob("*.md")):
        content = path.read_text(encoding="utf-8")
        for match in ENTRY_PATTERN.finditer(content):
            happened_at = match.group("ts").strip()
            body = match.group("body")
            fields = parse_entry(body)
            query = fields.get("query", "")
            answer = fields.get("answer", "")
            joined = f"{query}\n{answer}"
            if args.keyword not in joined:
                continue
            extracted.append(
                build_aligned_record(
                    happened_at=happened_at,
                    raw_mode=fields.get("mode", ""),
                    query=query,
                    answer=answer,
                    keyword=args.keyword,
                    source_file=path.name,
                    task_configs=task_configs,
                )
            )

    ndjson_path = output_dir / "xiaoman_records.ndjson"
    markdown_path = output_dir / "xiaoman_records.md"

    with ndjson_path.open("w", encoding="utf-8") as f:
        for item in extracted:
            f.write(json.dumps(asdict(item), ensure_ascii=False) + "\n")

    lines = [
        "# XiaoMan Extracted Records",
        "",
        f"- keyword: {args.keyword}",
        f"- count: {len(extracted)}",
        "",
    ]
    for item in extracted:
        lines.extend(
            [
                f"## {item.happened_at}",
                f"- raw_mode: {item.raw_mode}",
                f"- event_type: {item.event_type}",
                f"- magnet_delta: {item.magnet_delta if item.magnet_delta is not None else ''}",
                f"- aligned_log_type: {item.aligned_log_type}",
                f"- aligned_amount: {item.aligned_amount}",
                f"- aligned_task_title: {item.aligned_task_title or ''}",
                f"- aligned_description: {item.aligned_description}",
                f"- source_file: {item.source_file}",
                f"- query: {item.query}",
                f"- answer: {item.answer}",
                "",
            ]
        )
    markdown_path.write_text("\n".join(lines), encoding="utf-8")

    print(f"extracted={len(extracted)}")
    print(f"ndjson={ndjson_path}")
    print(f"markdown={markdown_path}")


if __name__ == "__main__":
    main()
