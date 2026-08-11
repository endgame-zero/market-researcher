# Frontend

This document covers the React application: component tree, state management, SSE consumption, the design system, and key implementation details.

---

## Stack

| Tool | Version | Role |
|---|---|---|
| React | 18.3 | UI framework |
| Vite | 5.4 | Dev server and bundler |
| Tailwind CSS | 3.4 | Utility-first styling |
| react-markdown | 9.0 | Brief markdown rendering |
| lucide-react | 0.441 | Icon library |

---

## Component tree

```
App.jsx                         Root — state, SSE, layout
│
├── SearchBar.jsx               Query input + submit button
├── PipelineProgress.jsx        4-stage animated progress tracker
│
└── [tab content]
    ├── SourcesPanel.jsx        Bento grid of source cards
    │   └── SourceCard          Individual source card with favicon + score bar
    │
    ├── SignalsPanel.jsx        Type-grouped signal list
    │   ├── TypeGroup           Group header + list of SignalItems
    │   └── SignalItem          Single signal row with icon, content, confidence
    │
    ├── TrendsPanel.jsx         2-col trend cards with SVG rings
    │   ├── TrendCard           Card with accent stripe, ring, implications, signals
    │   └── ConfidenceRing      SVG donut chart (animated on mount)
    │
    └── BriefPanel.jsx          Markdown document with action bar
```

---

## State (`App.jsx`)

All application state lives in `App.jsx`. No external state manager is used.

| State variable | Type | Description |
|---|---|---|
| `query` | `string` | Current search input value |
| `isLoading` | `boolean` | True while SSE stream is open |
| `currentStage` | `string \| null` | Active pipeline stage ID |
| `statusMessage` | `string` | Human-readable stage message from backend |
| `isComplete` | `boolean` | True after `complete` event received |
| `activeTab` | `string` | Which tab is shown: `sources`, `signals`, `trends`, `brief` |
| `error` | `string \| null` | Error message if pipeline failed |
| `isMockMode` | `boolean` | Set by `/api/health` on mount |
| `sources` | `Source[]` | Array populated by `sources` SSE event |
| `signals` | `Signal[]` | Array populated by `signals` SSE event |
| `trends` | `Trend[]` | Array populated by `trends` SSE event |
| `brief` | `string` | Markdown string populated by `brief` SSE event |

`hasData` is a derived boolean: `sources.length > 0 || signals.length > 0 || trends.length > 0 || !!brief`. It controls whether the hero screen or the active research layout is rendered.

---

## SSE consumption

The frontend uses `fetch` with a `ReadableStream` rather than `EventSource` because `EventSource` only supports GET requests and the query must be sent in a POST body.

```js
const response = await fetch("/api/research", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

const reader  = response.body.getReader();
const decoder = new TextDecoder();
let buffer    = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const parts = buffer.split("\n\n");
  buffer = parts.pop() || "";           // Keep incomplete final chunk

  for (const part of parts) {
    // Parse event: and data: lines, then dispatch to state setters
  }
}
```

**Why the buffer split?** TCP can deliver SSE events split across multiple `read()` calls, or bundle several events in one call. Splitting on `\n\n` (the SSE event delimiter) and keeping the trailing incomplete chunk in `buffer` handles both cases correctly.

---

## Vite proxy

In development, the Vite dev server proxies `/api/*` to `http://localhost:8000` so the frontend and backend appear as the same origin, eliminating CORS issues during development:

```js
// vite.config.js
server: {
  proxy: {
    "/api": { target: "http://localhost:8000", changeOrigin: true }
  }
}
```

---

## Design system

### Design tokens (CSS custom properties)

Defined in `:root` in `src/index.css`:

| Token | Value | Usage |
|---|---|---|
| `--bg-deep` | `#020617` | Page background |
| `--bg-base` | `#0c1120` | Card backgrounds |
| `--bg-elevated` | `#131c30` | Elevated surfaces |
| `--surface` | `rgba(255,255,255,0.04)` | Subtle fills |
| `--surface-hover` | `rgba(255,255,255,0.07)` | Hover fills |
| `--border` | `rgba(255,255,255,0.07)` | Default borders |
| `--border-hover` | `rgba(255,255,255,0.14)` | Hover borders |
| `--accent` | `#6366f1` | Primary indigo |
| `--accent-light` | `#818cf8` | Lighter indigo for text |
| `--accent-glow` | `rgba(99,102,241,0.22)` | Glow shadows |
| `--accent-2` | `#8b5cf6` | Violet for gradients |
| `--text-1` | `#f1f5f9` | Primary text |
| `--text-2` | `#94a3b8` | Secondary text |
| `--text-3` | `#475569` | Muted/label text |
| `--success` | `#10b981` | Complete states |
| `--warning` | `#f59e0b` | Demo mode / mid confidence |
| `--danger` | `#ef4444` | Error / low confidence |
| `--easing` | `cubic-bezier(0.16,1,0.3,1)` | Spring-like easing |
| `--radius-card` | `16px` | Default card border radius |

### Typography

- **Body / UI:** `Inter` (300–800 weights) — loaded from Google Fonts
- **Data / numbers:** `Fira Code` (400–600 weights) — applied via `.mono` utility class; used for percentage scores, signal counts, word counts, and any tabular numeric data

### Utility classes

Defined in `@layer utilities` in `index.css`:

