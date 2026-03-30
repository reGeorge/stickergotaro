#!/usr/bin/env python3
import json
import re
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STATIC_DIR = ROOT / "local_app" / "static"
DB_PATH = ROOT / "data" / "local_journal.db"
RAW_DIR = ROOT / "data" / "raw"
EXTRACTED_NDJSON = ROOT / "data" / "extracted" / "xiaoman_records.ndjson"
MINIAPP_LOGS = ROOT / "data" / "moments_logs.json"
ENTRY_PATTERN = re.compile(r"^## (?P<ts>.+?)\n(?P<body>.*?)(?=^## |\Z)", re.M | re.S)
FIELD_PATTERN = re.compile(r"^- (?P<key>[a-zA-Z0-9_]+): (?P<value>.*)$", re.M)


def connect_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS raw_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            happened_at TEXT NOT NULL,
            source_file TEXT NOT NULL,
            source TEXT,
            mode TEXT,
            hardware TEXT,
            mi_did TEXT,
            request_id TEXT,
            in_conversation TEXT,
            answer_source TEXT,
            query TEXT,
            answer TEXT,
            raw_answer TEXT,
            UNIQUE(source_file, request_id, happened_at)
        );

        CREATE TABLE IF NOT EXISTS extracted_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            happened_at TEXT NOT NULL,
            raw_mode TEXT,
            query TEXT,
            answer TEXT,
            matched_keyword TEXT,
            magnet_delta INTEGER,
            event_type TEXT,
            aligned_log_type TEXT,
            aligned_description TEXT,
            aligned_amount INTEGER,
            aligned_task_title TEXT,
            source_file TEXT,
            UNIQUE(happened_at, aligned_description, source_file)
        );

        CREATE TABLE IF NOT EXISTS miniapp_logs (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            amount INTEGER NOT NULL,
            description TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            source TEXT,
            raw_query TEXT,
            matched_keyword TEXT,
            aligned_task_title TEXT
        );
        """
    )
    conn.commit()


def parse_raw_markdown() -> list[dict]:
    entries: list[dict] = []
    for path in sorted(RAW_DIR.glob("*.md")):
        content = path.read_text(encoding="utf-8")
        for match in ENTRY_PATTERN.finditer(content):
            fields = {
                m.group("key"): m.group("value").strip()
                for m in FIELD_PATTERN.finditer(match.group("body"))
            }
            entries.append(
                {
                    "happened_at": match.group("ts").strip(),
                    "source_file": path.name,
                    **fields,
                }
            )
    return entries


def read_ndjson(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        rows.append(json.loads(line))
    return rows


def read_json(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else []


def sync_raw(conn: sqlite3.Connection) -> int:
    rows = parse_raw_markdown()
    conn.execute("DELETE FROM raw_conversations")
    conn.executemany(
        """
        INSERT INTO raw_conversations (
            happened_at, source_file, source, mode, hardware, mi_did, request_id,
            in_conversation, answer_source, query, answer, raw_answer
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                row.get("happened_at"),
                row.get("source_file"),
                row.get("source"),
                row.get("mode"),
                row.get("hardware"),
                row.get("mi_did"),
                row.get("request_id"),
                row.get("in_conversation"),
                row.get("answer_source"),
                row.get("query"),
                row.get("answer"),
                row.get("raw_answer"),
            )
            for row in rows
        ],
    )
    conn.commit()
    return len(rows)


def sync_extracted(conn: sqlite3.Connection) -> int:
    rows = read_ndjson(EXTRACTED_NDJSON)
    conn.execute("DELETE FROM extracted_records")
    conn.executemany(
        """
        INSERT INTO extracted_records (
            happened_at, raw_mode, query, answer, matched_keyword, magnet_delta,
            event_type, aligned_log_type, aligned_description, aligned_amount,
            aligned_task_title, source_file
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                row.get("happened_at"),
                row.get("raw_mode"),
                row.get("query"),
                row.get("answer"),
                row.get("matched_keyword"),
                row.get("magnet_delta"),
                row.get("event_type"),
                row.get("aligned_log_type"),
                row.get("aligned_description"),
                row.get("aligned_amount"),
                row.get("aligned_task_title"),
                row.get("source_file"),
            )
            for row in rows
        ],
    )
    conn.commit()
    return len(rows)


def sync_miniapp_logs(conn: sqlite3.Connection) -> int:
    rows = read_json(MINIAPP_LOGS)
    conn.execute("DELETE FROM miniapp_logs")
    conn.executemany(
        """
        INSERT INTO miniapp_logs (
            id, type, amount, description, timestamp, source, raw_query,
            matched_keyword, aligned_task_title
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                row.get("id"),
                row.get("type"),
                row.get("amount"),
                row.get("description"),
                row.get("timestamp"),
                row.get("source"),
                row.get("rawQuery"),
                row.get("matchedKeyword"),
                row.get("alignedTaskTitle"),
            )
            for row in rows
        ],
    )
    conn.commit()
    return len(rows)


def sync_all(conn: sqlite3.Connection) -> dict:
    init_db(conn)
    return {
        "raw_conversations": sync_raw(conn),
        "extracted_records": sync_extracted(conn),
        "miniapp_logs": sync_miniapp_logs(conn),
        "db_path": str(DB_PATH),
    }
