#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="${XIAOGPT_VENV:-$ROOT/.venv-xiaogpt-local}"
CONFIG_PATH="${XIAOGPT_CONFIG_PATH:-$ROOT/runtime/xiaogpt/config.yaml}"
ENV_FILE="${XIAOGPT_ENV_FILE:-$ROOT/.env.local}"
HARDWARE="${XIAOGPT_HARDWARE:-L05B}"
MI_DID="${XIAOGPT_MI_DID:-2116704058}"
OUTPUT_DIR="${XIAOGPT_OUTPUT_DIR:-data/raw}"

cd "$ROOT"
mkdir -p data/raw data/logs

exec "$VENV/bin/python" scripts/xiaogpt_markdown_logger.py \
  --config-path "$CONFIG_PATH" \
  --env-file "$ENV_FILE" \
  --hardware "$HARDWARE" \
  --mi-did "$MI_DID" \
  --output-dir "$OUTPUT_DIR" \
  --record-only
