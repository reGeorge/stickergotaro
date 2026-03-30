#!/usr/bin/env python3
import os
import json
import sqlite3
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from local_app.db import STATIC_DIR, connect_db, init_db, sync_all

REPORTS_DIR = ROOT / "data" / "reports"


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict]:
    return [dict(row) for row in rows]


def query_raw(limit: int = 100) -> list[dict]:
    conn = connect_db()
    try:
        init_db(conn)
        rows = conn.execute(
            """
            SELECT happened_at, source_file, source, mode, hardware, mi_did, request_id,
                   in_conversation, answer_source, query, answer, raw_answer
            FROM raw_conversations
            ORDER BY happened_at DESC, id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return rows_to_dicts(rows)
    finally:
        conn.close()


def query_extracted() -> list[dict]:
    conn = connect_db()
    try:
        init_db(conn)
        rows = conn.execute(
            """
            SELECT happened_at, raw_mode, query, answer, matched_keyword, magnet_delta,
                   event_type, aligned_log_type, aligned_description, aligned_amount,
                   aligned_task_title, source_file
            FROM extracted_records
            ORDER BY happened_at DESC, id DESC
            """
        ).fetchall()
        return rows_to_dicts(rows)
    finally:
        conn.close()


def query_miniapp_logs() -> list[dict]:
    conn = connect_db()
    try:
        init_db(conn)
        rows = conn.execute(
            """
            SELECT id, type, amount, description, timestamp, source,
                   raw_query AS rawQuery,
                   matched_keyword AS matchedKeyword,
                   aligned_task_title AS alignedTaskTitle
            FROM miniapp_logs
            ORDER BY timestamp DESC, id DESC
            """
        ).fetchall()
        return rows_to_dicts(rows)
    finally:
        conn.close()


def read_json_file(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def query_report(kind: str) -> dict:
    return read_json_file(REPORTS_DIR / f"{kind}_summary.json", {})


def build_summary() -> dict:
    raw_entries = query_raw(limit=500)
    extracted = query_extracted()
    miniapp_logs = query_miniapp_logs()
    return {
        "raw_count": len(raw_entries),
        "extracted_count": len(extracted),
        "miniapp_log_count": len(miniapp_logs),
        "latest_raw": raw_entries[0] if raw_entries else None,
        "latest_extracted": extracted[0] if extracted else None,
        "latest_miniapp_log": miniapp_logs[0] if miniapp_logs else None,
    }


class LocalAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def _send_json(self, payload: dict | list, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in {"/report/daily", "/report/weekly", "/report/monthly"}:
            self.path = "/report.html"
            return super().do_GET()
        if parsed.path == "/api/health":
            return self._send_json({"ok": True})
        if parsed.path == "/api/summary":
            return self._send_json(build_summary())
        if parsed.path == "/api/sync":
            conn = connect_db()
            try:
                result = sync_all(conn)
                return self._send_json(result)
            finally:
                conn.close()
        if parsed.path == "/api/raw":
            qs = parse_qs(parsed.query)
            limit = int(qs.get("limit", ["100"])[0])
            return self._send_json(query_raw(limit=limit))
        if parsed.path == "/api/extracted":
            return self._send_json(query_extracted())
        if parsed.path == "/api/miniapp-logs":
            return self._send_json(query_miniapp_logs())
        if parsed.path == "/api/reports/daily":
            return self._send_json(query_report("daily"))
        if parsed.path == "/api/reports/weekly":
            return self._send_json(query_report("weekly"))
        if parsed.path == "/api/reports/monthly":
            return self._send_json(query_report("monthly"))
        return super().do_GET()


def main() -> None:
    host = os.environ.get("LOCAL_APP_HOST", "0.0.0.0")
    port = int(os.environ.get("LOCAL_APP_PORT", "8765"))
    server = ThreadingHTTPServer((host, port), LocalAppHandler)
    print(f"Local app running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
