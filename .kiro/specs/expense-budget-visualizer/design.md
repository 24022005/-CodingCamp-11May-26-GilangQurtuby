# Design Document: Expense Budget Visualizer

## Overview

The Expense Budget Visualizer is a single-page, client-side web application that lets users record, categorize, and visualize personal expenses. It runs entirely in the browser — no server, no build step, no npm. All state is held in memory during a session and persisted to `localStorage` between sessions.

The application is structured as three files:

| File | Role |
|---|---|
| `expense-budget-visualizer/index.html` | HTML skeleton, CDN `<script>` tags |
| `css/style.css` | All styles, CSS custom properties, light/dark themes |
| `js/app.js` | All logic: state, DOM rendering, storage, event wiring |

Chart.js (loaded via CDN) handles pie chart rendering on a `<canvas>` element. No other external library is used.

---

## Architecture

The app follows a simple **reactive state → render** pattern without a framework:

```
User Action
    │
    ▼
Event Handler (app.js — Events section)
    │
    ▼
State Mutation  (app.js — State section)
    │
    ├──► Storage Write  (app.js — Storage section)
    │
    └──► Re-render affected DOM components  (app.js — DOM section)
              │
              ├── renderTransactionList()
              ├── renderBalanceDisplay()
              └── renderPieChart()
```

Every add/delete/filter/sort action mutates the in-memory `state` object, writes the relevant key to `localStorage`, then calls the render functions for affected components. There is no virtual DOM or diffing — components are re-rendered from scratch on each state change.

### Initialization Flow

```
DOMContentLoaded
    │
    ├── loadFromStorage()   ← reads ebv_transactions, ebv_categories,
    │                          ebv_theme, ebv_spending_limit
    │
    ├── applyTheme()
    │
    └── renderAll()         ← renderTransactionList()
                               renderBalanceDisplay()
                               renderPieChart()
```

---

## Components and Interfaces

### HTML Structure (index.html)

```
<body data-theme="light">
  <header>
    <h1>Expense Budget Visualizer</h1>
    <button id="theme-toggle">🌙 Dark Mode</button>
  </header>

  <main>
    <!-- Left / top panel -->
    <section id="input-section">
      <form id="transaction-form">
        <input  id="item-name"   type="text"   maxlength="100" />
        <input  id="item-amount" type="number" />
        <select id="item-category"></select>
        <button type="submit">Add Transaction</button>
      </form>

      <!-- Custom category sub-form -->
      <form id="category-form">
        <input id="custom-category" type="text" maxlength="30" />
        <button type="submit">Add Category</button>
      </form>

      <!-- Spending limit control -->
      <div id="spending-limit-section">
        <input id="spending-limit-input" type="number" />
        <button id="set-limit-btn">Set Limit</button>
      </div>
    </section>

    <!-- Right / bottom panel -->
    <section id="summary-section">
      <div id="balance-display">Total: <span id="balance-amount">0.00</span></div>

      <!-- Month filter -->
      <div id="filter-section">
        <input id="month-filter" type="month" />
        <button id="clear-filter-btn">Clear Filter</button>
      </div>

      <!-- Sort control -->
      <div id="sort-section">
        <select id="sort-control">
          <option value="none">None</option>
          <option value="amount-asc">Amount ↑</option>
          <option value="amount-desc">Amount ↓</option>
          <option value="category-az">Category A–Z</option>
          <option value="category-za">Category Z–A</option>
        </select>
      </div>

      <!-- Transaction list -->
      <ul id="transaction-list"></ul>

      <!-- Pie chart -->
      <div id="chart-container">
        <canvas id="pie-chart"></canvas>
        <p id="chart-placeholder" hidden>No data available</p>
      </div>
    </section>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="../js/app.js" defer></script>
</body>
```

### JavaScript Module Sections (app.js)

#### `// --- State ---`

