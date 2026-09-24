# Business KPI Assistant — Enterprise Analytics Platform

A high-performance, client-side (HTML5/CSS3/JavaScript) AI analytics dashboard and decision-intelligence platform for business operations, commercial sales, and executive reporting.

Upload any standard business dataset in CSV or Excel (`.xlsx`/`.xls`) format, or explore the built-in enterprise sample dataset. The platform automatically cleans, ingests, computes key performance indicators (KPIs), detects statistical anomalies, models predictive forecasts, and provides a context-aware natural language conversational assistant with zero backend latency and complete local client-side data privacy.

---

## Core Capabilities & Architecture

### 1. Multi-Dimensional Interactive Slicers & Global Filtering
- Global filter bar for **Region**, **Product Category**, and **Customer Segment**.
- Instantly recalculates all KPIs, charts, trends, heatmaps, and AI insights across the entire workspace upon filter adjustment.
- Real-time active record counter and single-click filter reset.

### 2. Executive KPI Overview & Performance Heatmap
- Automatic identification and computation of **Total Revenue**, **Total Sales**, **Net Profit**, **Profit Margin (%)**, **Units Sold**, **Average Order Value (AOV)**, and **MoM Revenue Growth**.
- Dynamic visual indicator badges for growth trajectory and margin safety.
- **Cross-Tabulation Matrix Heatmap (Region &times; Category)** with color-density gradients for fast revenue density and bottleneck identification.
- AI-generated executive discovery items with contextual badges (*Geographic Delta*, *Top Performer*, *Margin Health*).

### 3. Conversational AI Assistant with Context Memory
- Natural language query understanding supporting multi-turn questions with conversational entity memory (pronouns like *"its profit margin"*, *"why did it decline?"*, *"how is it doing in the West region?"*).
- **Dynamic Follow-Up Suggestion Pills** rendered after each response for frictionless continuous exploration.
- **Categorized Prompt Library** (Top Performers, Trends & Forecast, Anomalies, Comparisons).
- Integrated **Voice Input (Web Speech API)** microphone support.

### 4. Time-Series Trends & Predictive AI Forecasting
- Double Exponential Smoothing (**Holt's Linear Trend Model**) providing projected future periods with 95% statistical confidence intervals (shaded upper/lower bounds).
- **3-Month Moving Average (SMA)** smoothing overlay toggle to filter seasonal noise.
- Statistical summary bar displaying peak month, historical momentum, and projected next-month values.

### 5. Multi-Method Statistical Anomaly Detection
- Dual outlier detection methods: **Interquartile Range (IQR)** (with selectable sensitivity: 1.5&times; standard, 2.0&times; conservative) and **Z-Score Deviation** ($|z| \ge 2.5$).
- Event categorization into **Demand Spikes ▲** and **Revenue Drops ▼**.
- **Automated Root-Cause Analysis Engine** providing plain-English operational explanations (e.g., *deviations driven by high unit quantity or enterprise procurement*).

### 6. Multi-Dimensional Comparative Analytics & Scatter Plots
- Direct comparison between two dimension entities (Product A vs Product B, Region A vs Region B) with automated percentage variance calculations.
- **Period-over-Period (MoM & QoQ)** comparison cards.
- **Revenue vs. Profitability Correlation (Scatter Plot)** mapping individual product margin performance.

### 7. Strategic Actionable Recommendations
- Automated decision-support engine categorizing recommendations by priority (**High**, **Medium**, **Low**) across:
  - High-performing product capitalization and inventory buffer protection
  - Underperforming SKU review and bundle promotion strategies
  - Regional territory underperformance audit
  - Gross margin and discount threshold discipline
  - Demand spike reorder synchronization

### 8. Dataset Health Diagnostics & Interactive Paginated Grid
- Schema column detection with data completeness percentage and missing value diagnostics.
- Real-time client-side text search across all columns.
- Paginated table (15, 30, 50 rows per page) with record counters.
- **Export Filtered Data as CSV** button.

### 9. System Pipeline & Architecture
- End-to-end modular pipeline:
  1. **Ingestion & Schema Parser**: Dynamic multi-sheet Excel (.xlsx/.xls) and RFC-4180 CSV parsing with synonym normalization.
  2. **In-Memory Preprocessing**: Deduplication, date memoization, and type validation.
  3. **Statistical & KPI Engine**: Multi-dimensional aggregation, growth rates, moving averages, and cross-tabulation.
  4. **Conversational NLU Engine**: Intent classification, entity slot-filling, and context state management.
  5. **Predictive & Outlier Engine**: Holt's exponential smoothing and IQR/Z-Score anomaly detection.
  6. **Strategic Decision Support**: Prioritized business recommendation generator.

### 10. Executive Report Export & Zero-Egress Privacy
- **Zero External Data Transmission**: All computations, charting, and natural language query processing execute 100% locally in the browser sandbox.
- **Export Executive Report**: Print-optimized stylesheet (`@media print`) rendering a clean, white-background executive summary PDF or printout.

---

## File Structure

```
index.html                  Enterprise dashboard layout, modals, tabs, and filters
css/style.css               Glassmorphic design system, responsive grids, and print stylesheet
js/
  sampleData.js             Bundled 820+ record multi-quarter sales dataset
  format.js                 Currency, percentages, units, and HTML sanitization utilities
  data.js                   Schema detection, memoized date parsing, row filtering, and CSV export
  kpi.js                    KPI calculations, monthly/quarterly series, cross-tab heatmap matrix, scatter points
  trends.js                 Holt's exponential smoothing forecast, moving averages, and IQR/Z-Score anomaly detection
  charts.js                 Modern Chart.js engine with forecast bands, highlights, scatter, and area fills
  insights.js               Executive insight generation and actionable recommendations
  nlp.js                    Context-aware conversational query processor with dynamic follow-ups
  app.js                    Event bus, global slicers, chat controller, pagination, and modal wiring
data/
  sample_sales.csv          Standalone CSV dataset for manual upload testing
```

---

## Running the Application

Double-click `index.html` or open via any local static server (e.g., VS Code Live Server). No build step, no npm install, and no backend dependencies required.
