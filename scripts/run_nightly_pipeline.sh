#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="${XIAOGPT_VENV:-$ROOT/.venv-xiaogpt-local}"

cd "$ROOT"

"$VENV/bin/python" scripts/extract_xiaoman_records.py \
  --input-dir data/raw \
  --output-dir data/extracted

"$VENV/bin/python" scripts/build_history_logs.py \
  --input docs/historyInfo.md \
  --output data/history_logs.json

"$VENV/bin/python" scripts/build_miniapp_logs.py \
  --input data/extracted/xiaoman_records.ndjson \
  --output data/moments_logs.json \
  --merge-with data/history_logs.json

"$VENV/bin/python" scripts/build_reports.py \
  --output-dir data/reports \
  --logs-input data/moments_logs.json

"$VENV/bin/python" scripts/build_source_history.py \
  --history-input docs/historyInfo.md \
  --raw-dir data/raw \
  --output data/source_history.md

bash scripts/capture_report_screenshots.sh || true

"$VENV/bin/python" scripts/sync_sqlite.py
