#!/usr/bin/env python3
import argparse
import asyncio
import json
import os
from pathlib import Path

import yaml
from aiohttp import ClientTimeout
from xiaogpt.config import Config, LATEST_ASK_API
from xiaogpt.xiaogpt import MiGPT


ROOT = Path(__file__).resolve().parent.parent


def default_config_path() -> Path:
    candidates = [
        Path(
            os.environ.get(
                "XIAOGPT_CONFIG_PATH",
                ROOT / "runtime" / "xiaogpt" / "config.yaml",
            )
        ),
        Path.home() / ".xiaogpt" / "config.yaml",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check whether the local xiaogpt environment can read recent XiaoAi conversations."
    )
    parser.add_argument(
        "--config-path",
        default=str(default_config_path()),
        help="Path to the xiaogpt YAML config. Defaults to runtime/xiaogpt/config.yaml, then ~/.xiaogpt/config.yaml.",
    )
    parser.add_argument(
        "--hardware",
        default="L05B",
        help="Target XiaoAi hardware code, e.g. L05B.",
    )
    parser.add_argument(
        "--mi-did",
        default="2116704058",
        help="Target XiaoAi mi_did.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=2,
        help="How many recent records to print.",
    )
    parser.add_argument(
        "--verbose-json",
        action="store_true",
        help="Print the full raw records JSON.",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    cfg = yaml.safe_load(Path(args.config_path).read_text())
    config = Config(
        account=cfg["account"],
        password=cfg["password"],
        hardware=args.hardware,
        mi_did=args.mi_did,
        # Use a bot type that does not require an LLM API key.
        bot="glm",
    )

    miboy = MiGPT(config)
    try:
        await miboy.init_all_data()
        url = LATEST_ASK_API.format(hardware=config.hardware, timestamp="0")
        async with miboy.mi_session.get(url, timeout=ClientTimeout(total=15)) as r:
            data = await r.json()
        payload = json.loads(data.get("data", "{}"))
        records = payload.get("records", [])[: args.limit]

        print(f"hardware={config.hardware}")
        print(f"mi_did={config.mi_did}")
        print(f"device_id={miboy.device_id}")
        print(f"records={len(records)}")
        for idx, record in enumerate(records, start=1):
            answers = record.get("answers", [])
            answer_text = ""
            if answers:
                answer_text = answers[0].get("tts", {}).get("text", "")
            print(f"[{idx}] time={record.get('time')}")
            print(f"[{idx}] query={record.get('query', '')}")
            print(f"[{idx}] answer={answer_text}")

        if args.verbose_json:
            print(json.dumps(records, ensure_ascii=False, indent=2))
    finally:
        await miboy.close()


if __name__ == "__main__":
    asyncio.run(main())
