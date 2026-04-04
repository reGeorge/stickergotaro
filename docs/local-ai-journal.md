# Local AI Journal

This branch keeps the miniapp code, but adds a local data pipeline for XiaoAi conversation capture.

Related architecture note:

- `docs/local-architecture.md`

Primary data outputs:

- `data/source_history.md`
- `data/moments_logs.json`
- `data/reports/*.json|*.md|*.txt`

## 0. Host setup model

The code is no longer tied to one Mac path. The repo now supports this deployment shape:

- clone the repo on the target machine
- create `.venv-xiaogpt-local`
- copy only private machine-specific files such as `runtime/xiaogpt/config.yaml` and `.env.local`
- run the repo scripts directly, or install Linux `systemd --user` units from the repo

Private config lookup order:

- `runtime/xiaogpt/config.yaml`
- `~/.xiaogpt/config.yaml`

## 1. Start the local listener

The listener reads XiaoAi conversations, decides whether a turn should go through the configured LLM, and appends each turn to a daily Markdown file.

```bash
.venv-xiaogpt-local/bin/python scripts/xiaogpt_markdown_logger.py \
  --hardware L05B \
  --mi-did 2116704058 \
  --bot chatgptapi \
  --speak \
  --mute-xiaoai
```

Notes:

- API keys are loaded from `.env.local` when present.
- The default bot is `glm`, which lets you start the listener even before you finish wiring your preferred model key.
- Raw logs are written to `data/raw/YYYY-MM-DD.md`.
- Every logged block includes `query`, `answer`, `mode`, and metadata such as `request_id`.

If you only want reliable raw capture without any LLM call, use:

```bash
.venv-xiaogpt-local/bin/python scripts/xiaogpt_markdown_logger.py \
  --hardware L05B \
  --mi-did 2116704058 \
  --record-only
```

## 2. Extract XiaoMan-related records

After raw logs exist, run the extractor:

```bash
.venv-xiaogpt-local/bin/python scripts/extract_xiaoman_records.py
```

This creates:

- `data/extracted/xiaoman_records.ndjson`
- `data/extracted/xiaoman_records.md`

The extracted output now aligns with the miniapp's existing log model:

- task completion -> `aligned_log_type: earn`
- magnet moment -> `aligned_log_type: magnet-moment`

Task title matching is configured in:

- `config/local_ai_alignment.json`

## 3. Build miniapp-compatible logs

Convert extracted records into a `Log[]` JSON file that matches the miniapp store model:

```bash
.venv-xiaogpt-local/bin/python scripts/build_miniapp_logs.py \
  --input data/extracted/xiaoman_records.ndjson \
  --output data/moments_logs.json
```

This output is aligned to:

- task completion -> `type: "earn"` with `description: "完成约定: ..."`
- magnet moments -> `type: "magnet-moment"` with `description: "磁贴时刻: ..."`

In the miniapp `美好时光` page, the import action now supports both:

- Markdown clipboard import
- `logs.json` clipboard import

So a simple flow is:

```bash
cat data/moments_logs.json | pbcopy
```

Then open the miniapp's `美好时光` page and choose `导入 logs.json 剪贴板`.

## 4. Suggested daily job

Nightly script:

```bash
.venv-xiaogpt-local/bin/python scripts/run_nightly_pipeline.py
```

Included macOS `launchd` job:

- `launchd/com.regeorge.stickergotaro.xiaoman-nightly.plist`

Load it with:

```bash
mkdir -p ~/Library/LaunchAgents
cp launchd/com.regeorge.stickergotaro.xiaoman-nightly.plist ~/Library/LaunchAgents/
mkdir -p data/logs
launchctl unload ~/Library/LaunchAgents/com.regeorge.stickergotaro.xiaoman-nightly.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.regeorge.stickergotaro.xiaoman-nightly.plist
```

This will run every day at `23:00`.

## 5. Listener auto-start

Listener runner:

```bash
bash scripts/run_listener_service.sh
```

Included macOS `launchd` listener job:

- `launchd/com.regeorge.stickergotaro.listener.plist`

Load it with:

```bash
mkdir -p ~/Library/LaunchAgents
cp launchd/com.regeorge.stickergotaro.listener.plist ~/Library/LaunchAgents/
mkdir -p data/logs
launchctl unload ~/Library/LaunchAgents/com.regeorge.stickergotaro.listener.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.regeorge.stickergotaro.listener.plist
```

This listener starts at login and is kept alive by `launchd`.

## 6. Linux user service with systemd

Install the repo-managed user units:

```bash
bash scripts/install_systemd_user_units.sh
```

This installs:

- `stickergotaro-xiaogpt-listener.service`
- `stickergotaro-xiaoman-nightly.service`
- `stickergotaro-xiaoman-nightly.timer`

The generated units point back to the current clone path, so a Linux machine only needs:

- the checked-out repo
- `runtime/xiaogpt/config.yaml`
- `.env.local` if LLM keys are needed

Useful commands:

```bash
systemctl --user status stickergotaro-xiaogpt-listener.service
systemctl --user status stickergotaro-xiaoman-nightly.timer
journalctl --user -u stickergotaro-xiaogpt-listener.service -f
```

## 7. Local backend and Web UI

Minimal local backend:

```bash
python3 local_app/server.py
```

Or via helper:

```bash
zsh scripts/run_local_app.sh
```

Open in the browser:

```text
http://127.0.0.1:8765
```

This local app exposes:

- `/api/summary`
- `/api/sync`
- `/api/raw`
- `/api/extracted`
- `/api/miniapp-logs`
- `/api/reports/daily`
- `/api/reports/weekly`
- `/api/reports/monthly`

It also serves a simple dashboard that lets you inspect:

- recent raw XiaoAi records
- extracted XiaoMan records
- miniapp-aligned logs
- report pages for screenshot capture

SQLite database:

- `data/local_journal.db`

Manual sync:

```bash
.venv-xiaogpt-local/bin/python scripts/sync_sqlite.py
```

Report builder:

```bash
.venv-xiaogpt-local/bin/python scripts/build_reports.py
```

Screenshot builder:

```bash
zsh scripts/capture_report_screenshots.sh
```

This screenshot flow now uses `safaridriver` to capture the report pages themselves instead of grabbing a desktop area.

Before the first run on this Mac, enable Safari remote automation once:

- Safari > Settings > Advanced > Show features for web developers
- Develop > Allow Remote Automation

Included `launchd` Web UI job:

- `launchd/com.regeorge.stickergotaro.webui.plist`

## 8. Script vs LLM split

Use scripts for:

- raw logging
- keyword filtering
- magnet number extraction
- daily scheduling
- deterministic storage

Use an LLM for:

- deciding whether a note is really about XiaoMan growth data
- turning free-form language into structured events
- building weekly or monthly summaries
