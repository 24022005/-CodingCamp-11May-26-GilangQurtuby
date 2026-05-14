# Implementation Plan: Expense Budget Visualizer

## Overview

Implement a single-page, client-side expense tracker across three files: `expense-budget-visualizer/index.html`, `css/style.css`, and `js/app.js`. The app uses vanilla JavaScript (ES6+), Chart.js via CDN, and `localStorage` for persistence. No build tools, no frameworks, no test files.

## Tasks

- [x] 1. Build the HTML skeleton (`expense-budget-visualizer/index.html`)
  - [x] 1.1 Write the full HTML structure with all required sections and IDs
    - Add `<header>` with `<h1>` and `#theme-toggle` button
    - Add `#input-section` containing `#transaction-form` (name, amount, category), `#category-form` (custom category), and `#spending-limit-section`
    - Add `#summary-section` containing `#balance-display`, `#filter-section` (month input + clear button), `#sort-section` (`#sort-control` select), `#transaction-list` (`<ul>`), and `#chart-container` (`<canvas id="pie-chart">` + `#chart-placeholder`)
    - Load Chart.js from CDN before `../js/app.js` (with `defer`)
    - Link `../css/style.css` in `<head>`
    - Set `data-theme="light"` on `<body>`
    - _Requirements: 1.1, 2.1, 4.5, 8.1, 9.1, 10.1_

- [x] 2. Implement base styles (`css/style.css`)
  - [x] 2.1 Define CSS custom properties and layout
    - Declare `--` color tokens for background, surface, text, accent, warning, and border for both light and dark themes using `[data-theme="dark"]` selector on `body`
    - Style `<header>`, `<main>` (two-column grid on wide screens, single column on narrow), `#input-section`, and `#summary-section`
    - _Requirements: 10.1, 10.2_
  - [x] 2.2 Style form controls, transaction list, and chart container
    - Style `<input>`, `<select>`, `<button>` elements using CSS custom properties
    - Style `#transaction-list` `<li>` items (name, amount, category, delete button) with scrollable container
    - Style `#chart-container` and `#chart-placeholder`
    - Style inline validation error `<span>` elements (red color, small font)
    - _Requirements: 1.1, 2.2, 4.5_
  - [x] 2.3 Implement spending limit warning style and theme toggle transition
    - Add `.balance-warning` class that applies a visually distinct style (e.g., red color or warning icon) to `#balance-display`
    - Ensure theme transitions apply within 300ms using CSS `transition` on color/background properties
    - _Requirements: 9.3, 9.4, 10.2_

- [x] 3. Implement state, storage, and initialization (`js/app.js`)
  - [x] 3.1 Define the `state` object and `localStorage` read/write functions
    - Declare `state` with `transactions`, `categories`, `theme`, `spendingLimit`, `activeFilter`, `activeSort` fields and their defaults
    - Implement `loadFromStorage()` — reads all four `ebv_*` keys, parses JSON, populates `state`; wraps each key in `try/catch` and falls back to defaults on error
    - Implement `saveTransactions()`, `saveCategories()`, `saveTheme()`, `saveSpendingLimit()` — each serializes the relevant `state` field and writes to `localStorage` inside `try/catch`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 10.3, 10.4, 10.5, 10.6_
  - [x] 3.2 Implement Chart.js initialization and `DOMContentLoaded` bootstrap
    - Declare `chartInstance = null`; implement `initChart()` that creates a single `Chart` instance on `#pie-chart` with empty data
    - Implement `applyTheme()` that sets `document.body.dataset.theme` to `state.theme` and updates the toggle button label
    - Implement `renderAll()` that calls all render functions
    - Wire `DOMContentLoaded`: call `loadFromStorage()` → `applyTheme()` → `initChart()` → `renderAll()`
    - Guard `renderPieChart()` with `if (!chartInstance)` to handle CDN failure gracefully
    - _Requirements: 5.3, 5.4, 10.4, 10.5_

