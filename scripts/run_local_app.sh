#!/bin/zsh
set -euo pipefail

ROOT="/Users/regeorge/Documents/codeStore/stickergotaro"
cd "$ROOT"

exec python3 local_app/server.py
