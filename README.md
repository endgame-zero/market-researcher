# Market Research Assistant

An agentic market research tool that takes a plain-language topic, runs a four-stage AI pipeline, and delivers a structured executive brief — complete with ranked sources, extracted signals, strategic trends, and a downloadable markdown report.

Built with a **React + FastAPI** stack, real-time **Server-Sent Events** streaming, and **Llama 3.3 70B** via the HuggingFace Inference Router.

---

## How it works

```
User query
    │
    ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Research Agent │────▶│ Extraction Agent │────▶│  Trend Agent   │────▶│ Brief Agent  │
│  Tavily search  │     │  LLM signal mine │     │  LLM cluster   │     │  LLM report  │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └──────────────┘
    5 sources               10–20 signals           4–6 trends            Markdown brief
         │                       │                       │                      │
         └───────────────────────┴───────────────────────┴──────────────────────┘
                                     SSE stream → React dashboard
```

Each stage streams results to the frontend immediately — you see sources appear before extraction even begins.

---

## Features

- **4-stage agentic pipeline** — Research → Extraction → Trends → Brief, each powered by a dedicated LLM agent
- **Real-time streaming** — results appear live via Server-Sent Events as each stage completes
- **Bento grid dashboard** — tabbed UI with Sources, Signals, Trends, and Brief panels
- **Typed signal extraction** — facts, trends, players, use cases, opportunities, and challenges
- **SVG confidence rings** — animated visual confidence scores on every trend card
- **Downloadable brief** — export the executive report as a Markdown file
- **Demo mode** — works without a Tavily API key using rich mock data; swap in a real key for live web search

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.11+ |
| LLM | Llama 3.3 70B via HuggingFace Inference Router (OpenAI-compatible) |
| Web search | Tavily API (optional — demo mode fallback built in) |
| Streaming | Server-Sent Events over HTTP |
| Fonts | Inter (UI), Fira Code (data/numbers) |

---

## Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- npm
- A HuggingFace account with API access (free tier works)
- A Tavily API key for live web search (optional — see Demo mode below)

---

## Setup

### 1. Clone / navigate to the project

```bash
cd "market research"
```

### 2. Configure environment variables

Open `backend/.env` and fill in your keys:

```env
# LLM — HuggingFace Inference Router (OpenAI-compatible)
LLM_BASE_URL=https://router.huggingface.co/v1
LLM_MODEL=meta-llama/Llama-3.3-70B-Instruct
LLM_API_KEY=hf_your_key_here

# Web search (optional — see Demo mode below)
TAVILY_API_KEY=tvly_your_key_here
```

Get a free HuggingFace key at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).  
Get a free Tavily key at [tavily.com](https://tavily.com) (1,000 searches/month on the free tier).

### 3. Install and run

**One command:**

```bash
bash start.sh
```

This installs all Python and Node dependencies, then starts both servers. The script runs backend and frontend concurrently and exits both cleanly on `Ctrl+C`.

**Or run servers individually:**

```bash
# Terminal 1 — backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

### 4. Open the app

```
http://localhost:5173
```

The backend API is available at `http://localhost:8000`. Visit `/api/health` to confirm configuration status.

---

## Demo mode

If `TAVILY_API_KEY` is not set (or left as the placeholder), the app automatically switches to **demo mode**:

- Five rich pre-written sources are used instead of live web results
- The LLM agents still run on real data — signal extraction, trend clustering, and brief generation all execute normally
- A "Demo mode" badge appears in the header
- The status message during research reads: *"Loading demo sources…"*

To switch to live search, add your Tavily key to `backend/.env` and restart the backend.

---

## Project structure

```
market research/
├── backend/
│   ├── main.py              # FastAPI app, SSE streaming endpoint
│   ├── config.py            # Settings loaded from .env
│   ├── requirements.txt
│   ├── .env                 # API keys (not committed)
│   └── agents/
│       ├── research_agent.py    # Tavily search + mock fallback
│       ├── extraction_agent.py  # LLM signal extraction
│       ├── trend_agent.py       # LLM trend clustering
│       └── brief_agent.py       # LLM executive brief
├── frontend/
│   ├── index.html
│   ├── vite.config.js       # Dev proxy: /api → localhost:8000
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.jsx          # Root component, SSE consumer, state
│   │   ├── index.css        # Design tokens, animations, prose styles
│   │   └── components/
│   │       ├── SearchBar.jsx
│   │       ├── PipelineProgress.jsx
│   │       ├── SourcesPanel.jsx
│   │       ├── SignalsPanel.jsx
│   │       ├── TrendsPanel.jsx
│   │       └── BriefPanel.jsx
├── docs/
│   ├── user-flows.md        # Step-by-step user journey documentation
│   ├── architecture.md      # Backend design, agents, data models
│   └── frontend.md          # Component tree, state, design system
├── start.sh                 # One-command launcher
└── README.md
```

---

## API reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/research` | Start a research pipeline. Body: `{"query": "string"}`. Returns SSE stream. |
| `GET` | `/api/health` | Returns server status, LLM model, and whether Tavily is configured. |

See `docs/architecture.md` for the full SSE event schema.

---

## Docs

- [User flows](docs/user-flows.md) — step-by-step journeys through the application
- [Architecture](docs/architecture.md) — backend pipeline, agents, data models, SSE protocol
- [Frontend](docs/frontend.md) — component tree, state management, design system
