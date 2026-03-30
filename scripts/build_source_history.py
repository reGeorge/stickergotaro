#!/usr/bin/env python3
import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a single source markdown file from historical notes and raw XiaoAi captures."
    )
    parser.add_argument("--history-input", default="docs/historyInfo.md")
    parser.add_argument("--raw-dir", default="data/raw")
    parser.add_argument("--output", default="data/source_history.md")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    history_path = Path(args.history_input)
    raw_dir = Path(args.raw_dir)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    sections: list[str] = ["# Source History", ""]

    if history_path.exists():
      sections.extend(
          [
              "## Historical Notes",
              "",
              history_path.read_text(encoding="utf-8").strip(),
              "",
          ]
      )

    sections.extend(["## XiaoAi Raw Captures", ""])
    for path in sorted(raw_dir.glob("*.md")):
        content = path.read_text(encoding="utf-8").strip()
        if not content:
            continue
        sections.extend(
            [
                f"### {path.name}",
                "",
                content,
                "",
            ]
        )

    output_path.write_text("\n".join(sections).rstrip() + "\n", encoding="utf-8")
    print(f"output={output_path}")


if __name__ == "__main__":
    main()
