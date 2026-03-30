#!/bin/zsh
set -euo pipefail

ROOT="/Users/regeorge/Documents/codeStore/stickergotaro"
VENV="$ROOT/.venv-xiaogpt-local"

cd "$ROOT"
mkdir -p data/raw data/logs

exec "$VENV/bin/python" scripts/xiaogpt_markdown_logger.py \
  --hardware L05B \
  --mi-did 2116704058 \
  --output-dir data/raw \
  --record-only
