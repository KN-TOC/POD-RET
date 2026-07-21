const state = {
  rows: [],
  normalized: [],
  filters: {
    hub: "All",
    region: "All",
    month: "All",
    sub: "All"
  }
};

const statusColors = {
  onTime: "#08c792",
  notOnTime: "#0099da",
  pending: "#003369",
  cancel: "#ed2939",
  plan: "#003369",
  actual: "#08c792"
};

const columnAliases = {
  deliveryStatus: ["Adjust Delivery Status", "Delivery Status", "Type Delivered", "Delivered"],
  podStatus: ["Adjust POD Status", "POD Status", "POD Return Status", "POD"],
  sub: ["Sub", "Sub-Contractor", "Sub Contractor", "Transporter", "Vendor", "3PL"],
  hub: ["Hub", "Zone"],
  region: ["Region"],
  month: ["Month"],
  order: ["Externorderkey", "Order No", "Order", "DO", "Shipment No"],
  loadingDate: ["Loading date", "Loading Date", "Load Date", "Loading"],
  planPod: ["Plan POD Return", "Plan POD", "POD Plan", "Planned POD Return"],
  actualPod: ["Actual POD Return", "Actual POD", "POD Return", "Actual Return"],
  deliveryDate: ["Delivery Date", "Actual Delivered", "Actual Delivery Time"]
};

const columnLetterFallbacks = {
  loadingDate: "M",
  planPod: "AF",
  actualPod: "AG"
};

const elements = {
  fileInput: document.getElementById("fileInput"),
  fileStatus: document.getElementById("fileStatus"),
  rowStatus: document.getElementById("rowStatus"),
  hubFilter: document.getElementById("hubFilter"),
  regionFilter: document.getElementById("regionFilter"),
  monthFilter: document.getElementById("monthFilter"),
  subFilter: document.getElementById("subFilter"),
  resetFilters: document.getElementById("resetFilters"),
  totalDeliveries: document.getElementById("totalDeliveries"),
  onTime: document.getElementById("onTime"),
  notOnTime: document.getElementById("notOnTime"),
  pendingPod: document.getElementById("pendingPod"),
  cancelCount: document.getElementById("cancelCount"),
  totalContext: document.getElementById("totalContext"),
  onTimeRate: document.getElementById("onTimeRate"),
  lateRate: document.getElementById("lateRate"),
  pendingRate: document.getElementById("pendingRate"),
  cancelRate: document.getElementById("cancelRate"),
  statusDonut: document.getElementById("statusDonut"),
  statusLegend: document.getElementById("statusLegend"),
  dailyChart: document.getElementById("dailyChart"),
  subBars: document.getElementById("subBars"),
  pendingTable: document.getElementById("pendingTable")
};

elements.fileInput.addEventListener("change", handleFileUpload);
elements.resetFilters.addEventListener("click", () => {
  state.filters = { hub: "All", region: "All", month: "All", sub: "All" };
  updateFilters();
  renderDashboard();
});

["hub", "region", "month", "sub"].forEach((key) => {
  elements[`${key}Filter`].addEventListener("change", (event) => {
    state.filters[key] = event.target.value;
    renderDashboard();
  });
});

renderDashboard();

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    try {
      const extension = file.name.split(".").pop().toLowerCase();
      const rows = extension === "csv"
        ? parseCsv(loadEvent.target.result)
        : parseWorkbook(loadEvent.target.result);

      state.rows = rows;
      state.normalized = rows.map(normalizeRow).filter(Boolean);
      state.filters = { hub: "All", region: "All", month: "All", sub: "All" };

      elements.fileStatus.textContent = `Loaded: ${file.name}`;
      updateFilters();
      renderDashboard();
    } catch (error) {
      elements.fileStatus.textContent = "Unable to read this file. Please check the file format.";
      console.error(error);
    }
  };

  if (file.name.toLowerCase().endsWith(".csv")) {
    reader.readAsText(file, "utf-8");
  } else {
    reader.readAsArrayBuffer(file);
  }
}

