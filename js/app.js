'use strict';

// --- State ---
const state = {
  transactions: [],                        // Array<Transaction> — full list, insertion order
  categories: ['Food', 'Transport', 'Fun'], // Array<string>
  theme: 'light',                          // 'light' | 'dark'
  spendingLimit: null,                     // number | null
  activeFilter: null,                      // 'YYYY-MM' string | null
  activeSort: 'none',                      // 'none' | 'amount-asc' | 'amount-desc' | 'category-az' | 'category-za'
};

// --- Storage ---

/**
 * Reads all four ebv_* localStorage keys and populates the state object.
 * Each key is wrapped in its own try/catch so a corrupt entry does not
 * prevent the remaining keys from loading. Falls back to the default
 * state value when a key is missing or contains invalid JSON.
 *
 * Requirements: 5.3, 5.4, 10.4, 10.5, 10.6
 */
const loadFromStorage = () => {
  // ebv_transactions
  try {
    const raw = localStorage.getItem('ebv_transactions');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state.transactions = parsed;
      }
    }
  } catch (e) {
    // Corrupt or unparseable data — fall back to empty array (Req 5.4)
    state.transactions = [];
  }

  // ebv_categories
  try {
    const raw = localStorage.getItem('ebv_categories');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.categories = parsed;
      }
    }
  } catch (e) {
    // Corrupt data — fall back to default categories
    state.categories = ['Food', 'Transport', 'Fun'];
  }

  // ebv_theme
  try {
    const raw = localStorage.getItem('ebv_theme');
    if (raw === 'light' || raw === 'dark') {
      state.theme = raw;
    }
    // If key is absent, state.theme stays 'light' (Req 10.5)
  } catch (e) {
    // localStorage unavailable — default to light (Req 10.6)
    state.theme = 'light';
  }

  // ebv_spending_limit
  try {
    const raw = localStorage.getItem('ebv_spending_limit');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'number' && parsed > 0) {
        state.spendingLimit = parsed;
      } else if (parsed === null) {
        state.spendingLimit = null;
      }
    }
  } catch (e) {
    // Corrupt data — fall back to null
    state.spendingLimit = null;
  }
};

/**
 * Serializes state.transactions and writes it to localStorage.
 * Wrapped in try/catch to handle localStorage unavailability (e.g. private
 * browsing, storage quota exceeded) without crashing the app.
 *
 * Requirements: 5.1, 5.2
 */
const saveTransactions = () => {
  try {
    localStorage.setItem('ebv_transactions', JSON.stringify(state.transactions));
  } catch (e) {
    // Storage unavailable — continue in-memory without persisting
  }
};

/**
 * Serializes state.categories and writes it to localStorage.
 * Wrapped in try/catch to handle localStorage unavailability.
 *
 * Requirements: 6.4
 */
const saveCategories = () => {
  try {
    localStorage.setItem('ebv_categories', JSON.stringify(state.categories));
  } catch (e) {
    // Storage unavailable — continue in-memory without persisting
  }
};

/**
 * Writes state.theme to localStorage.
 * Wrapped in try/catch to handle localStorage unavailability.
 *
 * Requirements: 10.3
 */
const saveTheme = () => {
  try {
    localStorage.setItem('ebv_theme', state.theme);
  } catch (e) {
    // Storage unavailable — theme preference not persisted (Req 10.6)
  }
};

/**
 * Serializes state.spendingLimit and writes it to localStorage.
 * Wrapped in try/catch to handle localStorage unavailability.
 *
 * Requirements: 9.5
 */
const saveSpendingLimit = () => {
  try {
    localStorage.setItem('ebv_spending_limit', JSON.stringify(state.spendingLimit));
  } catch (e) {
    // Storage unavailable — spending limit not persisted
  }
};

// --- DOM ---

/**
 * Rebuilds <option> elements in #item-category from state.categories.
 * Clears all existing options, adds a disabled placeholder, then appends
 * one <option> per category with value and text set to the category name.
 * Requirements: 6.2, 6.4
 */
