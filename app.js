const config = window.BUSINESS_KPI_CONFIG || {};
const baseUrl = (config.baseUrl || "").replace(/\/$/, "");

const state = {
  records: 0,
  period: "quarter",
  region: "All regions",
  category: "All categories",
  datasetLoaded: false,
  currentAnalysis: null
};

const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".dashboard-view");
const recordCount = document.querySelector("#record-count");
const uploadMessage = document.querySelector("#upload-message");

const sampleAnomalies = [
  {
    type: "spike",
    label: "Demand spike",
    title: "Enterprise laptops",
    description: "No demand-spike data has been detected.",
    detail: "Awaiting dataset analysis"
  },
  {
    type: "drop",
    label: "Revenue drop",
    title: "Furniture / South",
    description: "No revenue-drop data has been detected.",
    detail: "Awaiting dataset analysis"
  }
];

function showView(viewName) {
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  views.forEach((view) => view.classList.toggle("active-view", view.id === `${viewName}-view`));
  const isProfile = viewName === "profile";
  document.body.classList.toggle("profile-mode", isProfile);
  document.querySelector(".page-heading").hidden = isProfile;
  document.querySelector(".filter-bar").hidden = isProfile;
  document.querySelector(".assistant-dock").hidden = isProfile;
  document.querySelector(".breadcrumb strong").textContent =
    isProfile ? "Profile" : `${viewName.charAt(0).toUpperCase()}${viewName.slice(1)}`;
  history.replaceState(null, "", isProfile ? "#profile" : `#${viewName}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navItems.forEach((item) => item.addEventListener("click", () => showView(item.dataset.view)));
document.querySelectorAll("[data-view-jump]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.viewJump));
});

function endpoint(path) {
  return `${baseUrl}${path}`;
}

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(endpoint(path), {
      ...options,
      signal: controller.signal,
      headers: options.headers || {}
    });

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function setStatus(message, tone = "success", duration = 7000) {
  uploadMessage.hidden = false;
  uploadMessage.textContent = message;
  uploadMessage.className = `upload-message status-${tone}`;

  if (duration) {
    setTimeout(() => {
      uploadMessage.hidden = true;
      uploadMessage.className = "upload-message";
    }, duration);
  }
}

function formatCompact(value, currency = false) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const number = Number(value);
  const prefix = currency ? "₹" : "";

  if (Math.abs(number) >= 10000000) return `${prefix}${(number / 10000000).toFixed(2)}Cr`;
  if (Math.abs(number) >= 100000) return `${prefix}${(number / 100000).toFixed(2)}L`;
  if (Math.abs(number) >= 1000) return `${prefix}${(number / 1000).toFixed(1)}K`;
  if (currency) return `${prefix}${number.toFixed(2)}`;
  return number.toLocaleString();
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)}%`;
}

function updateRecordCount() {
  let count = 0;
  state.records = count;
  recordCount.textContent = count;

  if (!state.datasetLoaded) {
    document.querySelector("#revenue-value").textContent =
      state.region === "All regions" && state.category === "All categories"
        ? "$0"
        : `$${(count * 1.56).toFixed(0)}K`;
  }
}

document.querySelector("#region-filter").addEventListener("change", async (event) => {
  state.region = event.target.value;
  updateRecordCount();
  await refreshAnalysis();
});

document.querySelector("#category-filter").addEventListener("change", async (event) => {
  state.category = event.target.value;
  updateRecordCount();
  await refreshAnalysis();
});

document.querySelector("#period-filter").addEventListener("change", async (event) => {
  state.period = event.target.value;
  await refreshAnalysis();
});

document.querySelector("#reset-filters").addEventListener("click", () => {
  document.querySelector("#period-filter").value = "quarter";
  document.querySelector("#region-filter").value = "All regions";
  document.querySelector("#category-filter").value = "All categories";
  state.period = "quarter";
  state.region = "All regions";
  state.category = "All categories";
  updateRecordCount();
  refreshAnalysis();
});

async function handleUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  setStatus(`Uploading ${file.name} for analysis...`, "loading", 0);
  const formData = new FormData();
  formData.append("file", file);

  try {
    const payload = await apiRequest(config.uploadEndpoint || "/api/upload", {
      method: "POST",
      body: formData
    });

    state.datasetLoaded = true;
    applyAnalysisPayload(payload);
    setStatus(`${file.name} uploaded and analyzed successfully.`);
  } catch (error) {
    setStatus(
      `Unable to reach the analysis backend. ${file.name} was not processed; sample metrics remain visible.`,
      "error"
    );
  } finally {
    event.target.value = "";
  }
}

