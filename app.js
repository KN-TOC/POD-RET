const state = {
  rows: [],
  normalized: [],
  filters: {
    hub: "All",
    region: "All",
    month: "All",
    sub: "All"
  },
  avgReturnDim: "sub",
  trendGranularity: "week"
};

const statusColors = {
  onTime: "#08c792",
  notOnTime: "#0099da",
  pending: "#003369",
  cancel: "#ed2939",
  plan: "#003369",
  actual: "#08c792"
};

const subPalette = ["#003369", "#0099da", "#08c792", "#ed2939", "#f2a900", "#8e44ad", "#62635b", "#16a085", "#c0392b", "#2c3e50"];

const agingBuckets = [
  { label: "0–3 days", min: 0, max: 3 },
  { label: "4–7 days", min: 4, max: 7 },
  { label: "8–14 days", min: 8, max: 14 },
  { label: ">14 days", min: 15, max: Infinity }
];

const agingColors = ["#08c792", "#0099da", "#f2a900", "#ed2939"];

const incomingBuckets = [
  { label: "Due today", min: 0, max: 0 },
  { label: "1–3 days", min: 1, max: 3 },
  { label: "4–7 days", min: 4, max: 7 },
  { label: ">7 days", min: 8, max: Infinity }
];

const incomingColors = ["#003369", "#0099da", "#08c792", "#62635b"];

const provinceSlaTable = {
  "CRC": 5,
  "BANGKOK": 5,
  "SAMUTPRAKAN": 5,
  "NONTHABURI": 5,
  "PATHUMTHANI": 5,
  "KANCHANABURI": 7,
  "LOPBURI": 7,
  "NAKHONPATHOM": 7,
  "PHETCHABURI": 7,
  "PHRANAKHONSIAYUTTHAYA": 7,
  "PRACHUAPKHIRIKHAN": 7,
  "RATCHABURI": 7,
  "SARABURI": 7,
  "SINGBURI": 7,
  "ANGTHONG": 7,
  "CHAINAT": 7,
  "SUPHANBURI": 7,
  "UTHAITHANI": 7,
  "CHACHOENGSAO": 7,
  "CHONBURI": 7,
  "RAYONG": 7,
  "CHANTHABURI": 7,
  "NAKHONNAYOK": 7,
  "PRACHINBURI": 7,
  "SAKAEO": 7,
  "TRAT": 7,
  "SAMUTSAKHON": 7,
  "SAMUTSONGKRAM": 7,
  "CHIANGMAI": 10,
  "CHIANGRAI": 10,
  "LAMPHUN": 10,
  "NAKHONSAWAN": 10,
  "PHAYAO": 10,
  "PHETCHABUN": 10,
  "PHICHIT": 10,
  "PHITSANULOK": 10,
  "PHRAE": 10,
  "UTTARADIT": 10,
  "KAMPHAENGPHET": 10,
  "LAMPANG": 10,
  "MAEHONGSON": 10,
  "NAN": 10,
  "SUKHOTHAI": 10,
  "TAK": 10,
  "BURIRAM": 10,
  "KHONKAEN": 10,
  "MAHASARAKHAM": 10,
  "NAKHONRATCHASIMA": 10,
  "NONGKHAI": 10,
  "ROIET": 10,
  "SAKONNAKHON": 10,
  "SURIN": 10,
  "UBONRATCHATHANI": 10,
  "UDONTHANI": 10,
  "AMNATCHAROEN": 10,
  "BUENGKAN": 10,
  "CHAIYAPHUM": 10,
  "KALASIN": 10,
  "LOEI": 10,
  "MUKDAHAN": 10,
  "NAKHONPHANOM": 10,
  "NONGBUALAMPHU": 10,
  "SISAKET": 10,
  "YASOTHON": 10,
  "CHUMPHON": 10,
  "KRABI": 10,
  "NAKHONSITHAMMARAT": 10,
  "PHUKET": 10,
  "SONGKHLA": 10,
  "SURATTHANI": 10,
  "TRANG": 10,
  "NARATHIVAT": 10,
  "PATTHANEE": 10,
  "PATTANI": 10,
  "PHANGNGA": 10,
  "PHATTHALUNG": 10,
  "RANONG": 10,
  "SATUN": 10,
  "YALA": 10
};

const regionSlaFallback = {
  "BKK": 5,
  "BANGKOK": 5,
  "CENTRAL": 7,
  "EAST": 7,
  "WEST": 7,
  "NORTH": 10,
  "NORTHEAST": 10,
  "ISAN": 10,
  "SOUTH": 10
};