```js
const state = {
  transactions: [],       // Array<Transaction> — full list, insertion order
  categories: ['Food', 'Transport', 'Fun'],  // Array<string>
  theme: 'light',         // 'light' | 'dark'
  spendingLimit: null,    // number | null
  activeFilter: null,     // 'YYYY-MM' string | null
  activeSort: 'none',     // 'none' | 'amount-asc' | 'amount-desc' | 'category-az' | 'category-za'
};
```

#### `// --- Storage ---`

| Function | Description |
|---|---|
| `loadFromStorage()` | Reads all four `localStorage` keys; populates `state`; handles `try/catch` for parse errors |
| `saveTransactions()` | Serializes `state.transactions` → `ebv_transactions` |
| `saveCategories()` | Serializes `state.categories` → `ebv_categories` |
| `saveTheme()` | Writes `state.theme` → `ebv_theme` |
| `saveSpendingLimit()` | Writes `state.spendingLimit` → `ebv_spending_limit` |

All writes are wrapped in `try/catch`. On read failure the relevant state field is left at its default.

#### `// --- DOM ---`

| Function | Description |
|---|---|
| `renderTransactionList()` | Clears `#transaction-list`, applies filter + sort to `state.transactions`, renders `<li>` items or empty-state message |
| `renderBalanceDisplay()` | Sums filtered transactions; updates `#balance-amount`; toggles warning class if `spendingLimit` exceeded |
| `renderPieChart()` | Aggregates filtered transactions by category; calls `chart.update()` or shows `#chart-placeholder` |
| `renderCategoryOptions()` | Rebuilds `<option>` elements in `#item-category` from `state.categories` |
| `applyTheme()` | Sets `document.body.dataset.theme` to `state.theme` |
| `renderAll()` | Calls all render functions above |

#### `// --- Events ---`

| Event | Handler |
|---|---|
| `#transaction-form` submit | Validates fields → creates transaction → `state.transactions.unshift(tx)` → `saveTransactions()` → `renderAll()` |
| `#category-form` submit | Validates name → `state.categories.push(name)` → `saveCategories()` → `renderCategoryOptions()` |
| `#transaction-list` click (delete) | Removes transaction by id → `saveTransactions()` → `renderAll()` |
| `#theme-toggle` click | Toggles `state.theme` → `saveTheme()` → `applyTheme()` |
| `#set-limit-btn` click | Validates limit → `state.spendingLimit = value` → `saveSpendingLimit()` → `renderBalanceDisplay()` |
| `#month-filter` change | `state.activeFilter = value` → `renderAll()` |
| `#clear-filter-btn` click | `state.activeFilter = null` → `renderAll()` |
| `#sort-control` change | `state.activeSort = value` → `renderTransactionList()` |

### Chart.js Integration

A single `Chart` instance is created once at initialization:

```js
let chartInstance = null;

const initChart = () => {
  const ctx = document.getElementById('pie-chart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
  });
};
```

`renderPieChart()` mutates `chartInstance.data` and calls `chartInstance.update()` rather than destroying and recreating the chart on every render.

---

## Data Models

### Transaction

```ts
interface Transaction {
  id: string;          // Date.now().toString() or crypto.randomUUID()
  name: string;        // 1–100 characters
  amount: number;      // 0.01–9,999,999.99 (stored as a JS number)
  category: string;    // must exist in state.categories
  timestamp: string;   // ISO 8601 — new Date().toISOString()
}
```

### localStorage Keys

| Key | Type | Default |
|---|---|---|
| `ebv_transactions` | `JSON` array of `Transaction` | `[]` |
| `ebv_categories` | `JSON` array of strings | `['Food','Transport','Fun']` |
| `ebv_theme` | `'light'` \| `'dark'` | `'light'` |
| `ebv_spending_limit` | number or `null` | `null` |

### Derived / Computed Values

These are never stored; they are computed on every render:

| Value | Derivation |
|---|---|
| `filteredTransactions` | `state.transactions` filtered by `state.activeFilter` (month/year match on `timestamp`) |
| `sortedTransactions` | `filteredTransactions` sorted by `state.activeSort`; tie-broken by insertion order |
| `totalBalance` | `sum(filteredTransactions.map(t => t.amount))` |
| `categoryTotals` | `Map<category, sum>` over `filteredTransactions` |

### Validation Rules

| Field | Rule |
|---|---|
| `name` | Non-empty string, max 100 chars |
| `amount` | Numeric, `0.01 ≤ amount ≤ 9,999,999.99` |
| `category` | Must be selected (non-empty) |
| `customCategory` | 1–30 chars, case-insensitive unique among `state.categories` |
| `spendingLimit` | Numeric, `> 0` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid transaction addition grows the list

*For any* transaction list and any valid transaction (non-empty name, amount in [0.01, 9999999.99], existing category), adding that transaction to the list should result in the list length increasing by exactly one and the new transaction appearing in the list.

**Validates: Requirements 1.2, 2.1**

### Property 2: Invalid transactions are rejected and leave state unchanged

*For any* transaction list, submitting a transaction with an empty name, a non-positive amount, an amount exceeding 9,999,999.99, or no category selected should leave the transaction list unchanged (same length, same contents).

**Validates: Requirements 1.3, 1.4, 1.5**

### Property 3: Delete removes exactly the targeted transaction

*For any* non-empty transaction list, deleting the transaction with a given id should result in a list that contains every original transaction except the one with that id, and the list length should decrease by exactly one.

**Validates: Requirements 2.3**

### Property 4: Balance equals sum of filtered transactions

*For any* set of transactions and any active filter (including no filter), the displayed balance should equal the arithmetic sum of the `amount` fields of all transactions that pass the filter, rounded to 2 decimal places.

**Validates: Requirements 3.1, 3.2, 7.2**

### Property 5: Pie chart segments are proportional to category totals

*For any* non-empty set of filtered transactions, each category's chart segment value should equal the sum of amounts for that category, and the sum of all segment values should equal the total balance.

**Validates: Requirements 4.1, 4.2, 7.3**

### Property 6: localStorage round-trip preserves transaction data

*For any* list of valid transactions written to `ebv_transactions`, reading and parsing that key should produce an array of transactions equal (by id, name, amount, category, timestamp) to the original list.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Corrupt localStorage is discarded and app initializes to empty state

*For any* string that is not valid JSON stored in `ebv_transactions`, initializing the app should result in an empty transaction list, a balance of 0.00, and the pie chart placeholder state — without throwing an unhandled error.

**Validates: Requirements 5.4**

### Property 8: Valid custom category is added and persisted

*For any* category name between 1 and 30 characters that does not already exist in the category list (case-insensitive), adding it should result in the category appearing in the selector and in `ebv_categories` in localStorage.

**Validates: Requirements 6.2, 6.4**

### Property 9: Invalid custom category is rejected

*For any* category name that is empty, exceeds 30 characters, or duplicates an existing category name (case-insensitive), the submission should be rejected and the category list should remain unchanged.

**Validates: Requirements 6.3**

### Property 10: Month filter restricts visible transactions to the selected month/year

*For any* transaction list and any selected month/year, every transaction displayed in the list should have a `timestamp` whose year and month match the selected filter, and no transaction from a different month/year should appear.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 11: Sorting produces a stable, correctly ordered list

*For any* transaction list and any sort option (amount-asc, amount-desc, category-az, category-za), the resulting displayed order should satisfy the sort criterion, and transactions with equal sort keys should appear in their original insertion order (oldest first).

**Validates: Requirements 8.2**

### Property 12: Spending limit warning is applied when and only when total exceeds limit

*For any* transaction list and any positive spending limit, the balance display should carry the warning indicator if and only if the total balance strictly exceeds the spending limit.

**Validates: Requirements 9.3, 9.4**

