#!/usr/bin/env python3
import argparse
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OBSIDIAN_ROOT = ROOT.parent / "obsidian"
DEFAULT_SITE_ROOT = ROOT.parent / "regeorge.github.io"
DEFAULT_OBSIDIAN_SUBDIR = Path("生活") / "小满成长记录"
DEFAULT_SITE_SUBDIR = Path("projects") / "xiaoman-growth-journal"


SITE_INDEX_HTML = """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>小满成长记录</title>
  <style>
    :root {
      --bg: #f5efe4;
      --paper: rgba(255, 251, 245, 0.9);
      --ink: #2f241d;
      --muted: #7d6758;
      --accent: #a84f2d;
      --accent-soft: #e8c4a4;
      --line: rgba(120, 90, 64, 0.16);
      --shadow: 0 24px 60px rgba(77, 48, 29, 0.12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "STKaiti", "KaiTi", "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top, rgba(255,255,255,0.6), transparent 38%),
        linear-gradient(180deg, #f7f1e8 0%, #efe1cf 100%);
      min-height: 100vh;
    }
    main {
      width: min(1120px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 32px 0 56px;
    }
    .hero, .panel, .timeline-card, .shot-card {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 24px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(8px);
    }
    .hero {
      padding: 28px;
      margin-bottom: 20px;
      background-image: linear-gradient(135deg, rgba(255,255,255,0.75), rgba(232,196,164,0.35));
    }
    .eyebrow {
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--muted);
      font-size: 12px;
    }
    h1 {
      margin: 10px 0 12px;
      font-size: clamp(34px, 6vw, 58px);
      line-height: 1.02;
      font-weight: 700;
    }
    .hero p {
      margin: 0;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.7;
      max-width: 720px;
    }
    .tabs {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin: 0 0 20px;
    }
    button.tab {
      appearance: none;
      border: none;
      border-radius: 999px;
      padding: 10px 16px;
      cursor: pointer;
      background: rgba(255,255,255,0.76);
      color: var(--muted);
      font: inherit;
      transition: transform 180ms ease, background 180ms ease, color 180ms ease;
    }
    button.tab.active {
      background: var(--accent);
      color: #fff9f2;
      transform: translateY(-1px);
    }
    .grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;
    }
    .panel {
      padding: 22px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }
    .stat {
      padding: 14px;
      border-radius: 18px;
      background: rgba(255,255,255,0.72);
      border: 1px solid rgba(168, 79, 45, 0.12);
    }
    .stat-label {
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 28px;
      line-height: 1;
    }
    .section-title {
      margin: 0 0 14px;
      font-size: 24px;
    }
    .highlight-list, .timeline-list {
      display: grid;
      gap: 12px;
    }
    .timeline-card, .shot-card {
      overflow: hidden;
    }
    .highlight-item, .timeline-card {
      padding: 16px 18px;
    }
    .highlight-item {
      border-radius: 18px;
      background: rgba(255,255,255,0.72);
      border: 1px solid rgba(168, 79, 45, 0.12);
    }
    .item-top, .timeline-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: baseline;
    }
    .item-amount, .timeline-total {
      color: var(--accent);
      white-space: nowrap;
    }
    .item-meta, .timeline-meta {
      margin-top: 6px;
      color: var(--muted);
      font-size: 14px;
    }
    .timeline-body {
      margin-top: 10px;
      color: var(--muted);
      line-height: 1.7;
    }
    .shot-card img {
      display: block;
      width: 100%;
      height: auto;
      background: #fff;
    }
    .shot-caption {
      padding: 14px 16px 16px;
      color: var(--muted);
      line-height: 1.6;
    }
    .footer-links {
      margin-top: 18px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .footer-links a {
      color: var(--accent);
      text-decoration: none;
    }
    .empty {
      color: var(--muted);
      padding: 18px 0;
    }
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 520px) {
      main { width: min(100vw - 20px, 1120px); padding-top: 20px; }
      .hero, .panel { padding: 18px; }
      .stats { grid-template-columns: 1fr 1fr; }
      .stat-value { font-size: 22px; }
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="eyebrow">XiaoMan Growth Journal</div>
      <h1 id="title">小满成长记录</h1>
      <p id="summary">正在加载最新的日报、周报和月报数据。</p>
      <div class="stats">
        <div class="stat"><div class="stat-label">时间范围</div><div class="stat-value" id="label">-</div></div>
        <div class="stat"><div class="stat-label">记录数</div><div class="stat-value" id="count">0</div></div>
        <div class="stat"><div class="stat-label">磁贴</div><div class="stat-value" id="magnets">0</div></div>
        <div class="stat"><div class="stat-label">活跃天数</div><div class="stat-value" id="days">0</div></div>
      </div>
    </section>

    <div class="tabs">
      <button class="tab active" data-kind="daily">日报</button>
      <button class="tab" data-kind="weekly">周报</button>
      <button class="tab" data-kind="monthly">月报</button>
    </div>

    <section class="grid">
      <div class="panel">
        <h2 class="section-title">亮点</h2>
        <div id="highlights" class="highlight-list"></div>
        <h2 class="section-title" style="margin-top: 24px;">时间线</h2>
        <div id="timeline" class="timeline-list"></div>
      </div>

      <div class="panel">
        <h2 class="section-title">报告截图</h2>
        <div class="shot-card">
          <img id="screenshot" alt="报告截图">
          <div class="shot-caption" id="shot-caption">截图会随 nightly 刷新同步到这个页面。</div>
        </div>
        <div class="footer-links">
          <a id="json-link" href="#">查看 JSON</a>
          <a id="markdown-link" href="#">查看 Markdown</a>
          <a id="message-link" href="#">查看摘要</a>
        </div>
      </div>
    </section>
  </main>

  <script>
    const tabs = Array.from(document.querySelectorAll(".tab"));
    const refs = {
      title: document.getElementById("title"),
      summary: document.getElementById("summary"),
      label: document.getElementById("label"),
      count: document.getElementById("count"),
      magnets: document.getElementById("magnets"),
      days: document.getElementById("days"),
      highlights: document.getElementById("highlights"),
      timeline: document.getElementById("timeline"),
      screenshot: document.getElementById("screenshot"),
      shotCaption: document.getElementById("shot-caption"),
      jsonLink: document.getElementById("json-link"),
      markdownLink: document.getElementById("markdown-link"),
      messageLink: document.getElementById("message-link"),
    };

    function setActive(kind) {
      for (const tab of tabs) {
        tab.classList.toggle("active", tab.dataset.kind === kind);
      }
    }

    function renderHighlights(items) {
      if (!items.length) {
        refs.highlights.innerHTML = '<div class="empty">这个周期还没有亮点记录。</div>';
        return;
      }
      refs.highlights.innerHTML = items.map((item) => `
        <article class="highlight-item">
          <div class="item-top">
            <strong>${item.description || "未命名记录"}</strong>
            <span class="item-amount">+${item.amount || 0}</span>
          </div>
          <div class="item-meta">${item.type || "record"} · ${item.source || "unknown"}</div>
        </article>
      `).join("");
    }

    function renderTimeline(items) {
      if (!items.length) {
        refs.timeline.innerHTML = '<div class="empty">这个周期还没有时间线内容。</div>';
        return;
      }
      refs.timeline.innerHTML = items.map((item) => `
        <article class="timeline-card">
          <div class="timeline-top">
            <strong>${item.date}</strong>
            <span class="timeline-total">+${item.magnet_total || 0}</span>
          </div>
          <div class="timeline-meta">${item.count || 0} 条记录</div>
          <div class="timeline-body">${(item.items || []).slice(0, 4).map((entry) => entry.description).join(" / ") || "暂无详情"}</div>
        </article>
      `).join("");
    }

    async function loadKind(kind) {
      setActive(kind);
      const jsonPath = `data/${kind}_summary.json`;
      const mdPath = `data/${kind}_summary.md`;
      const messagePath = `data/${kind}_message.txt`;
      const screenshotPath = `screenshots/${kind}_summary.png`;
      const response = await fetch(jsonPath, { cache: "no-store" });
      if (!response.ok) throw new Error(`failed to load ${jsonPath}`);
      const payload = await response.json();

      refs.title.textContent = payload.title || "小满成长记录";
      refs.summary.textContent = payload.summary || "暂无摘要。";
      refs.label.textContent = payload.label || "-";
      refs.count.textContent = String(payload.stats?.count ?? 0);
      refs.magnets.textContent = String(payload.stats?.magnet_total ?? 0);
      refs.days.textContent = String(payload.stats?.active_days ?? 0);
      refs.shotCaption.textContent = payload.hero_tagline || "截图会随 nightly 刷新同步到这个页面。";
      refs.screenshot.src = screenshotPath;
      refs.jsonLink.href = jsonPath;
      refs.markdownLink.href = mdPath;
      refs.messageLink.href = messagePath;
      renderHighlights(payload.highlights || []);
      renderTimeline(payload.timeline || []);
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        loadKind(tab.dataset.kind).catch((error) => {
          refs.summary.textContent = String(error);
        });
      });
    });

    loadKind("daily").catch((error) => {
      refs.summary.textContent = String(error);
    });
  </script>
</body>
</html>
"""


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


def write_text(path: Path, content: str) -> None:
    ensure_dir(path.parent)
    path.write_text(content, encoding="utf-8")


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

    write_text(target_dir / "index.html", SITE_INDEX_HTML)
    published.append(str(target_dir / "index.html"))

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
