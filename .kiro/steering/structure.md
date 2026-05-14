# Project Structure

```
/
├── expense-budget-visualizer/
│   └── index.html          # Main app entry point (HTML structure + CDN script tags)
├── css/
│   └── style.css           # All styles: layout, components, light/dark themes
├── js/
│   └── app.js              # All application logic: state, DOM manipulation, localStorage
├── assets/                 # Static assets (images, icons) — currently empty
├── .kiro/
│   ├── specs/              # Spec-driven development documents
│   │   └── expense-budget-visualizer/
│   │       ├── requirements.md
│   │       └── .config.kiro
│   └── steering/           # AI assistant guidance files (this folder)
└── README.md
```

## Conventions

### HTML (`index.html`)
- Single-page app — one HTML file, no routing
- Use semantic elements (`<main>`, `<section>`, `<form>`, `<ul>`, etc.)
- Link `css/style.css` in `<head>`; load `js/app.js` at end of `<body>` (or with `defer`)
- CDN libraries (e.g., Chart.js) are loaded via `<script>` tags here

### CSS (`style.css`)
- Theme switching is done by toggling a class (e.g., `dark` or `data-theme="dark"`) on `<body>`
- Use CSS custom properties (`--var-name`) for colors and theme-sensitive values
- No CSS preprocessors — plain CSS only

### JavaScript (`app.js`)
- Single file containing all logic: state management, DOM updates, localStorage read/write, event listeners
- Organize code into clearly commented sections (e.g., `// --- State ---`, `// --- DOM ---`, `// --- Storage ---`, `// --- Events ---`)
- Use `const`/`let`, arrow functions, template literals, and destructuring (ES6+)
- No classes required — module-level functions and a plain state object are preferred
- All localStorage operations must handle `try/catch` for parse errors and unavailability

### Data Model
Transactions stored in localStorage as a JSON array:
```json
[
  {
    "id": "uuid-or-timestamp",
    "name": "Coffee",
    "amount": 25000,
    "category": "Food",
    "timestamp": "2026-05-14T08:00:00.000Z"
  }
]
```

## Key Rules
- Do not split logic across multiple JS files — keep everything in `app.js`
- Do not move `index.html` out of `expense-budget-visualizer/`
- Do not introduce a build step, bundler, or package manager
- All UI updates must be reactive to state changes (re-render affected components on every add/delete)
