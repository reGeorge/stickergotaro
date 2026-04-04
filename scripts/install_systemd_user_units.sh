#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"

mkdir -p "$UNIT_DIR"

render_unit() {
  local src="$1"
  local dest="$2"
  sed "s|__ROOT__|$ROOT|g" "$src" > "$dest"
}

render_unit "$ROOT/systemd/stickergotaro-xiaogpt-listener.service" \
  "$UNIT_DIR/stickergotaro-xiaogpt-listener.service"
render_unit "$ROOT/systemd/stickergotaro-xiaoman-nightly.service" \
  "$UNIT_DIR/stickergotaro-xiaoman-nightly.service"
cp "$ROOT/systemd/stickergotaro-xiaoman-nightly.timer" \
  "$UNIT_DIR/stickergotaro-xiaoman-nightly.timer"

systemctl --user daemon-reload
systemctl --user enable --now stickergotaro-xiaogpt-listener.service
systemctl --user enable --now stickergotaro-xiaoman-nightly.timer

printf 'Installed user units into %s\n' "$UNIT_DIR"