### Property 13: Theme preference round-trip

*For any* theme value ('light' or 'dark'), writing it to `ebv_theme` and then re-initializing the app should result in that theme being applied to the document body.

**Validates: Requirements 10.3, 10.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable (private browsing, quota exceeded) | All storage calls are wrapped in `try/catch`; the app continues in-memory without persisting |
| Corrupt `ebv_transactions` JSON | `catch` block resets `state.transactions = []`; renders empty state |
| Corrupt `ebv_categories` JSON | `catch` block resets `state.categories` to defaults `['Food','Transport','Fun']` |
| Corrupt `ebv_spending_limit` | `catch` block sets `state.spendingLimit = null` |
| Corrupt `ebv_theme` | `catch` block sets `state.theme = 'light'` |
| Form validation failure | Inline error `<span>` elements adjacent to each invalid field are shown; form is not submitted |
| Chart.js not loaded (CDN failure) | `renderPieChart()` guards with `if (!chartInstance)` and shows the placeholder text instead |
| Amount precision | Amounts are stored as JS numbers; `toFixed(2)` is applied only at display time |

---

## Testing Strategy

Because this project has no build system or test runner, the testing strategy is organized into two tiers that can be executed manually or with a lightweight in-browser test harness (e.g., a `test.html` file that imports a test utility).

### Unit / Example-Based Tests

Focus on concrete scenarios and edge cases:

- Form validation: empty name, zero amount, negative amount, amount = 9,999,999.99 (valid boundary), amount = 10,000,000 (invalid boundary)
- Custom category: duplicate detection (case-insensitive), 30-char limit, 31-char rejection
- `loadFromStorage()` with valid JSON, empty string, and malformed JSON for each key
- Theme toggle: verify `document.body.dataset.theme` flips between `'light'` and `'dark'`
- Month filter: transactions from different months; verify only the correct month appears
- Sort: list with equal amounts (tie-breaker by insertion order)
- Spending limit: total exactly at limit (no warning), total one cent above limit (warning)

### Property-Based Tests

Each property from the Correctness Properties section maps to one property-based test. A library such as [fast-check](https://github.com/dubzzz/fast-check) (loaded via CDN in a test HTML file) is suitable for this project since it requires no build step.

**Configuration**: minimum 100 iterations per property test.

**Tag format**: `// Feature: expense-budget-visualizer, Property N: <property text>`

| Property | Generator inputs | What is asserted |
|---|---|---|
| P1 — Valid addition grows list | Random valid transaction objects | `list.length === original.length + 1` and `list.includes(tx)` |
| P2 — Invalid transactions rejected | Random invalid field combinations | `list.length === original.length` |
| P3 — Delete removes exactly one | Random list + random target id | `list.length === original.length - 1` and `!list.find(t => t.id === id)` |
| P4 — Balance equals sum | Random transaction arrays + random filter | `balance === sum(filtered.map(t => t.amount))` |
| P5 — Chart proportional | Random non-empty transaction arrays | `sum(segmentValues) === totalBalance` |
| P6 — localStorage round-trip | Random valid transaction arrays | `parse(serialize(txs))` deep-equals `txs` |
| P7 — Corrupt data → empty state | Random non-JSON strings | `state.transactions.length === 0` and no thrown error |
| P8 — Valid category added | Random valid category names | Category appears in list and in `ebv_categories` |
| P9 — Invalid category rejected | Random invalid names (empty / >30 / duplicate) | Category list unchanged |
| P10 — Month filter restricts | Random transactions across months + random filter | All displayed transactions match selected month/year |
| P11 — Sort stability | Random lists with duplicate sort keys | Sorted order satisfies criterion; ties in insertion order |
| P12 — Spending limit warning | Random totals + random limits | Warning iff `total > limit` |
| P13 — Theme round-trip | `'light'` and `'dark'` | `body.dataset.theme === storedTheme` after re-init |