| Class | Effect |
|---|---|
| `.anim-fade-up` | Fade in + slide up 18px, 0.5s spring easing |
| `.anim-fade-in` | Fade in, 0.4s |
| `.anim-scale-in` | Scale from 0.94 + fade in |
| `.anim-float-1/2/3` | Slow ambient float (used on background orbs) |
| `.anim-glow` | Pulsing indigo box-shadow (pipeline active node) |
| `.gradient-text` | Indigo → violet → purple gradient clip text |
| `.gradient-text-emerald` | Teal → green gradient clip text |
| `.glass-card` | Dark card bg + border + hover lift transition |
| `.grid-bg` | 64px grid pattern overlay |
| `.btn-primary` | Indigo→violet gradient button with hover glow |
| `.mono` | Fira Code font, tabular-nums |
| `.tag` | Small pill badge (uppercase, small caps) |

### Animation keyframes

| Keyframe | Duration | Used on |
|---|---|---|
| `fadeInUp` | 0.5s | All panel content on tab switch |
| `fadeIn` | 0.4s | Hero section, tab content wrapper |
| `scaleIn` | 0.4s | Available for modal-style reveals |
| `float1/2/3` | 7–12s | Ambient background orbs |
| `glowPulse` | 2.2s | Active pipeline stage node |
| `shimmer` | — | Available for skeleton loading |
| `progressFill` | — | Connector bar fill (driven by inline width transition) |

Staggered animations are achieved by passing `animationDelay` as an inline style:
```jsx
<div style={{ animationDelay: `${index * 60}ms` }} className="anim-fade-up">
```

---

## Component details

### SearchBar

Accepts a `hero` prop (boolean). When true, the input and button use larger padding/font-size for the hero landing view. When false, compact sizing is used.

The gradient focus border is implemented as a sibling `div` with a gradient background positioned at `-inset-1px` (1px outside the input box), visible only when the parent has `:focus-within`. The input itself sits above it in stacking order with its own background, creating a gradient border illusion without requiring a gradient `border-color` (which CSS does not support natively).

### PipelineProgress

Receives `currentStage` (string), `statusMessage` (string), and `isComplete` (boolean).

Stage completion logic:
- `done` = `isComplete || stageIndex < currentIndex`
- `active` = `!isComplete && stage.id === currentStage`
- The connector bar between two stages fills (`width: 100%`) when the *next* stage has started, not the current one — this ensures the bar only fills once the work is confirmed done

### SourcesPanel — bento grid

The first source is wrapped in `md:col-span-2`, giving it a wider card on medium+ screens. On mobile, all cards stack to full width. On xl screens, the 3-column grid reduces the featured card back to 1 column (matching the others) so the grid balances without orphaned large cells.

Source card favicons use Google's favicon service:
```
https://www.google.com/s2/favicons?sz=32&domain={domain}
```
Each `Favicon` sub-component holds its own `err` state. On `onError`, it swaps to a `<Globe>` icon fallback. For demo mode sources (domain: `example.com`), the fallback fires immediately.

### SignalsPanel — grouping

Signals are grouped by their `type` field using `Array.reduce`. The display order is fixed: `fact → trend → player → opportunity → challenge → use_case`. Any unrecognised types are appended after.

### TrendsPanel — SVG rings

The `ConfidenceRing` component draws two `<circle>` elements on an SVG:
1. A static grey track (full circumference)
2. An animated progress arc using `stroke-dasharray` / `stroke-dashoffset`

The dashoffset starts at `circumference` (fully hidden) and transitions to `circumference - (pct/100 * circumference)` (partially drawn). The transition is triggered on mount via CSS: `transition: stroke-dashoffset 1.3s cubic-bezier(0.16,1,0.3,1) 0.25s`. The SVG is rotated -90° so the arc starts at the top rather than the right.

Ring colour thresholds: green ≥ 80%, amber ≥ 60%, red below 60%.

Each trend card's accent colour cycles through six presets defined in `CARD_ACCENTS` (indigo, violet, teal, amber, emerald, red), keyed by `index % 6`.

### BriefPanel

`react-markdown` renders the brief string into HTML. The `.prose-brief` CSS class in `index.css` styles all Markdown elements — headings, lists, links, code, blockquotes — without requiring `@tailwindcss/typography`.

A notable styling detail: every `h2` inside `.prose-brief` gets a coloured left-bar accent via a `::before` pseudo-element:
```css
.prose-brief h2::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 1.1em;
  background: linear-gradient(180deg, #6366f1, #8b5cf6);
  border-radius: 2px;
}
```
This avoids adding any wrapper divs around headings in the rendered Markdown.

The download handler creates a `Blob` from the brief string, creates a temporary `<a>` element, triggers a click, then immediately revokes the object URL. The filename is derived from the query:
```js
const slug = query.toLowerCase().replace(/\s+/g, "-").slice(0, 40);
// → "market-research-ai-coding-assistants-202.md"
```

---

## Extending the frontend

### Adding a new tab

1. Add an entry to the `TABS` array in `App.jsx`
2. Add a corresponding state variable and SSE event handler in `handleResearch`
3. Create a new panel component in `src/components/`
4. Add a `tabCount` case and render condition in the tab content section

### Changing the colour theme

All colour values are CSS custom properties in `:root`. Updating `--accent`, `--accent-light`, `--accent-2`, and `--accent-glow` in `index.css` will cascade through every component that uses the design tokens.

### Adding charts

The `TrendsPanel` already uses inline SVG for the confidence rings. For more complex charts (bar charts, line charts for trend confidence over time, etc.), `recharts` or `chart.js` (via `react-chartjs-2`) can be added. The design system's dark palette maps to: background `#0c1120`, grid lines `rgba(255,255,255,0.05)`, text `#94a3b8`.