function parseWorkbook(arrayBuffer) {
  if (!window.XLSX) {
    throw new Error("XLSX library is not ready");
  }

  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
  const headers = sheetRows[0] || [];

  return sheetRows.slice(1).map((cells) => {
    const row = headers.reduce((result, header, index) => {
      const key = String(header || `Column ${index + 1}`).trim();
      result[key] = cells[index] ?? "";
      return result;
    }, {});

    row.__cells = {
      M: cells[12] ?? "",
      AF: cells[31] ?? "",
      AG: cells[32] ?? ""
    };
    return row;
  });
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function normalizeRow(row) {
  if (!row || Object.values(row).every((value) => String(value ?? "").trim() === "")) return null;

  const normalized = {
    deliveryStatus: getColumn(row, "deliveryStatus"),
    podStatus: getColumn(row, "podStatus"),
    sub: getColumn(row, "sub") || "Unassigned",
    hub: getColumn(row, "hub") || "Unassigned",
    region: getColumn(row, "region") || "Unassigned",
    month: getColumn(row, "month") || deriveMonth(row),
    order: getColumn(row, "order") || "-",
    loadingDate: getColumn(row, "loadingDate"),
    planPod: getColumn(row, "planPod"),
    actualPod: getColumn(row, "actualPod"),
    deliveryDate: getColumn(row, "deliveryDate"),
    raw: row
  };

  normalized.loadingDateValue = parseDate(normalized.loadingDate);
  normalized.planPodDate = parseDate(normalized.planPod);
  normalized.actualPodDate = parseDate(normalized.actualPod);
  normalized.deliveryDateValue = parseDate(normalized.deliveryDate);
  normalized.bucket = classifyRow(normalized);
  return normalized;
}

function getColumn(row, aliasKey) {
  const compactMap = Object.keys(row).reduce((map, key) => {
    if (key === "__cells") return map;
    map[compactName(key)] = row[key];
    return map;
  }, {});

  for (const alias of columnAliases[aliasKey]) {
    const value = compactMap[compactName(alias)];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }

  const fallbackLetter = columnLetterFallbacks[aliasKey];
  if (fallbackLetter && row.__cells) {
    const value = row.__cells[fallbackLetter];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }

  return "";
}

function compactName(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function classifyRow(row) {
  const delivery = compactStatus(row.deliveryStatus);
  const pod = compactStatus(row.podStatus);

  if (delivery.includes("cancel")) return "cancel";
  if (pod.includes("pending") || (!row.actualPod && !pod.includes("ontime") && !pod.includes("notontime"))) return "pending";
  if (pod.includes("notontime") || pod.includes("late") || pod.includes("delay") || pod.includes("overdue")) return "notOnTime";
  if (pod.includes("ontime")) return "onTime";

  if (!row.actualPodDate) return "pending";
  if (row.planPodDate && row.actualPodDate > endOfDay(row.planPodDate)) return "notOnTime";
  return "onTime";
}

function compactStatus(value) {
  return String(value ?? "").replace(/[\s_-]+/g, "").trim().toLowerCase();
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "number") {
    if (value > 20000101 && value < 20991231) {
      const text = String(value);
      return new Date(Number(text.slice(0, 4)), Number(text.slice(4, 6)) - 1, Number(text.slice(6, 8)));
    }

    return parseExcelSerialDate(value);
  }

  const cleaned = String(value).trim();
  if (!cleaned) return null;

  const isoMatch = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const dayFirstMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dayFirstMatch) {
    return new Date(Number(dayFirstMatch[3]), Number(dayFirstMatch[2]) - 1, Number(dayFirstMatch[1]));
  }

  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function parseExcelSerialDate(value) {
  if (window.XLSX?.SSF?.parse_date_code) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }

  const excelEpoch = Date.UTC(1899, 11, 30);
  const utcDate = new Date(excelEpoch + Math.floor(value) * 86400000);
  return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function deriveMonth(row) {
  const date = parseDate(getColumn(row, "loadingDate"))
    || parseDate(getColumn(row, "deliveryDate"))
    || parseDate(getColumn(row, "planPod"));
  return date ? date.toLocaleString("en-US", { month: "short" }) : "Unassigned";
}

function updateFilters() {
  fillSelect(elements.hubFilter, state.normalized.map((row) => row.hub), state.filters.hub);
  fillSelect(elements.regionFilter, state.normalized.map((row) => row.region), state.filters.region);
  fillSelect(elements.monthFilter, state.normalized.map((row) => row.month), state.filters.month);
  fillSelect(elements.subFilter, state.normalized.map((row) => row.sub), state.filters.sub);
}

function fillSelect(select, values, selected) {
  const unique = ["All", ...Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)))];
  select.innerHTML = unique.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  select.value = unique.includes(selected) ? selected : "All";
}

function renderDashboard() {
  const rows = getFilteredRows();
  const summary = summarize(rows);

  elements.totalDeliveries.textContent = formatNumber(summary.total);
  elements.onTime.textContent = formatNumber(summary.onTime);
  elements.notOnTime.textContent = formatNumber(summary.notOnTime);
  elements.pendingPod.textContent = formatNumber(summary.pending);
  elements.cancelCount.textContent = formatNumber(summary.cancel);
  elements.totalContext.textContent = `${formatNumber(summary.active)} active deliveries`;
  elements.onTimeRate.textContent = `${formatPercent(summary.onTime, summary.active)} of active`;
  elements.lateRate.textContent = `${formatPercent(summary.notOnTime, summary.active)} of active`;
  elements.pendingRate.textContent = `${formatPercent(summary.pending, summary.active)} of active`;
  elements.cancelRate.textContent = `${formatPercent(summary.cancel, summary.total)} of total`;
  elements.rowStatus.textContent = state.normalized.length ? `${formatNumber(rows.length)} of ${formatNumber(state.normalized.length)} rows shown` : "";

  renderDonut(summary);
  renderDailyChart(rows);
  renderSubBars(rows);
  renderDueTodayTable(rows);
}