- [ ] 4. Implement DOM render functions (`js/app.js`)
  - [x] 4.1 Implement `renderCategoryOptions()`
    - Clear and rebuild `<option>` elements in `#item-category` from `state.categories`
    - _Requirements: 6.2, 6.4_
  - [x] 4.2 Implement `renderTransactionList()`
    - Compute `filteredTransactions` by matching `timestamp` year+month against `state.activeFilter` (no filter = all transactions)
    - Apply `state.activeSort` to produce `sortedTransactions`; use insertion order as tie-breaker for equal sort keys
    - Clear `#transaction-list`; render one `<li>` per transaction showing name, amount (formatted with `toFixed(2)`), category, and a delete button with `data-id`
    - Show an empty-state message when the filtered list is empty
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 7.1, 7.6, 8.1, 8.2, 8.3, 8.4_
  - [x] 4.3 Implement `renderBalanceDisplay()`
    - Sum `filteredTransactions` amounts; update `#balance-amount` with `toFixed(2)`
    - Toggle `.balance-warning` class on `#balance-display` when `state.spendingLimit` is set and total strictly exceeds it
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.2, 9.3, 9.4_
  - [x] 4.4 Implement `renderPieChart()`
    - Aggregate `filteredTransactions` into a `Map<category, sum>`
    - If map is empty, hide `<canvas>` and show `#chart-placeholder`; otherwise show canvas and hide placeholder
    - Mutate `chartInstance.data.labels`, `chartInstance.data.datasets[0].data`, and `chartInstance.data.datasets[0].backgroundColor`, then call `chartInstance.update()`
    - Assign a consistent color per category (e.g., derived from index or a fixed palette)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.3_

- [ ] 5. Checkpoint — Verify rendering pipeline
  - Open `expense-budget-visualizer/index.html` in a browser, confirm the layout renders, the chart placeholder is visible, and no console errors appear. Ask the user if questions arise.

- [x] 6. Implement event handlers (`js/app.js`)
  - [x] 6.1 Implement `#transaction-form` submit handler
    - Read and trim `#item-name`, `#item-amount`, `#item-category`
    - Validate: name non-empty (max 100 chars), amount numeric and in [0.01, 9999999.99], category selected; show inline error `<span>` per field on failure and return early
    - On success: create a `Transaction` object (`id` via `Date.now().toString()` or `crypto.randomUUID()`, `timestamp` via `new Date().toISOString()`), `state.transactions.unshift(tx)`, call `saveTransactions()`, reset form, call `renderAll()`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.5, 7.5_
  - [x] 6.2 Implement `#category-form` submit handler
    - Read and trim `#custom-category`; validate 1–30 chars and case-insensitive uniqueness against `state.categories`; show inline error on failure
    - On success: `state.categories.push(name)`, call `saveCategories()`, call `renderCategoryOptions()`, reset field
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 6.3 Implement delete handler on `#transaction-list` (event delegation)
    - Listen for `click` on `#transaction-list`; check `event.target` for delete button with `data-id`
    - Filter `state.transactions` to remove the matching id, call `saveTransactions()`, call `renderAll()`
    - _Requirements: 2.3, 5.2_
  - [x] 6.4 Implement `#theme-toggle`, `#set-limit-btn`, filter, and sort handlers
    - `#theme-toggle` click: toggle `state.theme` between `'light'` and `'dark'`, call `saveTheme()`, call `applyTheme()`
    - `#set-limit-btn` click: validate `#spending-limit-input` is numeric and `> 0` (show inline error otherwise); on success set `state.spendingLimit`, call `saveSpendingLimit()`, call `renderBalanceDisplay()`
    - `#month-filter` change: set `state.activeFilter = event.target.value || null`, call `renderAll()`
    - `#clear-filter-btn` click: set `state.activeFilter = null`, clear `#month-filter` value, call `renderAll()`
    - `#sort-control` change: set `state.activeSort = event.target.value`, call `renderTransactionList()`
    - _Requirements: 7.1, 7.4, 8.1, 8.2, 9.1, 9.2, 9.5, 10.1, 10.2, 10.3, 10.4_

- [~] 7. Final checkpoint — Full integration verification
  - Ensure all features work end-to-end: add/delete transactions, category creation, month filter, sort, spending limit warning, theme toggle, and page reload persistence. Ask the user if questions arise.

## Notes

- No test files are created — this project has no build system or test runner
- Tasks marked with `*` would be optional test sub-tasks; none are included per project constraints
- All three files (`index.html`, `css/style.css`, `js/app.js`) are modified incrementally — each task builds on the previous
- Checkpoints (tasks 5 and 7) are manual browser verification steps, not automated tests
- The design's Correctness Properties (P1–P13) serve as a reference for validating behavior during manual verification

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2"] },
    { "id": 3, "tasks": ["2.3", "4.1", "4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3", "6.4"] }
  ]
}
```
