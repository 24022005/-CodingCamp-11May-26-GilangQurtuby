# Tech Stack

## Core Technologies

- **HTML5** — semantic markup, single entry point (`expense-budget-visualizer/index.html`)
- **CSS3** — custom styling (`css/style.css`), supports light/dark theme via class toggling
- **Vanilla JavaScript (ES6+)** — no frameworks, no build tools (`js/app.js`)

## Libraries & External Dependencies

- No npm packages or bundlers — all dependencies (if any) are loaded via CDN `<script>` tags in `index.html`
- Pie chart rendering: use the **Canvas API** or a CDN-loaded library (e.g., Chart.js) — do not introduce npm dependencies

## Data Layer

- **`localStorage`** — sole persistence mechanism; no backend, no cookies, no IndexedDB
- Storage keys should be namespaced (e.g., `ebv_transactions`, `ebv_categories`, `ebv_theme`, `ebv_spending_limit`)

## Browser Support

- Modern evergreen browsers (Chrome, Firefox, Edge, Safari)
- No transpilation or polyfills required

## Common Commands

This project has no build system. Open directly in a browser:

```bash
# Open the app in the default browser (Linux)
xdg-open expense-budget-visualizer/index.html

# Or serve locally to avoid file:// restrictions (optional)
npx serve .
# then navigate to http://localhost:3000/expense-budget-visualizer/
```

No install, compile, or test commands are needed.
