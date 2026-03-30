async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return res.json();
}

function renderStats(summary) {
  const stats = [
    ["原始记录", summary.raw_count],
    ["提取结果", summary.extracted_count],
    ["Miniapp 日志", summary.miniapp_log_count],
  ];
  document.getElementById("stats").innerHTML = stats
    .map(
      ([label, value]) => `
        <div class="stat">
          <div class="stat-value">${value}</div>
          <div class="stat-label">${label}</div>
        </div>
      `
    )
    .join("");
}

function renderRaw(items) {
  document.getElementById("rawCount").textContent = String(items.length);
  document.getElementById("rawList").innerHTML = items
    .slice(0, 12)
    .map(
      (item) => `
        <div class="item">
          <div class="item-time">${item.happened_at}</div>
          <div class="item-title">${item.query || "(空)"}</div>
          <div class="item-sub">${item.answer_source || ""} · ${item.mode || ""}</div>
        </div>
      `
    )
    .join("");
}

function renderExtracted(items) {
  document.getElementById("extractedCount").textContent = String(items.length);
  document.getElementById("extractedList").innerHTML = items
    .slice(0, 12)
    .map(
      (item) => `
        <div class="item">
          <div class="item-time">${item.happened_at}</div>
          <div class="item-title">${item.aligned_description || ""}</div>
          <div class="item-sub">${item.aligned_log_type || ""} · ${item.aligned_amount ?? ""}</div>
        </div>
      `
    )
    .join("");
}

function renderMiniappLogs(items) {
  document.getElementById("miniappCount").textContent = String(items.length);
  document.getElementById("miniappPreview").textContent = JSON.stringify(items.slice(0, 10), null, 2);
}

async function refresh() {
  const [summary, raw, extracted, miniappLogs] = await Promise.all([
    fetchJson("/api/summary"),
    fetchJson("/api/raw?limit=50"),
    fetchJson("/api/extracted"),
    fetchJson("/api/miniapp-logs"),
  ]);
  renderStats(summary);
  renderRaw(raw);
  renderExtracted(extracted);
  renderMiniappLogs(miniappLogs);
}

document.getElementById("refreshButton").addEventListener("click", refresh);
refresh().catch((err) => {
  document.getElementById("miniappPreview").textContent = String(err);
});