const renderCategoryOptions = () => {
  const select = document.getElementById('item-category');
  if (!select) return;

  // Clear all existing options
  select.innerHTML = '';

  // Add disabled placeholder option
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = 'Select a category';
  select.appendChild(placeholder);

  // Append one option per category
  state.categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
};

/**
 * Clears #transaction-list and renders filtered + sorted transactions.
 * - Filters state.transactions by state.activeFilter (YYYY-MM) if set.
 * - Sorts a copy by state.activeSort; uses original index as tie-breaker.
 * - Renders one <li> per transaction or an empty-state message.
 * Requirements: 2.1, 2.2, 2.4, 2.5, 7.1, 7.6, 8.1, 8.2, 8.3, 8.4
 */
const renderTransactionList = () => {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  // 1. Filter
  let filteredTransactions;
  if (state.activeFilter) {
    const [filterYear, filterMonth] = state.activeFilter.split('-').map(Number);
    filteredTransactions = state.transactions.filter((tx) => {
      const d = new Date(tx.timestamp);
      const txYear = d.getFullYear();
      const txMonth = d.getMonth() + 1; // getMonth() is 0-indexed
      return txYear === filterYear && txMonth === filterMonth;
    });
  } else {
    filteredTransactions = state.transactions.slice();
  }

  // 2. Sort — tag each entry with its original index for stable tie-breaking
  const indexed = filteredTransactions.map((tx, i) => ({ tx, i }));

  switch (state.activeSort) {
    case 'amount-asc':
      indexed.sort((a, b) => a.tx.amount - b.tx.amount || a.i - b.i);
      break;
    case 'amount-desc':
      indexed.sort((a, b) => b.tx.amount - a.tx.amount || a.i - b.i);
      break;
    case 'category-az':
      indexed.sort((a, b) =>
        a.tx.category.toLowerCase().localeCompare(b.tx.category.toLowerCase()) || a.i - b.i
      );
      break;
    case 'category-za':
      indexed.sort((a, b) =>
        b.tx.category.toLowerCase().localeCompare(a.tx.category.toLowerCase()) || a.i - b.i
      );
      break;
    case 'none':
    default:
      // Keep insertion order (already preserved from state.transactions)
      break;
  }

  const sortedTransactions = indexed.map(({ tx }) => tx);

  // 3. Render
  list.innerHTML = '';

  if (sortedTransactions.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = 'No transactions found.';
    list.appendChild(emptyItem);
    return;
  }

  sortedTransactions.forEach((tx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="tx-name">${tx.name}</span>
      <span class="tx-amount">${tx.amount.toFixed(2)}</span>
      <span class="tx-category">${tx.category}</span>
      <button class="delete-btn" data-id="${tx.id}">Delete</button>
    `;
    list.appendChild(li);
  });
};

/**
 * Sums filtered transactions and updates #balance-amount; toggles warning class.
 * - Filters state.transactions by state.activeFilter (YYYY-MM) if set.
 * - Computes total as the sum of all filtered transaction amounts.
 * - Updates #balance-amount with the total formatted to 2 decimal places.
 * - Adds .balance-warning to #balance-display when state.spendingLimit is set
 *   and total strictly exceeds it; removes the class otherwise.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 7.2, 9.3, 9.4
 */
const renderBalanceDisplay = () => {
  // 1. Filter — same logic as renderTransactionList()
  let filteredTransactions;
  if (state.activeFilter) {
    const [filterYear, filterMonth] = state.activeFilter.split('-').map(Number);
    filteredTransactions = state.transactions.filter((tx) => {
      const d = new Date(tx.timestamp);
      return d.getFullYear() === filterYear && d.getMonth() + 1 === filterMonth;
    });
  } else {
    filteredTransactions = state.transactions.slice();
  }

  // 2. Sum
  const total = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // 3. Update DOM
  const amountEl = document.getElementById('balance-amount');
  if (amountEl) {
    amountEl.textContent = total.toFixed(2);
  }

  // 4. Warning
  const displayEl = document.getElementById('balance-display');
  if (displayEl) {
    const overLimit = state.spendingLimit !== null && total > state.spendingLimit;
    displayEl.classList.toggle('balance-warning', overLimit);
  }
};

/**
 * Aggregates filtered transactions by category and updates the Chart instance.
 * Guards against CDN failure: if chartInstance is null, exits early.
 * - Filters state.transactions by state.activeFilter (YYYY-MM) if set.
 * - Builds a Map<category, sum> from the filtered transactions.
 * - If the map is empty, hides the canvas and shows #chart-placeholder.
 * - Otherwise, shows the canvas, hides the placeholder, and mutates
 *   chartInstance.data before calling chartInstance.update().
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.3
 */
const renderPieChart = () => {
  if (!chartInstance) return; // Guard: Chart.js CDN may have failed to load (Req 4.5)

  const canvas = document.getElementById('pie-chart');
  const placeholder = document.getElementById('chart-placeholder');

  // 1. Filter — same logic as renderTransactionList() / renderBalanceDisplay()
  let filteredTransactions;
  if (state.activeFilter) {
    const [filterYear, filterMonth] = state.activeFilter.split('-').map(Number);
    filteredTransactions = state.transactions.filter((tx) => {
      const d = new Date(tx.timestamp);
      return d.getFullYear() === filterYear && d.getMonth() + 1 === filterMonth;
    });
  } else {
    filteredTransactions = state.transactions.slice();
  }

  // 2. Aggregate into Map<category, sum>
  const categoryMap = new Map();
  filteredTransactions.forEach((tx) => {
    categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + tx.amount);
  });

  // 3. Fixed color palette — pick by index modulo palette length for consistency
  const PALETTE = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

  if (categoryMap.size === 0) {
    // Empty state: hide canvas, show placeholder (Req 4.5)
    if (canvas) canvas.style.display = 'none';
    if (placeholder) placeholder.removeAttribute('hidden');

    // Clear chart data so any previous render is wiped
    chartInstance.data.labels = [];
    chartInstance.data.datasets[0].data = [];
    chartInstance.data.datasets[0].backgroundColor = [];
    chartInstance.update();
  } else {
    // Non-empty state: show canvas, hide placeholder (Req 4.1, 4.2)
    if (canvas) canvas.style.display = '';
    if (placeholder) placeholder.setAttribute('hidden', '');

    const labels = [...categoryMap.keys()];
    const data = [...categoryMap.values()];
    const colors = labels.map((_, i) => PALETTE[i % PALETTE.length]);

    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.update();
  }
};

// --- Chart ---

/** Single Chart.js instance; null until initChart() succeeds. */
let chartInstance = null;

/**
 * Creates the single Chart instance on #pie-chart with empty initial data.
 * Wrapped in a typeof guard + try/catch so a CDN failure does not crash the app.
 * Requirements: 4.1, 4.5
 */
const initChart = () => {
  if (typeof Chart === 'undefined') {
    // Chart.js CDN failed to load — renderPieChart() will show placeholder instead
    return;
  }
  try {
    const ctx = document.getElementById('pie-chart').getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'pie',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
    });
  } catch (e) {
    // Canvas unavailable or Chart construction failed — chartInstance stays null
    chartInstance = null;
  }
};

// --- Theme ---

/**
 * Applies state.theme to document.body and updates the toggle button label.
 * Requirements: 10.1, 10.2, 10.4, 10.5
 */
const applyTheme = () => {
  document.body.dataset.theme = state.theme;
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = state.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
};

// --- Render All ---

/**
 * Calls every render function to bring the entire UI in sync with state.
 * Requirements: 5.3, 5.4
 */
const renderAll = () => {
  renderCategoryOptions();
  renderTransactionList();
  renderBalanceDisplay();
  renderPieChart();
};

// --- Bootstrap ---

/**
 * Entry point: restore persisted state, apply theme, initialize chart, render UI.
 * Requirements: 5.3, 5.4, 10.4, 10.5
 */
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  applyTheme();
  initChart();
  renderAll();
});

// --- Events ---

// #transaction-form submit
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.5, 7.5
document.getElementById('transaction-form').addEventListener('submit', (e) => {
  e.preventDefault();

  // Read and trim values
  const name = document.getElementById('item-name').value.trim();
  const amountRaw = document.getElementById('item-amount').value.trim();
  const category = document.getElementById('item-category').value;

  // Clear previous inline errors
  document.getElementById('item-name-error').textContent = '';
  document.getElementById('item-amount-error').textContent = '';
  document.getElementById('item-category-error').textContent = '';

  // Validate each field
  let isValid = true;

  // name: non-empty, max 100 chars (Req 1.1, 1.3)
  if (name === '') {
    document.getElementById('item-name-error').textContent = 'Item name is required.';
    isValid = false;
  } else if (name.length > 100) {
    document.getElementById('item-name-error').textContent = 'Item name must be 100 characters or fewer.';
    isValid = false;
  }

  // amount: numeric, 0.01 <= amount <= 9999999.99 (Req 1.1, 1.4, 1.5)
  const amount = parseFloat(amountRaw);
  if (amountRaw === '' || isNaN(amount)) {
    document.getElementById('item-amount-error').textContent = 'Amount is required.';
    isValid = false;
  } else if (amount <= 0) {
    document.getElementById('item-amount-error').textContent = 'Amount must be a positive number.';
    isValid = false;
  } else if (amount > 9999999.99) {
    document.getElementById('item-amount-error').textContent = 'Amount exceeds the maximum allowed value.';
    isValid = false;
  }

  // category: non-empty / not the placeholder (Req 1.1, 1.3)
  if (category === '') {
    document.getElementById('item-category-error').textContent = 'Please select a category.';
    isValid = false;
  }

  if (!isValid) return;

  // Create transaction (Req 1.2, 2.5, 7.5)
  const tx = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(),
    name,
    amount,
    category,
    timestamp: new Date().toISOString(),
  };

  // Prepend to state, persist, reset form, re-render (Req 1.2, 1.6)
  state.transactions.unshift(tx);
  saveTransactions();
  e.target.reset();
  renderAll();
});

// #category-form submit
document.getElementById('category-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('custom-category').value.trim();
  const errorEl = document.getElementById('custom-category-error');

  // Clear previous error
  errorEl.textContent = '';

  // Validate
  if (name.length === 0) {
    errorEl.textContent = 'Category name is required.';
    return;
  }
  if (name.length > 30) {
    errorEl.textContent = 'Category name must be 30 characters or fewer.';
    return;
  }
  const isDuplicate = state.categories.some(
    (cat) => cat.toLowerCase() === name.toLowerCase()
  );
  if (isDuplicate) {
    errorEl.textContent = 'This category already exists.';
    return;
  }

  state.categories.push(name);
  saveCategories();
  renderCategoryOptions();
  e.target.reset();
});

// #transaction-list click — delete (event delegation)
document.getElementById('transaction-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;

  const id = btn.dataset.id;
  if (!id) return;

  state.transactions = state.transactions.filter((tx) => tx.id !== id);
  saveTransactions();
  renderAll();
});

// #theme-toggle click
document.getElementById('theme-toggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveTheme();
  applyTheme();
});

// #set-limit-btn click
document.getElementById('set-limit-btn').addEventListener('click', () => {
  const raw = document.getElementById('spending-limit-input').value.trim();
  const errorEl = document.getElementById('spending-limit-error');
  errorEl.textContent = '';

  const value = parseFloat(raw);
  if (raw === '' || isNaN(value)) {
    errorEl.textContent = 'Please enter a valid number.';
    return;
  }
  if (value <= 0) {
    errorEl.textContent = 'Spending limit must be greater than zero.';
    return;
  }

  state.spendingLimit = value;
  saveSpendingLimit();
  renderBalanceDisplay();
});

// #month-filter change
document.getElementById('month-filter').addEventListener('change', (e) => {
  state.activeFilter = e.target.value || null;
  renderAll();
});

// #clear-filter-btn click
document.getElementById('clear-filter-btn').addEventListener('click', () => {
  state.activeFilter = null;
  document.getElementById('month-filter').value = '';
  renderAll();
});

// #sort-control change
document.getElementById('sort-control').addEventListener('change', (e) => {
  state.activeSort = e.target.value;
  renderTransactionList();
});