function normalizeLookupKey(value) {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

function getProvinceSla(province, region) {
  const provinceKey = normalizeLookupKey(province);
  if (provinceSlaTable[provinceKey] !== undefined) return provinceSlaTable[provinceKey];
  const regionKey = normalizeLookupKey(region);
  if (regionSlaFallback[regionKey] !== undefined) return regionSlaFallback[regionKey];
  return null;
}

const columnAliases = {
  deliveryStatus: ["Adjust Delivery Status", "Delivery Status", "Type Delivered", "Delivered"],
  podStatus: ["Adjust POD Status", "POD Status", "POD Return Status", "POD"],
  sub: ["Sub", "Sub-Contractor", "Sub Contractor", "Transporter", "Vendor", "3PL"],
  hub: ["Hub", "Zone"],
  region: ["Region"],
  province: ["Province"],
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
  exportButton: document.getElementById("exportButton"),
  totalDeliveries: document.getElementById("totalDeliveries"),
  onTime: document.getElementById("onTime"),
  notOnTime: document.getElementById("notOnTime"),
  pendingPod: document.getElementById("pendingPod"),
  overduePod: document.getElementById("overduePod"),
  overdueContext: document.getElementById("overdueContext"),
  totalContext: document.getElementById("totalContext"),
  onTimeRate: document.getElementById("onTimeRate"),
  lateRate: document.getElementById("lateRate"),
  pendingRate: document.getElementById("pendingRate"),
  statusDonut: document.getElementById("statusDonut"),
  statusLegend: document.getElementById("statusLegend"),
  volumeDonut: document.getElementById("volumeDonut"),
  volumeLegend: document.getElementById("volumeLegend"),
  podSunburst: document.getElementById("podSunburst"),
  earlyDonut: document.getElementById("earlyDonut"),
  earlyLegend: document.getElementById("earlyLegend"),
  earlyLeaderboard: document.getElementById("earlyLeaderboard"),
  dailyChart: document.getElementById("dailyChart"),
  subScatter: document.getElementById("subScatter"),
  subLeaderboard: document.getElementById("subLeaderboard"),
  pendingTable: document.getElementById("pendingTable"),
  agingBars: document.getElementById("agingBars"),
  incomingBars: document.getElementById("incomingBars"),
  avgReturnDim: document.getElementById("avgReturnDim"),
  avgReturnBars: document.getElementById("avgReturnBars"),
  trendGranularity: document.getElementById("trendGranularity"),
  trendChart: document.getElementById("trendChart"),
  scorecardBody: document.getElementById("scorecardBody")
};

elements.fileInput.addEventListener("change", handleFileUpload);
elements.resetFilters.addEventListener("click", () => {
  state.filters = { hub: "All", region: "All", month: "All", sub: "All" };
  updateFilters();
  renderDashboard();
});

elements.exportButton.addEventListener("click", handleExport);

["hub", "region", "month", "sub"].forEach((key) => {
  elements[`${key}Filter`].addEventListener("change", (event) => {
    state.filters[key] = event.target.value;
    renderDashboard();
  });
});

elements.avgReturnDim.addEventListener("change", (event) => {
  state.avgReturnDim = event.target.value;
  renderAvgReturnBars(getFilteredRows());
});

elements.trendGranularity.addEventListener("change", (event) => {
  state.trendGranularity = event.target.value;
  renderTrendChart(getFilteredRows());
});

renderDashboard();

function handleExport() {
  if (typeof XLSX === "undefined") {
    alert("Export library failed to load. Please check your internet connection and try again.");
    return;
  }

  const rows = getFilteredRows();
  if (!rows.length) {
    alert("No data to export for the current filters.");
    return;
  }

  const today = startOfToday();
  const statusLabel = { onTime: "On-Time", notOnTime: "Not On-Time", pending: "Pending", cancel: "Cancel" };

  const header = [
    "Sub", "Hub", "Region", "Province", "Month", "Order",
    "Loading Date", "Plan POD Return", "Actual POD Return", "Delivery Date",
    "Status", "SLA (days)", "Days Overdue"
  ];

  const data = rows.map((row) => {
    const daysOverdue = row.bucket === "pending" && row.planPodDate
      ? Math.max(0, Math.floor((today - stripTime(row.planPodDate)) / 86400000))
      : "";
    return [
      row.sub,
      row.hub,
      row.region,
      row.province,
      row.month,
      row.order,
      formatDate(row.loadingDateValue),
      formatDate(row.planPodDate),
      formatDate(row.actualPodDate),
      formatDate(row.deliveryDateValue),
      statusLabel[row.bucket] || row.bucket,
      row.slaDays ?? "",
      daysOverdue
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
  worksheet["!cols"] = header.map(() => ({ wch: 16 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "POD Export");

  const stamp = dateKey(today);
  XLSX.writeFile(workbook, `POD_Export_${stamp}.xlsx`);
}

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
    province: getColumn(row, "province") || "Unassigned",
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
  normalized.slaDays = getProvinceSla(normalized.province, normalized.region);
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
  elements.overduePod.textContent = formatNumber(summary.overdue);
  elements.totalContext.textContent = `${formatNumber(summary.active)} active deliveries`;
  elements.onTimeRate.textContent = `${formatPercent(summary.onTime, summary.active)} of active`;
  elements.lateRate.textContent = `${formatPercent(summary.notOnTime, summary.active)} of active`;
  elements.pendingRate.textContent = `${formatPercent(summary.pending, summary.active)} of active`;
  elements.overdueContext.textContent = `${formatNumber(summary.dueToday)} due today`;
  elements.rowStatus.textContent = state.normalized.length ? `${formatNumber(rows.length)} of ${formatNumber(state.normalized.length)} rows shown` : "";

  renderDonut(summary);
  renderVolumeShare(rows);
  renderPodSunburst(rows);
  renderDailyChart(rows);
  renderSubPerformance(rows);
  renderReturnTiming(rows);
  renderDueTodayTable(rows);
  renderAgingBars(rows);
  renderIncomingBars(rows);
  renderAvgReturnBars(rows);
  renderTrendChart(rows);
  renderScorecard(rows);
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
  const today = startOfToday();
  const summary = { total: rows.length, active: 0, onTime: 0, notOnTime: 0, pending: 0, cancel: 0, overdue: 0, dueToday: 0 };
  rows.forEach((row) => {
    summary[row.bucket] = (summary[row.bucket] ?? 0) + 1;
    if (row.bucket !== "cancel") summary.active += 1;
    if (row.bucket === "pending" && row.planPodDate) {
      const rawDiff = Math.floor((today - stripTime(row.planPodDate)) / 86400000);
      if (rawDiff > 0) summary.overdue += 1;
      else if (rawDiff === 0) summary.dueToday += 1;
    }
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

function renderVolumeShare(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const name = row.sub || "Unassigned";
    map.set(name, (map.get(name) || 0) + 1);
  });

  const total = rows.length;
  const entries = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], index) => [name, count, subPalette[index % subPalette.length]]);

  if (!total || !entries.length) {
    elements.volumeDonut.style.background = "conic-gradient(var(--surface-2) 0 100%)";
    elements.volumeLegend.innerHTML = `<div class="empty">No sub-contractor volume data for the selected data.</div>`;
    return;
  }

  let start = 0;
  const gradient = entries.map(([, count, color]) => {
    const end = start + (count / total) * 100;
    const segment = `${color} ${start}% ${end}%`;
    start = end;
    return segment;
  }).join(", ");

  elements.volumeDonut.style.background = `conic-gradient(${gradient})`;
  elements.volumeLegend.innerHTML = entries.map(([name, count, color]) => `
    <div class="legend-item">
      <span class="swatch" style="background:${color}"></span>
      <span>${escapeHtml(name)}</span>
      <strong>${formatNumber(count)} (${formatPercent(count, total)})</strong>
    </div>
  `).join("");
}

function renderDailyChart(rows) {
  const points = buildDailyPlanActual(rows);
  if (!points.length) {
    elements.dailyChart.innerHTML = `<div class="empty">No Loading date records available for the selected data.</div>`;
    return;
  }

  const width = 1040;
  const height = 460;
  const margin = { top: 28, right: 32, bottom: 58, left: 56 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...points.map((point) => Math.max(point.plan, point.actual)), 1);
  const yScale = (value) => margin.top + plotHeight - (value / maxValue) * plotHeight;
  const bandWidth = plotWidth / points.length;
  const barWidth = Math.max(4, Math.min(28, bandWidth * 0.34));
  const yTicks = makeTicks(maxValue, 4);
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  elements.dailyChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="bar-chart" role="img" aria-labelledby="dailyChartTitle dailyChartDesc">
      <title id="dailyChartTitle">Daily POD return plan versus actual</title>
      <desc id="dailyChartDesc">Grouped bar chart by Loading date comparing planned POD return count and actual POD return count.</desc>
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
          const x = margin.left + bandWidth * (index + 0.5);
          return `<text x="${x}" y="${height - 24}" text-anchor="middle">${escapeHtml(point.label)}</text>`;
        }).join("")}
      </g>
      ${points.map((point, index) => {
        const groupCenter = margin.left + bandWidth * (index + 0.5);
        const planY = yScale(point.plan);
        const actualY = yScale(point.actual);
        return `
          <rect class="plan-bar" x="${(groupCenter - barWidth - 2).toFixed(1)}" y="${planY.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${(margin.top + plotHeight - planY).toFixed(1)}" rx="2">
            <title>${escapeHtml(point.label)} - Plan: ${point.plan}</title>
          </rect>
          <rect class="actual-bar" x="${(groupCenter + 2).toFixed(1)}" y="${actualY.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${(margin.top + plotHeight - actualY).toFixed(1)}" rx="2">
            <title>${escapeHtml(point.label)} - Actual: ${point.actual}</title>
          </rect>
        `;
      }).join("")}
      <g class="chart-legend">
        <rect class="plan-bar" x="${margin.left}" y="7" width="16" height="12" rx="2"></rect>
        <text x="${margin.left + 28}" y="18">Plan POD Return</text>
        <rect class="actual-bar" x="${margin.left + 178}" y="7" width="16" height="12" rx="2"></rect>
        <text x="${margin.left + 206}" y="18">Actual POD Return</text>
      </g>
    </svg>
  `;
}

function renderPodSunburst(rows) {
  const bySub = new Map();
  rows.forEach((row) => {
    const sub = row.sub || "Unassigned";
    const status = sunburstStatus(row.bucket);
    if (!bySub.has(sub)) bySub.set(sub, { name: sub, total: 0, statuses: new Map() });
    const group = bySub.get(sub);
    group.total += 1;
    group.statuses.set(status, (group.statuses.get(status) || 0) + 1);
  });

  const groups = Array.from(bySub.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const total = rows.length;
  if (!total || !groups.length) {
    elements.podSunburst.innerHTML = `<div class="empty">No POD status data available for the selected data.</div>`;
    return;
  }

  const width = 1040;
  const height = 530;
  const cx = width / 2;
  const cy = height / 2;
  const innerRadius = 70;
  const subOuterRadius = 150;
  const statusOuterRadius = 225;
  const statusOrder = ["On-Time", "Not On-Time", "Pending POD", "Cancel"];
  const statusColor = { "On-Time": "#08c792", "Not On-Time": "#0099da", "Pending POD": "#003369", "Cancel": "#ed2939" };
  const subColors = ["#003369", "#62635b", "#929288", "#c5c6bf"];
  const statusTotals = new Map(statusOrder.map((status) => [status, 0]));
  let angle = -Math.PI / 2;
  const arcs = [];

  groups.forEach((group, groupIndex) => {
    const groupAngle = (group.total / total) * Math.PI * 2;
    const start = angle;
    const end = angle + groupAngle;
    const baseColor = subColors[groupIndex % subColors.length];
    arcs.push({ type: "sub", label: group.name, value: group.total, start, end, color: baseColor });
    let childAngle = start;
    statusOrder.forEach((status) => {
      const count = group.statuses.get(status) || 0;
      if (!count) return;
      statusTotals.set(status, statusTotals.get(status) + count);
      const childEnd = childAngle + (count / total) * Math.PI * 2;
      arcs.push({ type: "status", label: status, sub: group.name, value: count, start: childAngle, end: childEnd, color: statusColor[status] });
      childAngle = childEnd;
    });
    angle = end;
  });

  elements.podSunburst.innerHTML = `
    <div class="sunburst-layout">
      <svg viewBox="0 0 ${width} ${height}" class="sunburst-svg" role="img" aria-labelledby="sunburstTitle sunburstDesc">
        <title id="sunburstTitle">POD status by sub-contractor</title>
        <desc id="sunburstDesc">Sunburst chart where the inner ring shows sub-contractor delivery volume and the outer ring shows the POD status distribution for each sub-contractor.</desc>
        ${arcs.map((arc) => {
          const radius = arc.type === "sub" ? [innerRadius, subOuterRadius] : [subOuterRadius + 3, statusOuterRadius];
          const label = arc.type === "sub" ? `${arc.label}: ${formatNumber(arc.value)} deliveries` : `${arc.sub} - ${arc.label}: ${formatNumber(arc.value)}`;
          return `<path class="sunburst-arc sunburst-${arc.type}" d="${donutArc(cx, cy, radius[0], radius[1], arc.start, arc.end)}" fill="${arc.color}" data-tooltip="${escapeHtml(label)}"><title>${escapeHtml(label)}</title></path>`;
        }).join("")}
        <circle class="sunburst-center" cx="${cx}" cy="${cy}" r="${innerRadius - 4}"></circle>
        <text class="sunburst-total" x="${cx}" y="${cy - 5}" text-anchor="middle">${formatNumber(total)}</text>
        <text class="sunburst-caption" x="${cx}" y="${cy + 20}" text-anchor="middle">Deliveries</text>
      </svg>
      <div class="sunburst-legend" aria-label="POD status legend">
        ${statusOrder.map((status) => {
          const count = statusTotals.get(status) || 0;
          return `<div class="sunburst-stat"><span><i style="background:${statusColor[status]}"></i>${status}</span><strong>${formatNumber(count)} <small>${formatPercent(count, total)}</small></strong></div>`;
        }).join("")}
        <small>Inner ring: Sub-Contractor volume<br>Outer ring: POD status<br>Hover a segment for Sub details</small>
      </div>
    </div>
    <div class="sunburst-breakdown">
      <h3>Sub-Contractor Status Breakdown</h3>
      <div class="table-wrap">
        <table class="sunburst-table">
          <thead>
            <tr>
              <th>Sub-Contractor</th>
              <th class="status-on-time">On-Time</th>
              <th class="status-not-on-time">Not On-Time</th>
              <th class="status-pending">Pending POD</th>
              <th class="status-cancel">Cancel</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${groups.map((group) => `
              <tr>
                <td>${escapeHtml(group.name)}</td>
                <td class="status-on-time">${formatNumber(group.statuses.get("On-Time") || 0)}</td>
                <td class="status-not-on-time">${formatNumber(group.statuses.get("Not On-Time") || 0)}</td>
                <td class="status-pending">${formatNumber(group.statuses.get("Pending POD") || 0)}</td>
                <td class="status-cancel">${formatNumber(group.statuses.get("Cancel") || 0)}</td>
                <td><strong>${formatNumber(group.total)}</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function sunburstStatus(bucket) {
  return { onTime: "On-Time", notOnTime: "Not On-Time", pending: "Pending POD", cancel: "Cancel" }[bucket] || "Pending POD";
}

function donutArc(cx, cy, innerRadius, outerRadius, start, end) {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const polar = (radius, angle) => [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  const [x1, y1] = polar(outerRadius, start);
  const [x2, y2] = polar(outerRadius, end);
  const [x3, y3] = polar(innerRadius, end);
  const [x4, y4] = polar(innerRadius, start);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
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

function buildSubPerformance(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const name = row.sub || "Unassigned";
    if (!map.has(name)) map.set(name, { name, total: 0, active: 0, pending: 0 });
    const group = map.get(name);
    group.total += 1;
    if (row.bucket === "cancel") return;
    group.active += 1;
    if (row.bucket === "pending") group.pending += 1;
  });

  const groups = Array.from(map.values()).filter((group) => group.active > 0);
  const fleetActive = groups.reduce((sum, group) => sum + group.active, 0);
  const fleetPending = groups.reduce((sum, group) => sum + group.pending, 0);
  const fleetAvgRate = fleetActive ? fleetPending / fleetActive : 0;
  const volumeValues = groups.map((group) => group.active).sort((a, b) => a - b);
  const lowSampleCutoff = volumeValues.length ? volumeValues[Math.floor(volumeValues.length * 0.25)] : 0;

  groups.forEach((group) => {
    group.rate = group.active ? group.pending / group.active : 0;
    group.deltaVsAvg = group.rate - fleetAvgRate;
    group.lowSample = group.active <= Math.max(lowSampleCutoff, 20) && groups.length > 1;
    if (group.rate >= fleetAvgRate * 1.5 && fleetAvgRate > 0) group.tier = "priority";
    else if (group.rate > fleetAvgRate) group.tier = "watch";
    else group.tier = "good";
  });

  groups.sort((a, b) => b.rate - a.rate || b.pending - a.pending || a.name.localeCompare(b.name));
  return { groups, fleetAvgRate };
}

function renderSubPerformance(rows) {
  const { groups, fleetAvgRate } = buildSubPerformance(rows);

  if (!groups.length) {
    elements.subScatter.innerHTML = `<div class="empty">No sub-contractor records available for the selected data.</div>`;
    elements.subLeaderboard.innerHTML = `<tr><td class="empty" colspan="6">No sub-contractor records available for the selected data.</td></tr>`;
    return;
  }

  renderSubScatter(groups, fleetAvgRate);
  renderSubLeaderboard(groups, fleetAvgRate);
}

function renderSubScatter(groups, fleetAvgRate) {
  const width = 720;
  const height = 340;
  const margin = { top: 24, right: 32, bottom: 46, left: 56 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const maxVolume = Math.max(...groups.map((group) => group.active), 1);
  const maxRate = Math.max(...groups.map((group) => group.rate), fleetAvgRate, 0.05);
  const xMax = maxVolume * 1.12;
  const yMax = maxRate * 1.2;

  const maxPending = Math.max(...groups.map((group) => group.pending), 1);
  const radiusFor = (pending) => 8 + Math.sqrt(pending / maxPending) * 26;

  const xScale = (value) => margin.left + (value / xMax) * plotWidth;
  const yScale = (value) => margin.top + plotHeight - (value / yMax) * plotHeight;

  const xTicks = makeTicks(xMax, 4);
  const yTicksPct = makeTicks(Math.round(yMax * 100), 4);

  const avgY = yScale(fleetAvgRate);

  elements.subScatter.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="scatter-chart" role="img" aria-labelledby="subScatterTitle subScatterDesc">
      <title id="subScatterTitle">Sub-contractor pending rate versus delivery volume</title>
      <desc id="subScatterDesc">Scatter chart plotting each sub-contractor's pending POD rate against total delivery volume, with bubble size representing pending count and a dashed line marking the fleet average pending rate.</desc>
      <g class="scatter-grid">
        ${yTicksPct.map((tickPct) => {
          const y = yScale(tickPct / 100);
          return `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"></line><text x="${margin.left - 10}" y="${y + 4}" text-anchor="end">${tickPct}%</text>`;
        }).join("")}
      </g>
      <g class="scatter-axis">
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}"></line>
        <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${width - margin.right}" y2="${margin.top + plotHeight}"></line>
        ${xTicks.map((tick) => {
          const x = xScale(tick);
          return `<text x="${x}" y="${height - 24}" text-anchor="middle">${formatNumber(tick)}</text>`;
        }).join("")}
        <text class="axis-label" x="${margin.left + plotWidth / 2}" y="${height - 4}" text-anchor="middle">Delivery Volume (active deliveries)</text>
        <text class="axis-label" transform="translate(16 ${margin.top + plotHeight / 2}) rotate(-90)" text-anchor="middle">Pending Rate</text>
      </g>
      <line class="avg-line" x1="${margin.left}" y1="${avgY}" x2="${width - margin.right}" y2="${avgY}"></line>
      <text class="avg-label" x="${width - margin.right}" y="${avgY - 6}" text-anchor="end">Fleet avg ${formatPercentValue(fleetAvgRate)}</text>
      ${groups.map((group) => {
        const cx = xScale(group.active);
        const cy = yScale(group.rate);
        const r = radiusFor(group.pending);
        return `
          <circle class="sub-bubble tier-${group.tier}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"${group.lowSample ? " stroke-dasharray=\"3 3\"" : ""}>
            <title>${escapeHtml(group.name)} — ${formatNumber(group.active)} deliveries, ${formatNumber(group.pending)} pending (${formatPercentValue(group.rate)})</title>
          </circle>
          <text class="bubble-label" x="${cx.toFixed(1)}" y="${(cy - r - 6).toFixed(1)}">${escapeHtml(group.name)}</text>
          <text class="bubble-sub" x="${cx.toFixed(1)}" y="${(cy + 4).toFixed(1)}">${formatPercentValue(group.rate)}</text>
        `;
      }).join("")}
    </svg>
  `;
}

function renderSubLeaderboard(groups, fleetAvgRate) {
  const tierLabel = { priority: "Priority follow-up", watch: "Watch", good: "On track" };

  elements.subLeaderboard.innerHTML = groups.map((group) => {
    const deltaPts = (group.rate - fleetAvgRate) * 100;
    const deltaText = `${deltaPts >= 0 ? "+" : ""}${deltaPts.toFixed(1)} pts`;
    const deltaClass = deltaPts > 0 ? "trend-up" : deltaPts < 0 ? "trend-down" : "";
    return `
      <tr>
        <td>${escapeHtml(group.name)}</td>
        <td>${formatNumber(group.active)}</td>
        <td>${formatNumber(group.pending)}</td>
        <td>${formatPercentValue(group.rate)}</td>
        <td class="${deltaClass}">${deltaText}</td>
        <td><span class="pill tier-${group.tier}">${tierLabel[group.tier]}</span></td>
      </tr>
    `;
  }).join("");
}

function buildReturnTiming(rows) {
  const returned = rows.filter((row) => row.actualPodDate && row.planPodDate);
  const overall = { early: 0, onPlan: 0, late: 0, earlyDaysSum: 0 };
  const bySub = new Map();

  returned.forEach((row) => {
    const diffDays = Math.round((row.planPodDate - row.actualPodDate) / 86400000);
    const bucket = diffDays > 0 ? "early" : diffDays === 0 ? "onPlan" : "late";

    overall[bucket] += 1;
    if (bucket === "early") overall.earlyDaysSum += diffDays;

    const name = row.sub || "Unassigned";
    if (!bySub.has(name)) bySub.set(name, { name, returned: 0, early: 0, onPlan: 0, late: 0, earlyDaysSum: 0 });
    const group = bySub.get(name);
    group.returned += 1;
    group[bucket] += 1;
    if (bucket === "early") group.earlyDaysSum += diffDays;
  });

  const groups = Array.from(bySub.values())
    .map((group) => ({
      ...group,
      earlyRate: group.returned ? group.early / group.returned : 0,
      avgDaysEarly: group.early ? group.earlyDaysSum / group.early : 0
    }))
    .sort((a, b) => b.earlyRate - a.earlyRate || b.returned - a.returned || a.name.localeCompare(b.name));

  const returnedTotal = overall.early + overall.onPlan + overall.late;
  overall.avgDaysEarly = overall.early ? overall.earlyDaysSum / overall.early : 0;

  return { overall, groups, returnedTotal };
}

function renderReturnTiming(rows) {
  const { overall, groups, returnedTotal } = buildReturnTiming(rows);

  if (!returnedTotal) {
    elements.earlyDonut.style.background = "conic-gradient(var(--surface-2) 0 100%)";
    elements.earlyLegend.innerHTML = `<div class="empty">No returned POD records with both Plan and Actual POD Return dates for the selected data.</div>`;
    elements.earlyLeaderboard.innerHTML = `<tr><td class="empty" colspan="6">No returned POD records available for the selected data.</td></tr>`;
    return;
  }

  const values = [
    ["Early", overall.early, "#08c792"],
    ["On Plan Date", overall.onPlan, "#0099da"],
    ["Late", overall.late, "#ed2939"]
  ];

  let start = 0;
  const gradient = values.map(([, count, color]) => {
    const end = start + (count / returnedTotal) * 100;
    const segment = `${color} ${start}% ${end}%`;
    start = end;
    return segment;
  }).join(", ");

  elements.earlyDonut.style.background = `conic-gradient(${gradient})`;
  elements.earlyLegend.innerHTML = values.map(([label, count, color]) => `
    <div class="legend-item">
      <span class="swatch" style="background:${color}"></span>
      <span>${label}</span>
      <strong>${formatNumber(count)} (${formatPercent(count, returnedTotal)})</strong>
    </div>
  `).join("") + `
    <div class="legend-item">
      <span class="swatch" style="background:transparent"></span>
      <span>Avg days early (early group)</span>
      <strong>${overall.avgDaysEarly.toFixed(1)} days</strong>
    </div>
  `;

  elements.earlyLeaderboard.innerHTML = groups.map((group) => `
    <tr>
      <td>${escapeHtml(group.name)}</td>
      <td>${formatNumber(group.returned)}</td>
      <td>${formatNumber(group.early)}</td>
      <td>${formatPercentValue(group.earlyRate)}</td>
      <td>${group.early ? `${group.avgDaysEarly.toFixed(1)} days` : "-"}</td>
      <td>${formatNumber(group.late)}</td>
    </tr>
  `).join("");
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

  elements.pendingTable.innerHTML = dueRows.map((row) => {
    const days = daysDue(row.planPodDate, today);
    const isOverdue = days > 0;
    return `
    <tr>
      <td>${escapeHtml(row.sub)}</td>
      <td>${escapeHtml(row.hub)}</td>
      <td>${escapeHtml(row.region)}</td>
      <td>${escapeHtml(row.order)}</td>
      <td>${formatDate(row.loadingDateValue)}</td>
      <td>${formatDate(row.planPodDate)}</td>
      <td>${days}</td>
      <td><span class="pill ${isOverdue ? "overdue" : "due-today"}">${isOverdue ? "Overdue" : "Due Today"}</span></td>
    </tr>
  `;
  }).join("");
}

function daysDue(planDate, referenceDate) {
  return Math.max(0, Math.floor((stripTime(referenceDate) - stripTime(planDate)) / 86400000));
}

function buildPodAging(rows) {
  const today = startOfToday();
  const counts = agingBuckets.map(() => 0);
  let total = 0;

  rows.forEach((row) => {
    if (row.bucket !== "pending" || !row.loadingDateValue) return;
    const age = Math.floor((today - stripTime(row.loadingDateValue)) / 86400000);
    const index = agingBuckets.findIndex((bucket) => age >= bucket.min && age <= bucket.max);
    if (index >= 0) {
      counts[index] += 1;
      total += 1;
    }
  });

  return { counts, total };
}

function renderAgingBars(rows) {
  const { counts, total } = buildPodAging(rows);

  if (!total) {
    elements.agingBars.innerHTML = `<div class="empty">No pending POD records for the selected data.</div>`;
    return;
  }

  const maxCount = Math.max(...counts, 1);
  elements.agingBars.innerHTML = agingBuckets.map((bucket, index) => {
    const count = counts[index];
    const width = (count / maxCount) * 100;
    return `
      <div class="bar-row">
        <div class="bar-head">
          <strong>${bucket.label}</strong>
          <span>${formatNumber(count)}</span>
        </div>
        <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${width}%; background:${agingColors[index]}"></div></div>
        <div class="bar-meta">${formatPercent(count, total)} of pending records</div>
      </div>
    `;
  }).join("");
}

function buildExpectedIncoming(rows) {
  const today = startOfToday();
  const counts = incomingBuckets.map(() => 0);
  let total = 0;

  rows.forEach((row) => {
    if (row.bucket !== "pending" || !row.planPodDate) return;
    const daysUntil = Math.floor((stripTime(row.planPodDate) - today) / 86400000);
    if (daysUntil < 0) return;
    const index = incomingBuckets.findIndex((bucket) => daysUntil >= bucket.min && daysUntil <= bucket.max);
    if (index >= 0) {
      counts[index] += 1;
      total += 1;
    }
  });

  return { counts, total };
}

function renderIncomingBars(rows) {
  const { counts, total } = buildExpectedIncoming(rows);

  if (!total) {
    elements.incomingBars.innerHTML = `<div class="empty">No upcoming pending POD records for the selected data.</div>`;
    return;
  }

  const maxCount = Math.max(...counts, 1);
  elements.incomingBars.innerHTML = incomingBuckets.map((bucket, index) => {
    const count = counts[index];
    const width = (count / maxCount) * 100;
    return `
      <div class="bar-row">
        <div class="bar-head">
          <strong>${bucket.label}</strong>
          <span>${formatNumber(count)}</span>
        </div>
        <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${width}%; background:${incomingColors[index]}"></div></div>
        <div class="bar-meta">${formatPercent(count, total)} of not-yet-due pending records</div>
      </div>
    `;
  }).join("");
}

function buildAvgReturnDays(rows, dimension) {
  const map = new Map();
  rows.forEach((row) => {
    if (!row.actualPodDate || !row.loadingDateValue) return;
    const key = row[dimension] || "Unassigned";
    const days = Math.round((row.actualPodDate - row.loadingDateValue) / 86400000);
    if (!map.has(key)) map.set(key, { name: key, sum: 0, count: 0, metCount: 0, slaCount: 0 });
    const group = map.get(key);
    group.sum += days;
    group.count += 1;
    if (row.slaDays !== null && row.slaDays !== undefined) {
      group.slaCount += 1;
      if (days <= row.slaDays) group.metCount += 1;
    }
  });

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      avg: group.count ? group.sum / group.count : 0,
      achievementRate: group.slaCount ? group.metCount / group.slaCount : null,
      slaCoverage: group.count ? group.slaCount / group.count : 0
    }))
    .sort((a, b) => {
      const aValue = a.achievementRate === null ? Infinity : a.achievementRate;
      const bValue = b.achievementRate === null ? Infinity : b.achievementRate;
      return aValue - bValue || a.avg - b.avg;
    });
}

function renderAvgReturnBars(rows) {
  const dimension = state.avgReturnDim;
  const groups = buildAvgReturnDays(rows, dimension);

  if (!groups.length) {
    elements.avgReturnBars.innerHTML = `<div class="empty">No returned POD records with both Loading date and Actual POD Return for the selected data.</div>`;
    return;
  }

  elements.avgReturnBars.innerHTML = groups.map((group) => {
    const hasSla = group.achievementRate !== null;
    const pct = hasSla ? group.achievementRate * 100 : 0;
    const width = hasSla ? pct : 4;
    const color = !hasSla ? "#c5c6bf" : pct >= 90 ? "#08c792" : pct >= 75 ? "#f2a900" : "#ed2939";
    const label = hasSla ? `${pct.toFixed(1)}% met SLA` : "No SLA mapped";
    const coverageNote = hasSla && group.slaCoverage < 1
      ? ` (${formatPercentValue(group.slaCoverage)} of records mapped to an SLA)`
      : "";
    return `
      <div class="bar-row">
        <div class="bar-head">
          <strong>${escapeHtml(group.name)}</strong>
          <span>${label}</span>
        </div>
        <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${width}%; background:${color}"></div></div>
        <div class="bar-meta">${group.avg.toFixed(1)} days actual avg · ${formatNumber(group.count)} returned records${coverageNote}</div>
      </div>
    `;
  }).join("");
}

function monthLabel(date) {
  return `${monthName(date)} ${date.getFullYear()}`;
}

function buildTrend(rows, granularity) {
  const map = new Map();

  let minDate = null;
  rows.forEach((row) => {
    if (row.bucket === "cancel" || !row.loadingDateValue) return;
    const date = stripTime(row.loadingDateValue);
    if (!minDate || date < minDate) minDate = date;
  });

  rows.forEach((row) => {
    if (row.bucket === "cancel" || !row.loadingDateValue) return;
    const date = stripTime(row.loadingDateValue);
    let sortDate;
    if (granularity === "month") {
      sortDate = new Date(date.getFullYear(), date.getMonth(), 1);
    } else {
      const daysSinceStart = Math.floor((date - minDate) / 86400000);
      const weekIndex = Math.floor(daysSinceStart / 7);
      sortDate = new Date(minDate.getTime() + weekIndex * 7 * 86400000);
    }
    const key = dateKey(sortDate);

    if (!map.has(key)) {
      map.set(key, { key, sortDate, active: 0, pending: 0, onTime: 0 });
    }
    const point = map.get(key);
    point.active += 1;
    if (row.bucket === "pending") point.pending += 1;
    if (row.bucket === "onTime") point.onTime += 1;
  });

  return Array.from(map.values())
    .sort((a, b) => a.sortDate - b.sortDate)
    .map((point) => ({
      ...point,
      pendingRate: point.active ? point.pending / point.active : 0,
      onTimeRate: point.active ? point.onTime / point.active : 0,
      label: granularity === "month" ? monthLabel(point.sortDate) : formatShortDate(point.sortDate)
    }));
}

function renderTrendChart(rows) {
  const granularity = state.trendGranularity;
  const points = buildTrend(rows, granularity);

  if (!points.length) {
    elements.trendChart.innerHTML = `<div class="empty">No Loading date records available for the selected data.</div>`;
    return;
  }

  const width = 1040;
  const height = 360;
  const margin = { top: 28, right: 32, bottom: 58, left: 56 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = 1;
  const xStep = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
  const yScale = (value) => margin.top + plotHeight - (value / maxValue) * plotHeight;
  const xScale = (index) => margin.left + (points.length > 1 ? index * xStep : plotWidth / 2);
  const pendingPath = linePath(points, (point) => point.pendingRate, xScale, yScale);
  const onTimePath = linePath(points, (point) => point.onTimeRate, xScale, yScale);
  const yTicksPct = [0, 20, 40, 60, 80, 100];
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));

  elements.trendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="line-chart" role="img" aria-labelledby="trendChartTitle trendChartDesc">
      <title id="trendChartTitle">Pending and on-time rate trend</title>
      <desc id="trendChartDesc">Line chart showing the percentage of active deliveries that are pending or on-time, grouped ${granularity === "month" ? "by month" : "by week"} of Loading date.</desc>
      <g class="chart-grid">
        ${yTicksPct.map((tickPct) => {
          const y = yScale(tickPct / 100);
          return `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"></line><text x="${margin.left - 10}" y="${y + 4}" text-anchor="end">${tickPct}%</text>`;
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
      <path class="onplan-line" d="${pendingPath}"></path>
      <path class="sla-within-line" d="${onTimePath}"></path>
      ${points.map((point, index) => {
        const x = xScale(index);
        return `
          <circle class="onplan-dot" cx="${x}" cy="${yScale(point.pendingRate)}" r="4">
            <title>${escapeHtml(point.label)} - Pending rate: ${formatPercentValue(point.pendingRate)}</title>
          </circle>
          <circle class="sla-within-dot" cx="${x}" cy="${yScale(point.onTimeRate)}" r="4">
            <title>${escapeHtml(point.label)} - On-Time rate: ${formatPercentValue(point.onTimeRate)}</title>
          </circle>
        `;
      }).join("")}
      <g class="chart-legend">
        <line class="onplan-line" x1="${margin.left}" y1="14" x2="${margin.left + 22}" y2="14"></line>
        <text x="${margin.left + 28}" y="18">Pending rate</text>
        <line class="sla-within-line" x1="${margin.left + 150}" y1="14" x2="${margin.left + 172}" y2="14"></line>
        <text x="${margin.left + 178}" y="18">On-Time rate</text>
      </g>
    </svg>
  `;
}

function buildCarrierScorecard(rows) {
  const volumeMap = new Map();
  rows.forEach((row) => {
    const name = row.sub || "Unassigned";
    volumeMap.set(name, (volumeMap.get(name) || 0) + 1);
  });
  const totalVolume = rows.length;

  const { groups: pendingGroups } = buildSubPerformance(rows);
  const pendingByName = new Map(pendingGroups.map((group) => [group.name, group]));

  const avgReturnGroups = buildAvgReturnDays(rows, "sub");
  const avgReturnByName = new Map(avgReturnGroups.map((group) => [group.name, group]));

  const names = new Set([...volumeMap.keys(), ...pendingByName.keys(), ...avgReturnByName.keys()]);

  const scorecards = Array.from(names).map((name) => {
    const volume = volumeMap.get(name) || 0;
    const volumeShare = totalVolume ? volume / totalVolume : 0;
    const pendingGroup = pendingByName.get(name);
    const pendingRate = pendingGroup ? pendingGroup.rate : 0;
    const avgReturnGroup = avgReturnByName.get(name);
    const avgReturnDays = avgReturnGroup ? avgReturnGroup.avg : null;
    const achievementRate = avgReturnGroup ? avgReturnGroup.achievementRate : null;

    let score = 100;
    score -= Math.min(pendingRate * 100, 100) * 0.6;
    if (achievementRate !== null) {
      score -= (1 - achievementRate) * 40;
    }
    score = Math.max(0, Math.min(100, score));

    return { name, volume, volumeShare, pendingRate, avgReturnDays, achievementRate, score };
  });

  return scorecards.sort((a, b) => b.score - a.score || b.volume - a.volume);
}

function renderScorecard(rows) {
  const scorecards = buildCarrierScorecard(rows);

  if (!scorecards.length) {
    elements.scorecardBody.innerHTML = `<tr><td class="empty" colspan="6">No sub-contractor records available for the selected data.</td></tr>`;
    return;
  }

  elements.scorecardBody.innerHTML = scorecards.map((card) => {
    const tier = card.score >= 80 ? "score-good" : card.score >= 60 ? "score-warn" : "score-bad";
    const slaCell = card.achievementRate === null
      ? "-"
      : `${(card.achievementRate * 100).toFixed(1)}%<div class="low-sample">${card.avgReturnDays.toFixed(1)}d actual avg</div>`;
    return `
      <tr>
        <td>${escapeHtml(card.name)}</td>
        <td>${formatNumber(card.volume)}</td>
        <td>${formatPercentValue(card.volumeShare)}</td>
        <td>${formatPercentValue(card.pendingRate)}</td>
        <td>${slaCell}</td>
        <td><span class="pill ${tier}">${card.score.toFixed(0)}/100</span></td>
      </tr>
    `;
  }).join("");
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

function formatPercentValue(fraction) {
  return `${((fraction || 0) * 100).toFixed(1)}%`;
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