document.querySelector("#file-input").addEventListener("change", handleUpload);
document.querySelector("#data-upload-trigger").addEventListener("click", () => {
  document.querySelector("#file-input").click();
});

function applyAnalysisPayload(payload) {
  if (!payload || typeof payload !== "object") return;

  state.currentAnalysis = payload;
  const kpis = payload.kpis || payload.data?.kpis || payload;
  const profile = payload.dataset_profile || payload.data?.dataset_profile || payload.profile;

  if (kpis) {
    if (kpis.total_revenue !== undefined) {
      document.querySelector("#revenue-value").textContent = formatCompact(kpis.total_revenue, true);
    }
    if (kpis.total_profit !== undefined) {
      document.querySelector("#profit-value").textContent = formatCompact(kpis.total_profit, true);
    }
    if (kpis.profit_margin_percent !== undefined) {
      document.querySelector("#margin-value").textContent = formatPercent(kpis.profit_margin_percent);
      document.querySelector("#margin-meter").style.width = `${Math.min(100, Math.max(0, kpis.profit_margin_percent * 3.2))}%`;
    }
    if (kpis.total_units_sold !== undefined) {
      document.querySelector("#units-value").textContent = formatCompact(kpis.total_units_sold);
    }
  }

  if (profile) updateDataHealth(profile);

  const anomalies = payload.anomalies || payload.data?.anomalies;
  if (anomalies) renderAnomalies(anomalies);

  const trend = payload.trend || payload.data?.trend;
  if (trend) renderTrend(trend);
}

async function refreshAnalysis() {
  if (!state.datasetLoaded) return;

  try {
    const payload = await apiRequest(config.analysisEndpoint || "/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        period: state.period,
        region: state.region,
        category: state.category
      })
    });
    applyAnalysisPayload(payload);
  } catch (error) {
    setStatus("Filters changed, but the live analysis endpoint is unavailable.", "error");
  }
}

