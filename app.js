const state = { records: 820, region: 'All regions', category: 'All categories' };
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.dashboard-view');
const recordCount = document.querySelector('#record-count');
const uploadMessage = document.querySelector('#upload-message');

function showView(viewName) {
  navItems.forEach((item) => item.classList.toggle('active', item.dataset.view === viewName));
  views.forEach((view) => view.classList.toggle('active-view', view.id === `${viewName}-view`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach((item) => item.addEventListener('click', () => showView(item.dataset.view)));
document.querySelectorAll('[data-view-jump]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.viewJump)));

document.querySelector('#region-filter').addEventListener('change', (event) => {
  state.region = event.target.value;
  updateRecordCount();
});
document.querySelector('#category-filter').addEventListener('change', (event) => {
  state.category = event.target.value;
  updateRecordCount();
});
document.querySelector('#period-filter').addEventListener('change', updateRecordCount);

document.querySelector('#reset-filters').addEventListener('click', () => {
  document.querySelector('#period-filter').value = 'quarter';
  document.querySelector('#region-filter').value = 'All regions';
  document.querySelector('#category-filter').value = 'All categories';
  state.region = 'All regions';
  state.category = 'All categories';
  updateRecordCount();
});

function updateRecordCount() {
  let count = 820;
  if (state.region !== 'All regions') count -= 140;
  if (state.category !== 'All categories') count -= 105;
  recordCount.textContent = count;
  const revenueValue = document.querySelector('#revenue-value');
  revenueValue.textContent = state.region === 'All regions' && state.category === 'All categories' ? '$1.28M' : `$${(count * 1.56).toFixed(0)}K`;
}

function handleUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  uploadMessage.hidden = false;
  uploadMessage.textContent = `${file.name} is ready to be connected. The frontend preview is using sample metrics until ingestion is enabled.`;
  setTimeout(() => { uploadMessage.hidden = true; }, 6500);
}
document.querySelector('#file-input').addEventListener('change', handleUpload);
document.querySelector('#data-upload-trigger').addEventListener('click', () => document.querySelector('#file-input').click());

document.querySelector('#export-button').addEventListener('click', () => {
  const report = ['Metric,Value', 'Total revenue,$1.28M', 'Net profit,$342.6K', 'Profit margin,26.8%', 'Units sold,18492'].join('\n');
  const blob = new Blob([report], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'performance-report.csv';
  link.click();
  URL.revokeObjectURL(link.href);
});

function answerQuery() {
  const input = document.querySelector('#query-input');
  const query = input.value.trim();
  if (!query) return;
  const normalized = query.toLowerCase();
  let answer = 'Technology is the strongest category this period, with revenue up 24.6% and the North region leading demand.';
  if (normalized.includes('region')) answer = 'North is growing fastest at 21%, followed by West at 14%. South is the only region currently declining.';
  if (normalized.includes('profit') || normalized.includes('margin')) answer = 'Net profit is $342.6K at a 26.8% margin. Furniture is pulling the margin below the 28% target.';
  if (normalized.includes('product') || normalized.includes('category')) answer = 'Technology is carrying the quarter, led by enterprise orders. Consider protecting inventory before the next period.';
  uploadMessage.hidden = false;
  uploadMessage.textContent = `Insight · ${answer}`;
  input.value = '';
  setTimeout(() => { uploadMessage.hidden = true; }, 8000);
}
document.querySelector('#ask-button').addEventListener('click', answerQuery);
document.querySelector('#query-input').addEventListener('keydown', (event) => { if (event.key === 'Enter') answerQuery(); });
