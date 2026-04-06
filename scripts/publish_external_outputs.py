#!/usr/bin/env python3
import argparse
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OBSIDIAN_ROOT = ROOT.parent / "obsidian"
DEFAULT_SITE_ROOT = ROOT.parent / "regeorge.github.io"
DEFAULT_OBSIDIAN_SUBDIR = Path("生活") / "小满成长记录"
DEFAULT_SITE_SUBDIR = Path("projects") / "xiaoman-growth-journal"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Publish cleaned XiaoMan data to obsidian and report assets to regeorge.github.io."
    )
    parser.add_argument("--obsidian-root", default=str(DEFAULT_OBSIDIAN_ROOT))
    parser.add_argument("--obsidian-subdir", default=str(DEFAULT_OBSIDIAN_SUBDIR))
    parser.add_argument("--site-root", default=str(DEFAULT_SITE_ROOT))
    parser.add_argument("--site-subdir", default=str(DEFAULT_SITE_SUBDIR))
    return parser.parse_args()


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def copy_file(src: Path, dest: Path) -> bool:
    if not src.exists():
        return False
    ensure_dir(dest.parent)
    shutil.copy2(src, dest)
    return True


def publish_obsidian(obsidian_root: Path, subdir: Path) -> list[str]:
    target_dir = ensure_dir(obsidian_root / subdir)
    copied: list[str] = []
    mapping = {
        ROOT / "data" / "source_history.md": target_dir / "source_history.md",
        ROOT / "data" / "extracted" / "xiaoman_records.md": target_dir / "xiaoman_records.md",
        ROOT / "data" / "extracted" / "xiaoman_records.ndjson": target_dir / "xiaoman_records.ndjson",
        ROOT / "data" / "moments_logs.json": target_dir / "moments_logs.json",
        ROOT / "data" / "reports" / "daily_summary.md": target_dir / "daily_summary.md",
        ROOT / "data" / "reports" / "weekly_summary.md": target_dir / "weekly_summary.md",
        ROOT / "data" / "reports" / "monthly_summary.md": target_dir / "monthly_summary.md",
        ROOT / "data" / "reports" / "daily_message.txt": target_dir / "daily_message.txt",
        ROOT / "data" / "reports" / "weekly_message.txt": target_dir / "weekly_message.txt",
        ROOT / "data" / "reports" / "monthly_message.txt": target_dir / "monthly_message.txt",
    }
    for src, dest in mapping.items():
        if copy_file(src, dest):
            copied.append(str(dest))
    return copied


def publish_site(site_root: Path, subdir: Path) -> list[str]:
    target_dir = ensure_dir(site_root / subdir)
    data_dir = ensure_dir(target_dir / "data")
    screenshots_dir = ensure_dir(target_dir / "screenshots")
    published: list[str] = []

    for kind in ("daily", "weekly", "monthly"):
        for suffix in ("summary.json", "summary.md", "message.txt"):
            src = ROOT / "data" / "reports" / f"{kind}_{suffix}"
            dest = data_dir / f"{kind}_{suffix}"
            if copy_file(src, dest):
                published.append(str(dest))
        screenshot_src = ROOT / "data" / "screenshots" / f"{kind}_summary.png"
        screenshot_dest = screenshots_dir / f"{kind}_summary.png"
        if copy_file(screenshot_src, screenshot_dest):
            published.append(str(screenshot_dest))
    return published


def main() -> None:
    args = parse_args()
    obsidian_targets = publish_obsidian(Path(args.obsidian_root), Path(args.obsidian_subdir))
    site_targets = publish_site(Path(args.site_root), Path(args.site_subdir))
    print(f"obsidian_published={len(obsidian_targets)}")
    for target in obsidian_targets:
        print(f"obsidian_target={target}")
    print(f"site_published={len(site_targets)}")
    for target in site_targets:
        print(f"site_target={target}")


if __name__ == "__main__":
    main()
