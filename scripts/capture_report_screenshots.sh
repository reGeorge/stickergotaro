#!/bin/zsh
set -euo pipefail

ROOT="/Users/regeorge/Documents/codeStore/stickergotaro"
cd "$ROOT"

python3 scripts/capture_report_screenshots.py "$@"