function getFilteredRows() {
  return state.normalized.filter((row) => {
    return (state.filters.hub === "All" || row.hub === state.filters.hub)
      && (state.filters.region === "All" || row.region === state.filters.region)
      && (state.filters.month === "All" || row.month === state.filters.month)
      && (state.filters.sub === "All" || row.sub === state.filters.sub);
  });
}

function summarize(rows) {
  const summary = { total: rows.length, active: 0, onTime: 0, notOnTime: 0, pending: 0, cancel: 0 };
  rows.forEach((row) => {
    summary[row.bucket] = (summary[row.bucket] ?? 0) + 1;
    if (row.bucket !== "cancel") summary.active += 1;
  });
  return summary;
}

function renderDonut(summary) {
  const values = [
    ["On-Time", summary.onTime, statusColors.onTime],
    ["Not On-Time", summary.notOnTime, statusColors.notOnTime],
    ["Pending POD", summary.pending, statusColors.pending],
    ["Cancel", summary.cancel, statusColors.cancel]
  ];
  const total = Math.max(summary.total, 1);
  let start = 0;
  const gradient = values.map(([, count, color]) => {
    const end = start + (count / total) * 100;
    const segment = `${color} ${start}% ${end}%`;
    start = end;
    return segment;
  }).join(", ");

  elements.statusDonut.style.background = summary.total ? `conic-gradient(${gradient})` : "conic-gradient(var(--surface-2) 0 100%)";
  elements.statusLegend.innerHTML = values.map(([label, count, color]) => `
    <div class="legend-item">
      <span class="swatch" style="background:${color}"></span>
      <span>${label}</span>
      <strong>${formatNumber(count)} (${formatPercent(count, summary.total)})</strong>
    </div>
  `).join("");
}

function renderDailyChart(rows) {
  const points = buildDailyPlanActual(rows);
  if (!points.length) {
    elements.dailyChart.innerHTML = `<div class="empty">No Loading date records available for the selected data.</div>`;
    return;
  }

  const width = 680;
  const height = 300;
  const margin = { top: 24, right: 24, bottom: 54, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...points.map((point) => Math.max(point.plan, point.actual)), 1);
  const xStep = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
  const yScale = (value) => margin.top + plotHeight - (value / maxValue) * plotHeight;
  const xScale = (index) => margin.left + (points.length > 1 ? index * xStep : plotWidth / 2);
  const planPath = linePath(points, (point) => point.plan, xScale, yScale);
  const actualPath = linePath(points, (point) => point.actual, xScale, yScale);
  const yTicks = makeTicks(maxValue, 4);
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  elements.dailyChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="line-chart" role="img" aria-labelledby="dailyChartTitle dailyChartDesc">
      <title id="dailyChartTitle">Daily POD return plan versus actual</title>
      <desc id="dailyChartDesc">Line chart grouped by Loading date comparing planned POD return count and actual POD return count.</desc>
      <g class="chart-grid">
        ${yTicks.map((tick) => {
          const y = yScale(tick);
          return `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"></line><text x="${margin.left - 10}" y="${y + 4}" text-anchor="end">${tick}</text>`;
        }).join("")}
      </g>
      <g class="chart-axis">
        <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${width - margin.right}" y2="${margin.top + plotHeight}"></line>
        ${points.map((point, index) => {
          if (index % labelEvery !== 0 && index !== points.length - 1) return "";
          const x = xScale(index);
          return `<text x="${x}" y="${height - 24}" text-anchor="middle">${escapeHtml(point.label)}</text>`;
        }).join("")}
      </g>
      <path class="plan-line" d="${planPath}"></path>
      <path class="actual-line" d="${actualPath}"></path>
      ${points.map((point, index) => {
        const x = xScale(index);
        return `
          <circle class="plan-dot" cx="${x}" cy="${yScale(point.plan)}" r="4">
            <title>${escapeHtml(point.label)} - Plan: ${point.plan}</title>
          </circle>
          <circle class="actual-dot" cx="${x}" cy="${yScale(point.actual)}" r="4">
            <title>${escapeHtml(point.label)} - Actual: ${point.actual}</title>
          </circle>
        `;
      }).join("")}
      <g class="chart-legend">
        <line class="plan-line" x1="${margin.left}" y1="14" x2="${margin.left + 22}" y2="14"></line>
        <text x="${margin.left + 28}" y="18">Plan POD Return</text>
        <line class="actual-line" x1="${margin.left + 178}" y1="14" x2="${margin.left + 200}" y2="14"></line>
        <text x="${margin.left + 206}" y="18">Actual POD Return</text>
      </g>
    </svg>
  `;
}

function buildDailyPlanActual(rows) {
  const map = new Map();
  rows.forEach((row) => {
    if (!row.loadingDateValue) return;

    const key = dateKey(row.loadingDateValue);
    if (!map.has(key)) {
      map.set(key, { date: stripTime(row.loadingDateValue), plan: 0, actual: 0 });
    }

    const point = map.get(key);
    if (row.planPodDate) point.plan += 1;
    if (row.actualPodDate) point.actual += 1;
  });

  return Array.from(map.values())
    .sort((a, b) => a.date - b.date)
    .map((point) => ({
      ...point,
      label: formatShortDate(point.date)
    }));
}

function linePath(points, getValue, xScale, yScale) {
  return points.map((point, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${xScale(index).toFixed(1)},${yScale(getValue(point)).toFixed(1)}`;
  }).join(" ");
}

