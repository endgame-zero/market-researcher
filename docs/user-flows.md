# User Flows

This document describes every major user journey through the Market Research Assistant, including the states the UI passes through, what the user sees, and the actions available at each step.

---

## Flow 1 — First visit (empty state)

**Entry point:** User opens `http://localhost:5173` for the first time.

**What happens:**
1. The app fetches `GET /api/health` in the background to determine whether Tavily is configured. If not, a **Demo mode** badge appears in the header.
2. The **hero screen** is shown: animated ambient orbs, a grid background, a large gradient headline, a prominent search bar, and five example topic chips.

**What the user sees:**
- Headline: *"Market Intelligence, on demand."*
- Sub-copy describing the 4-stage pipeline
- Search bar with placeholder: *"e.g. AI coding assistants 2025, EV battery technology trends…"*
- Example chips: pre-populated topics the user can click to fill the search bar

**Available actions:**
- Type a custom topic into the search bar
- Click an example chip (fills the search bar; user still presses Research to submit)
- Press **Enter** or click the **Research** button to begin

---

## Flow 2 — Running a research query

**Trigger:** User types a topic and presses Enter or clicks Research.

### Stage 1 — Research (web search)

**UI transition:**
- Hero layout collapses; a compact search bar appears at the top
- The **Pipeline Progress** tracker appears below it
- The **Research** node on the tracker gains a glowing indigo ring and pulses
- Status message: *"Searching the web for relevant sources…"* (or *"Loading demo sources…"* in demo mode)
- The **Sources** tab is activated

**What arrives:**  
An SSE `sources` event with up to 5 source objects. The Sources panel renders immediately:
- A bento grid where the first (highest-relevance) source spans two columns
- Each card shows: favicon, domain, title, excerpt, and a colour-coded relevance score bar
- Cards animate in with a staggered fade-up

---

### Stage 2 — Extraction (signal mining)

**UI transition:**
- The connector bar between Research and Extraction fills with a green glow
- The Research node turns emerald with a check icon
- The Extraction node begins pulsing
- Status message: *"Extracting signals from 5 sources…"*
- The dashboard auto-switches to the **Signals** tab

**What arrives:**  
An SSE `signals` event with 10–20 typed signal objects. The Signals panel renders:
- Signals grouped by type: Fact, Trend, Player, Opportunity, Challenge, Use Case
- Each group has a header with a type-specific icon and count badge
- Each signal shows its content, source domain (linked), and a 5-dot confidence indicator
- Items animate in with per-item stagger delays

**Signal types and their meaning:**

| Type | Meaning |
|---|---|
| Fact | Verified statistic or data point |
| Trend | Directional movement in the market |
| Player | Key company, product, or person |
| Opportunity | Gap or growth area identified |
| Challenge | Barrier, risk, or friction |
| Use Case | Specific application or adoption pattern |

---

### Stage 3 — Trends (clustering)

**UI transition:**
- Extraction node turns emerald; Trends node begins pulsing
- Status message: *"Clustering N signals into strategic trends…"*
- Dashboard auto-switches to the **Trends** tab

**What arrives:**  
An SSE `trends` event with 4–6 trend objects. The Trends panel renders:
- Two-column grid of trend cards
- Each card has a unique accent colour (cycles through 6: indigo, violet, teal, amber, emerald, red)
- An animated SVG donut ring shows confidence percentage with a colour-coded glow (green ≥ 80%, amber ≥ 60%, red below)
- A **Strategic Implication** callout box summarises what this trend means for the market
- Up to 3 supporting signal excerpts are listed at the bottom of each card

---

### Stage 4 — Brief (report generation)

**UI transition:**
- Trends node turns emerald; Brief node begins pulsing
- Status message: *"Generating executive research brief…"*
- Dashboard auto-switches to the **Brief** tab

**What arrives:**  
An SSE `brief` event with a full Markdown document. The Brief panel renders:
- A stats bar: word count, estimated read time, and a "Ready" badge
- The brief document in a dark paper-style container with a gradient accent stripe at the top
- Markdown rendered with styled headings (each `h2` gets an indigo left-bar accent), bullet points, bold, links, and code spans
- A **Download .md** button in both the action bar and the document footer

**Pipeline completion:**
- All four nodes turn emerald
- The connector bars are fully filled
- Status message clears; a **Done** badge appears on the pipeline tracker
- The user can now freely navigate between all four tabs

---

## Flow 3 — Running a second query

**Trigger:** User types a new topic into the compact search bar (visible at the top after any research run) and presses Research.

**What happens:**
- All existing data (sources, signals, trends, brief) is cleared
- The pipeline resets: all nodes return to their pending state
- The Sources tab is re-activated
- The pipeline runs from scratch with the new topic

The user does not need to return to the hero screen; the compact search bar is always accessible after the first query.

---

## Flow 4 — Downloading the brief

**Trigger:** User clicks **Download .md** in the Brief tab.

**What happens:**
1. The full Markdown text of the brief is wrapped in a `Blob` with `text/markdown` MIME type
2. A temporary `<a>` element is created and programmatically clicked
3. The browser downloads the file with a name derived from the research query, e.g. `market-research-ai-coding-assistants-2025.md`
4. The object URL is immediately revoked to free memory

**Result:** A portable Markdown file the user can open in any text editor, Obsidian, Notion, or share with colleagues.

---

## Flow 5 — Error during research

**Trigger:** The backend throws an exception at any pipeline stage (network failure, LLM timeout, invalid API key, etc.).

**What the user sees:**
- An SSE `error` event is received
- A red alert banner appears below the search bar:
  - Title: *"Research failed"*
  - Body: the raw error message from the backend
- The pipeline tracker freezes at whatever stage failed
- Any data already received (e.g. sources if extraction failed) remains visible in its tab

**Recovery:** The user can edit the query and click Research again. All state is reset on the next submission.

---

## Flow 6 — Demo mode (no Tavily key)

**Trigger:** `TAVILY_API_KEY` is absent or set to the placeholder value in `backend/.env`.

**Differences from live mode:**
- The header shows a yellow **Demo mode** badge
- During the Research stage, the status message reads: *"Loading demo sources (set TAVILY_API_KEY for live web search)…"*
- Five pre-written source objects are returned instead of live Tavily results
- The LLM agents (Extraction, Trends, Brief) still run on the mock source content — all AI output is real
- Source cards display `example.com` domains; favicons fall back to the Globe icon

**Upgrading to live mode:** Add a valid Tavily API key to `backend/.env` and restart the backend. No frontend changes required.

---

## UI state matrix

| Condition | Hero visible | Search bar | Pipeline | Tabs |
|---|---|---|---|---|
| First visit, no query | Yes | Inside hero | Hidden | Hidden |
| Query submitted, loading | No | Compact, top | Visible, animating | Visible, auto-switching |
| Query complete | No | Compact, top | Visible, all green | Visible, user-controlled |
| Error occurred | No | Compact, top | Visible, frozen | Visible (partial data) |
| Second query submitted | No | Compact, top | Resets and re-runs | Resets to Sources tab |
