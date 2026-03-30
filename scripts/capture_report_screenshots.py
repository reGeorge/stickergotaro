#!/usr/bin/env python3
import argparse
import base64
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Capture stable report screenshots via safaridriver.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8765/report")
    parser.add_argument("--output-dir", default="data/screenshots")
    parser.add_argument("--port", type=int, default=5566)
    parser.add_argument("--width", type=int, default=1440)
    parser.add_argument("--height", type=int, default=1200)
    parser.add_argument("--delay", type=float, default=1.8)
    return parser.parse_args()


def request_json(method: str, url: str, payload: dict | None = None) -> dict:
    data = None
    headers = {"Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read()
    return json.loads(raw.decode("utf-8")) if raw else {}


def wait_for_server(base: str, timeout: float = 10.0) -> None:
    deadline = time.time() + timeout
    last_error = None
    while time.time() < deadline:
        try:
            request_json("GET", f"{base}/status")
            return
        except Exception as exc:  # pragma: no cover - polling
            last_error = exc
            time.sleep(0.2)
    raise RuntimeError(f"safaridriver did not become ready: {last_error}")


def start_driver(port: int) -> subprocess.Popen:
    proc = subprocess.Popen(
        ["safaridriver", "--port", str(port)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    wait_for_server(f"http://127.0.0.1:{port}")
    return proc


def create_session(base: str) -> str:
    payload = {
        "capabilities": {
            "alwaysMatch": {
                "browserName": "safari",
                "safari:automaticInspection": False,
                "safari:automaticProfiling": False,
            }
        }
    }
    result = request_json("POST", f"{base}/session", payload)
    session_id = result.get("sessionId") or result.get("value", {}).get("sessionId")
    if not session_id:
        raise RuntimeError(f"failed to create Safari session: {result}")
    return session_id


def delete_session(base: str, session_id: str) -> None:
    try:
        request_json("DELETE", f"{base}/session/{session_id}")
    except Exception:
        pass


def set_window_rect(base: str, session_id: str, width: int, height: int) -> None:
    request_json(
        "POST",
        f"{base}/session/{session_id}/window/rect",
        {"x": 40, "y": 60, "width": width, "height": height},
    )


def wait_until_ready(base: str, session_id: str, delay: float) -> None:
    time.sleep(delay)
    request_json(
        "POST",
        f"{base}/session/{session_id}/execute/sync",
        {
            "script": """
                return {
                  readyState: document.readyState,
                  title: document.title,
                  bodyHeight: document.body ? document.body.scrollHeight : 0
                };
            """,
            "args": [],
        },
    )
    time.sleep(0.5)


def navigate(base: str, session_id: str, url: str) -> None:
    request_json("POST", f"{base}/session/{session_id}/url", {"url": url})


def capture_png(base: str, session_id: str, output_path: Path) -> None:
    result = request_json("GET", f"{base}/session/{session_id}/screenshot")
    encoded = result.get("value")
    if not encoded:
        raise RuntimeError(f"missing screenshot payload: {result}")
    output_path.write_bytes(base64.b64decode(encoded))


def main() -> None:
    args = parse_args()
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    base = f"http://127.0.0.1:{args.port}"
    proc = start_driver(args.port)
    session_id = None
    try:
        session_id = create_session(base)
        set_window_rect(base, session_id, args.width, args.height)
        for kind in ("daily", "weekly", "monthly"):
            navigate(base, session_id, f"{args.base_url}/{kind}")
            wait_until_ready(base, session_id, args.delay)
            output_path = out_dir / f"{kind}_summary.png"
            capture_png(base, session_id, output_path)
            print(f"screenshot={output_path}")
    finally:
        if session_id:
            delete_session(base, session_id)
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        if "Allow remote automation" in body:
            raise SystemExit(
                "Safari WebDriver is blocked. Enable Safari > Settings > Advanced > Show features for web developers, "
                "then turn on Develop > Allow Remote Automation, and run the screenshot script again."
            )
        raise SystemExit(f"HTTPError {exc.code}: {body}")