function updateDataHealth(profile) {
  const rows = profile.rows;
  const columnNames = profile.column_names || [];
  const numerical = profile.numerical_columns || [];
  const categorical = profile.categorical_columns || [];
  const dates = profile.date_columns || [];
  const missing = Object.values(profile.missing_values || {}).reduce((sum, value) => sum + value, 0);
  const totalCells = rows * columnNames.length;
  const completeness = totalCells ? ((totalCells - missing) / totalCells) * 100 : 100;

  document.querySelector("#completeness-value").textContent = `${completeness.toFixed(1)}%`;
  document.querySelector("#records-health").textContent = `Across ${formatCompact(rows)} records`;
  document.querySelector("#columns-value").textContent = columnNames.length;
  document.querySelector("#column-breakdown").textContent =
    `${numerical.length} numeric · ${categorical.length} categorical · ${dates.length} date`;

  const table = document.querySelector("#schema-table");
  table.innerHTML =
    "<div><b>Column</b><b>Type</b><b>Completeness</b><b>Use</b></div>" +
    columnNames.map((name) => {
      const missingCount = profile.missing_values?.[name] || 0;
      const completenessValue = rows ? ((rows - missingCount) / rows) * 100 : 100;
      let type = "text";
      let label = "Category";
      let use = "Dimension";
      if (numerical.includes(name)) {
        type = "numeric";
        label = "Numeric";
        use = "Metric";
      } else if (dates.includes(name)) {
        type = "date";
        label = "Date";
        use = "Time series";
      }

      return `<div><span>${escapeHtml(name)}</span><span class="type-pill ${type}">${label}</span>` +
        `<span><i class="health-bar"><i style="width:${completenessValue}%"></i></i>${completenessValue.toFixed(1)}%</span>` +
        `<span>${use}</span></div>`;
    }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderAnomalies(anomalies) {
  let items = [];

  if (Array.isArray(anomalies)) {
    items = anomalies.map((item) => ({
      type: "drop",
      label: "Detected anomaly",
      title: item.metric || item.column || "Anomaly",
      description: `${item.anomaly_count ?? item.length ?? 0} anomalies detected across ${item.total_records ?? "the"} records.`,
      detail: "Detected by Isolation Forest"
    }));
  } else {
    items = Object.entries(anomalies).flatMap(([metric, result]) => {
      if (!result || result.error || !result.anomalies?.length) return [];
      return [{
        type: "drop",
        label: "Detected anomaly",
        title: metric,
        description: `${result.anomaly_count} anomalous records found in ${result.total_records} values.`,
        detail: "Detected by Isolation Forest"
      }];
    });
  }

  renderAnomalyCards(items);
}

function renderAnomalyCards(items) {
  const grid = document.querySelector("#anomaly-grid");
  const count = document.querySelector("#anomaly-count");
  const cards = items.length ? items : sampleAnomalies;
  count.textContent = `${cards.length} flagged`;

  grid.innerHTML = cards.map((item) => `
    <article class="anomaly-card">
      <span class="anomaly-icon ${item.type}">${item.type === "spike" ? "↑" : "↓"}</span>
      <div>
        <span class="insight-tag">${escapeHtml(item.label)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <small>${escapeHtml(item.detail)}</small>
      </div>
    </article>
  `).join("");
}

renderAnomalyCards(sampleAnomalies);

function renderTrend(trendData) {
  const container = document.querySelector("#trend-chart-container");
  const points = Array.isArray(trendData) ? trendData : trendData.trend;
  if (!Array.isArray(points) || points.length < 2) {
    container.innerHTML = '<div class="empty-view"><h3>No trend data available</h3><p>Ask a trend question or import a dataset with a date column.</p></div>';
    return;
  }

  const values = points.map((point) => Number(point.value));
  const labels = points.map((point) => String(point.period));
  const width = 760;
  const height = 300;
  const padding = 45;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const coordinates = values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (values.length - 1);
    const y = padding + ((max - value) * (height - padding * 2)) / range;
    return [x, y];
  });
  const line = coordinates.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join(" ");
  const area = `${line} L${coordinates.at(-1)[0]} ${height - padding} L${coordinates[0][0]} ${height - padding} Z`;
  const labelIndexes = [...new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])];

  container.innerHTML = `
    <div class="trend-chart-data">
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" role="img" aria-label="Revenue trend chart">
        <defs><linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e05d3d" stop-opacity=".22"/><stop offset="1" stop-color="#e05d3d" stop-opacity="0"/></linearGradient></defs>
        ${[30, 90, 150, 210, 270].map((y) => `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#eeece7"/>`).join("")}
        <path d="${area}" fill="url(#trendArea)"/>
        <path d="${line}" fill="none" stroke="#e05d3d" stroke-width="3"/>
        ${coordinates.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#e05d3d"/>`).join("")}
        ${labelIndexes.map((index) => `<text x="${coordinates[index][0]}" y="${height - 12}" text-anchor="middle" fill="#8b9494" font-size="10">${escapeHtml(labels[index])}</text>`).join("")}
      </svg>
    </div>`;
}

async function answerQuery() {
  const input = document.querySelector("#query-input");
  const query = input.value.trim();
  if (!query) return;

  document.querySelector("#assistant-status").textContent = "Analyzing...";
  document.querySelector("#ask-button").disabled = true;

  try {
    const payload = await apiRequest(config.queryEndpoint || "/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: query,
        filters: {
          period: state.period,
          region: state.region,
          category: state.category
        }
      })
    });

    const answer =
      payload.insight ||
      payload.answer ||
      payload.business_insight ||
      payload.data?.insight ||
      payload.message ||
      "The analysis completed successfully.";

    setStatus(answer, "success", 12000);
    document.querySelector("#assistant-status").textContent = "Answer ready";

    const result = payload.results || payload.data?.results || payload;
    if (result.trend) renderTrend(result.trend);
    if (result.anomalies) renderAnomalies(result.anomalies);
  } catch (error) {
    const normalized = query.toLowerCase();
    let answer = "No analysis data is available yet.";
    if (normalized.includes("region")) answer = "No regional analysis data is available yet.";
    if (normalized.includes("profit") || normalized.includes("margin")) answer = "No profit or margin data is available yet.";
    if (normalized.includes("product") || normalized.includes("category")) answer = "No category analysis data is available yet.";

    setStatus(`Sample insight · ${answer}`, "error", 12000);
    document.querySelector("#assistant-status").textContent = "Using sample insight";
  } finally {
    document.querySelector("#ask-button").disabled = false;
    input.value = "";
  }
}

document.querySelector("#ask-button").addEventListener("click", answerQuery);
document.querySelector("#query-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") answerQuery();
});

document.querySelector("#mic-button").addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setStatus("Voice input is not supported by this browser.", "error");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.onstart = () => {
    document.querySelector("#assistant-status").textContent = "Listening...";
  };
  recognition.onresult = (event) => {
    document.querySelector("#query-input").value = event.results[0][0].transcript;
    answerQuery();
  };
  recognition.onerror = () => {
    document.querySelector("#assistant-status").textContent = "Voice input unavailable";
  };
  recognition.start();
});

document.querySelector("#export-button").addEventListener("click", () => {
  const reportRows = [
    ["Metric", "Value"],
    ["Total revenue", document.querySelector("#revenue-value").textContent],
    ["Net profit", document.querySelector("#profit-value").textContent],
    ["Profit margin", document.querySelector("#margin-value").textContent],
    ["Units sold", document.querySelector("#units-value").textContent]
  ];
  const csv = reportRows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "business-kpi-report.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});

document.querySelector("#avatar-button").addEventListener("click", () => showView("profile"));
document.querySelector('[data-view="profile"]').addEventListener("click", () => showView("profile"));

const profileForm = document.querySelector("#profile-form");
const profileFields = [
  "profile-name-input",
  "profile-role-input",
  "profile-email-input",
  "profile-organization-input",
  "profile-currency-input",
  "profile-period-input"
];

function setProfileEditing(editing) {
  profileFields.forEach((id) => {
    document.querySelector(`#${id}`).disabled = !editing;
  });
  document.querySelector("#edit-profile-button").hidden = editing;
  document.querySelector(".profile-form-actions").hidden = !editing;
}

