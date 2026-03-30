#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path


ROOT = Path("/Users/regeorge/Documents/codeStore/stickergotaro")
PYTHON = ROOT / ".venv-xiaogpt-local" / "bin" / "python"


def run(*args: str, allow_failure: bool = False) -> None:
    cmd = [str(PYTHON), *args]
    result = subprocess.run(cmd, cwd=ROOT)
    if result.returncode != 0 and not allow_failure:
        raise SystemExit(result.returncode)


def main() -> None:
    run(
        str(ROOT / "scripts" / "extract_xiaoman_records.py"),
        "--input-dir",
        str(ROOT / "data" / "raw"),
        "--output-dir",
        str(ROOT / "data" / "extracted"),
    )
    run(
        str(ROOT / "scripts" / "build_history_logs.py"),
        "--input",
        str(ROOT / "docs" / "historyInfo.md"),
        "--output",
        str(ROOT / "data" / "history_logs.json"),
    )
    run(
        str(ROOT / "scripts" / "build_miniapp_logs.py"),
        "--input",
        str(ROOT / "data" / "extracted" / "xiaoman_records.ndjson"),
        "--output",
        str(ROOT / "data" / "moments_logs.json"),
        "--merge-with",
        str(ROOT / "data" / "history_logs.json"),
    )
    run(
        str(ROOT / "scripts" / "build_reports.py"),
        "--output-dir",
        str(ROOT / "data" / "reports"),
        "--logs-input",
        str(ROOT / "data" / "moments_logs.json"),
    )
    run(
        str(ROOT / "scripts" / "build_source_history.py"),
        "--history-input",
        str(ROOT / "docs" / "historyInfo.md"),
        "--raw-dir",
        str(ROOT / "data" / "raw"),
        "--output",
        str(ROOT / "data" / "source_history.md"),
    )
    run(str(ROOT / "scripts" / "capture_report_screenshots.py"), allow_failure=True)
    run(str(ROOT / "scripts" / "sync_sqlite.py"))


if __name__ == "__main__":
    main()
