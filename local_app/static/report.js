async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return res.json();
}

function byId(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = byId(id);
  if (el) el.textContent = value;
}

function setHtml(id, value) {
  const el = byId(id);
  if (el) el.innerHTML = value;
}

function detectKind() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[1] || "daily";
}

function formatTime(ts) {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function activateNav(kind) {
  const ids = {
    daily: "navDaily",
    weekly: "navWeekly",
    monthly: "navMonthly",
  };
  Object.values(ids).forEach((id) => byId(id)?.classList.remove("active"));
  byId(ids[kind])?.classList.add("active");
}

function renderHighlights(items) {
  setText("highlightCount", String(items.length));
  setHtml("highlightList", items.length
    ? items.map(item => `
      <div class="item highlight">
        <div class="item-title">${item.description}</div>
        <div class="item-sub">+${item.amount} · ${item.type}</div>
      </div>
    `).join("")
    : `<div class="item"><div class="item-title">暂无亮点记录</div></div>`);
}

function renderTimeline(groups) {
  const totalItems = groups.reduce((sum, group) => sum + (group.items?.length || 0), 0);
  setText("itemCount", String(totalItems));
  setHtml("timelineList", groups.length
    ? groups.map(group => `
      <section class="timeline-group">
        <div class="timeline-head">
          <div>
            <div class="timeline-date">${group.date}</div>
            <div class="timeline-sub">${group.count} 条记录 · ${group.magnet_total} 个磁贴</div>
          </div>
        </div>
        <div class="list compact-list">
          ${(group.items || []).map(item => `
            <div class="item compact">
              <div class="item-time">${formatTime(item.timestamp)}</div>
              <div class="item-title">${item.description}</div>
              <div class="item-sub">+${item.amount} · ${item.type}</div>
            </div>
          `).join("")}
        </div>
      </section>
    `).join("")
    : `<div class="item"><div class="item-title">当前周期暂无时间线记录</div></div>`);
}

async function loadReport() {
  const kind = detectKind();
  const report = await fetchJson(`/api/reports/${kind}`);
  activateNav(kind);
  setText("reportTitle", report.title || "小满报告");
  setText("reportTagline", report.hero_tagline || "");
  setText("reportSummary", report.summary || "");
  setText("reportLabel", report.label || "");
  setText("reportCount", `记录 ${report.stats?.count ?? 0}`);
  setText("reportMagnetTotal", `磁贴 ${report.stats?.magnet_total ?? 0}`);
  renderHighlights(report.highlights || []);
  renderTimeline(report.timeline || []);
}

loadReport().catch((err) => {
  setText("reportTitle", "报告加载失败");
  setText("reportSummary", String(err));
});