function makeTicks(maxValue, count) {
  const step = Math.max(1, Math.ceil(maxValue / count));
  const ticks = [];
  for (let value = 0; value <= maxValue + step; value += step) {
    ticks.push(value);
    if (ticks.length > count + 2) break;
  }
  return ticks;
}

function renderSubBars(rows) {
  const groups = topGroups(rows, "sub", 10);
  const maxPending = Math.max(...groups.map((group) => group.pending), 1);

  if (!groups.length || groups.every((group) => group.pending === 0)) {
    elements.subBars.innerHTML = `<div class="empty">No pending POD records found for the selected data.</div>`;
    return;
  }

  elements.subBars.innerHTML = groups.filter((group) => group.pending > 0).map((group) => {
    const width = (group.pending / maxPending) * 100;
    return `
      <div class="bar-row">
        <div class="bar-head">
          <strong>${escapeHtml(group.name)}</strong>
          <span>${formatNumber(group.pending)} pending</span>
        </div>
        <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${width}%"></div></div>
        <div class="bar-meta">${formatPercent(group.pending, group.total)} pending rate from ${formatNumber(group.total)} deliveries</div>
      </div>
    `;
  }).join("");
}

function renderDueTodayTable(rows) {
  const today = startOfToday();
  const dueRows = rows
    .filter((row) => row.planPodDate && !row.actualPodDate && stripTime(row.planPodDate) <= today)
    .sort((a, b) => daysDue(b.planPodDate, today) - daysDue(a.planPodDate, today));

  if (!dueRows.length) {
    elements.pendingTable.innerHTML = `<tr><td class="empty" colspan="8">No open POD records are due by today for the selected data.</td></tr>`;
    return;
  }

  elements.pendingTable.innerHTML = dueRows.map((row) => `
    <tr>
      <td>${escapeHtml(row.sub)}</td>
      <td>${escapeHtml(row.hub)}</td>
      <td>${escapeHtml(row.region)}</td>
      <td>${escapeHtml(row.order)}</td>
      <td>${formatDate(row.loadingDateValue)}</td>
      <td>${formatDate(row.planPodDate)}</td>
      <td>${formatDaysDue(row)}</td>
      <td><span class="pill open">Open</span></td>
    </tr>
  `).join("");
}

function formatDaysDue(row) {
  const days = daysDue(row.planPodDate, startOfToday());
  if (days <= 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

function daysDue(planDate, referenceDate) {
  return Math.max(0, Math.floor((stripTime(referenceDate) - stripTime(planDate)) / 86400000));
}

function topGroups(rows, key, limit) {
  const map = new Map();
  rows.forEach((row) => {
    const name = row[key] || "Unassigned";
    if (!map.has(name)) map.set(name, { name, total: 0, pending: 0 });
    const group = map.get(name);
    group.total += 1;
    if (row.bucket === "pending") group.pending += 1;
  });

  return Array.from(map.values())
    .sort((a, b) => b.pending - a.pending || b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function dateKey(date) {
  const cleanDate = stripTime(date);
  return `${cleanDate.getFullYear()}-${String(cleanDate.getMonth() + 1).padStart(2, "0")}-${String(cleanDate.getDate()).padStart(2, "0")}`;
}

function startOfToday() {
  return stripTime(new Date());
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatPercent(value, total) {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function formatDate(date) {
  if (!date) return "-";
  return `${String(date.getDate()).padStart(2, "0")} ${monthName(date)} ${date.getFullYear()}`;
}

function formatShortDate(date) {
  return `${String(date.getDate()).padStart(2, "0")} ${monthName(date)}`;
}

function monthName(date) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