function loadProfile() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem("business-kpi-profile"));
  } catch (error) {
    saved = null;
  }
  if (!saved) return;

  const values = {
    "profile-name-input": saved.name,
    "profile-role-input": saved.role,
    "profile-email-input": saved.email,
    "profile-organization-input": saved.organization,
    "profile-currency-input": saved.currency,
    "profile-period-input": saved.period
  };
  Object.entries(values).forEach(([id, value]) => {
    if (value) document.querySelector(`#${id}`).value = value;
  });
  ["profile-anomaly-toggle", "profile-summary-toggle", "profile-local-toggle"].forEach((id) => {
    if (saved.preferences && typeof saved.preferences[id] === "boolean") {
      document.querySelector(`#${id}`).checked = saved.preferences[id];
    }
  });
  updateProfileIdentity(saved.name, saved.role);
}

function updateProfileIdentity(name, role) {
  document.querySelector("#profile-name").textContent = name || "Maya Kapoor";
  document.querySelector("#profile-role").textContent = role || "Business Analyst";
  const initials = (name || "Maya Kapoor")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  document.querySelector("#profile-avatar").textContent = initials;
  document.querySelector("#avatar-button").textContent = initials;
}

document.querySelector("#edit-profile-button").addEventListener("click", () => setProfileEditing(true));
document.querySelector("#cancel-profile-button").addEventListener("click", () => {
  loadProfile();
  setProfileEditing(false);
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = {
    name: document.querySelector("#profile-name-input").value.trim(),
    role: document.querySelector("#profile-role-input").value.trim(),
    email: document.querySelector("#profile-email-input").value.trim(),
    organization: document.querySelector("#profile-organization-input").value.trim(),
    currency: document.querySelector("#profile-currency-input").value,
    period: document.querySelector("#profile-period-input").value,
    preferences: {
      "profile-anomaly-toggle": document.querySelector("#profile-anomaly-toggle").checked,
      "profile-summary-toggle": document.querySelector("#profile-summary-toggle").checked,
      "profile-local-toggle": document.querySelector("#profile-local-toggle").checked
    }
  };

  localStorage.setItem("business-kpi-profile", JSON.stringify(profile));
  updateProfileIdentity(profile.name, profile.role);
  document.querySelector("#period-filter").value = profile.period;
  state.period = profile.period;
  setProfileEditing(false);
  setStatus("Profile preferences saved in this browser.");
});

["profile-anomaly-toggle", "profile-summary-toggle", "profile-local-toggle"].forEach((id) => {
  document.querySelector(`#${id}`).addEventListener("change", () => {
    const existing = (() => {
      try {
        return JSON.parse(localStorage.getItem("business-kpi-profile")) || {};
      } catch (error) {
        return {};
      }
    })();
    existing.preferences = existing.preferences || {};
    existing.preferences[id] = document.querySelector(`#${id}`).checked;
    localStorage.setItem("business-kpi-profile", JSON.stringify(existing));
  });
});

loadProfile();
setProfileEditing(false);
updateRecordCount();
const initialView = window.location.hash.replace("#", "");
showView(["overview", "trends", "anomalies", "data", "profile"].includes(initialView) ? initialView : "overview");
