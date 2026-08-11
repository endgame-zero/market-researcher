# Architecture

This document covers the backend design: the FastAPI application, the four agent classes, the data models, the SSE streaming protocol, and configuration.

---

## Overview

The backend is a single **FastAPI** application (`backend/main.py`) that exposes two HTTP endpoints. All heavy work happens inside an async generator — `run_pipeline` — which sequentially calls four agent classes and yields SSE events after each one completes.

```
Client (React)
    │
    │  POST /api/research  {"query": "..."}
    │  Accept: text/event-stream
    ▼
FastAPI  ──▶  run_pipeline(query)  [async generator]
                │
                ├──▶ ResearchAgent.run(query)      → sources[]
                │         │ SSE: status + sources
                │
                ├──▶ ExtractionAgent.run(query, sources)  → signals[]
                │         │ SSE: status + signals
                │
                ├──▶ TrendAgent.run(query, signals)       → trends[]
                │         │ SSE: status + trends
                │
                └──▶ BriefAgent.run(query, sources, signals, trends)  → brief str
                          │ SSE: status + brief + complete
```

---

## Endpoints

### `POST /api/research`

Accepts a JSON body and returns a streaming SSE response. The connection stays open until the pipeline completes or throws.

**Request body:**
```json
{ "query": "AI coding assistants 2025" }
```

**Response:** `Content-Type: text/event-stream`

Returns a sequence of SSE events (see [SSE event schema](#sse-event-schema) below).

**Error handling:** Any unhandled exception inside `run_pipeline` is caught and emitted as an `error` event before the stream closes. The client is never left with a hanging connection.

---

### `GET /api/health`

Returns the current server configuration so the frontend can display the correct mode badge.

**Response:**
```json
{
  "status": "ok",
  "tavily_configured": false,
  "llm_model": "meta-llama/Llama-3.3-70B-Instruct"
}
```

`tavily_configured` is `false` if the key is absent or still set to the placeholder string `"your_tavily_api_key_here"`.

---

## SSE event schema

Every event follows the SSE wire format:

```
event: <type>\n
data: <json>\n
\n
```

The frontend splits the stream on `\n\n` boundaries and parses each `event:` / `data:` pair.

### Event types

| Event | Payload | When emitted |
|---|---|---|
| `status` | `{ stage, message }` | Before each agent runs |
| `sources` | `{ sources: Source[] }` | After ResearchAgent |
| `signals` | `{ signals: Signal[] }` | After ExtractionAgent |
| `trends` | `{ trends: Trend[] }` | After TrendAgent |
| `brief` | `{ brief: string }` | After BriefAgent |
| `complete` | `{ message }` | Pipeline finished |
| `error` | `{ message }` | Any unhandled exception |

### Data models

**Source**
```typescript
{
  title:   string,   // Page title
  url:     string,   // Full URL
  snippet: string,   // Short excerpt (≤ 300 chars)
  content: string,   // Full scraped content (≤ 4000 chars)
  score:   number    // Tavily relevance score 0–1
}
```

**Signal**
```typescript
{
  type:       "fact" | "trend" | "player" | "use_case" | "opportunity" | "challenge",
  content:    string,   // The insight
  source_url: string,   // Origin URL
  confidence: number    // 0–1
}
```

**Trend**
```typescript
{
  theme:          string,     // Short theme name
  description:    string,     // 2–3 sentence description
  confidence:     number,     // 0–1
  signal_indices: number[],   // Indices into the signals array
  implications:   string      // Strategic implication
}
```

**Brief:** raw Markdown string.

---

## Agent classes

All agents live in `backend/agents/`. Each is a plain Python class with a single async `run()` method. They share no state and are instantiated fresh for every pipeline run.

---

### ResearchAgent (`agents/research_agent.py`)

**Responsibility:** Gather source material for the query.

**Live mode:** Calls the Tavily `AsyncTavilyClient.search()` with `search_depth="advanced"` and `include_raw_content=True`. Returns up to 5 sources, each with content truncated to 4,000 characters.

**Demo mode:** Returns five pre-written `MOCK_SOURCES` objects that cover typical market research dimensions — market overview, competitive landscape, technology trends, adoption patterns, and the regulatory environment. The mock titles are lightly personalised with the user's query string.

**Mode detection:** Checks `settings.tavily_api_key` at `__init__` time. If the key is absent or the placeholder, `self._use_mock = True` and the Tavily client is never instantiated.

---

### ExtractionAgent (`agents/extraction_agent.py`)

**Responsibility:** Extract discrete, typed signals from the source content.

**Process:**
1. Combines all source content into a single prompt string (capped at ~8,000 chars total)
2. Sends a chat completion request to the LLM with a system prompt instructing it to respond with valid JSON only
3. Asks for 10–20 signals in a structured schema
4. Parses the response with `_extract_json()` — a three-tier fallback: direct JSON parse → extract from markdown code block → regex scan for any JSON object

**Fallback:** If no valid JSON is returned, produces a single placeholder signal so downstream agents always have input.

**LLM settings:** `temperature=0.2` (low temperature for consistent structured output), `max_tokens=2048`.

---

### TrendAgent (`agents/trend_agent.py`)

**Responsibility:** Cluster signals into higher-level strategic themes.

**Process:**
1. Formats the signals array as a numbered list for the prompt
2. Asks the LLM to identify 4–6 distinct trends with confidence scores and signal index references
3. Parses with the same `_extract_json()` fallback

**Signal indices:** Each trend includes `signal_indices` — an array of integer positions into the signals array. The frontend uses these to show supporting signal excerpts inside each trend card.

**LLM settings:** `temperature=0.3`, `max_tokens=2048`.

---

### BriefAgent (`agents/brief_agent.py`)

**Responsibility:** Write the final executive brief.

**Process:**
1. Formats a structured prompt containing summaries of sources, signals (first 15), and trends
2. Asks the LLM to write a professional Markdown document with six fixed sections: Executive Summary, Market Overview, Key Trends & Insights, Key Players & Products, Opportunities & Challenges, Strategic Recommendations, Sources
3. Returns the raw Markdown string — no JSON parsing needed

**LLM settings:** `temperature=0.4` (slightly higher for narrative fluency), `max_tokens=3000`.

---

## LLM client

All three LLM agents use the `openai` Python SDK pointed at the HuggingFace Inference Router:

```python
from openai import AsyncOpenAI
client = AsyncOpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key="hf_...",
)
```

The router exposes an OpenAI-compatible `/chat/completions` endpoint, so no provider-specific SDK is needed. Swapping the model is a single `.env` change.

---

## Configuration (`config.py`)

Settings are loaded from `backend/.env` using `pydantic-settings`:

| Variable | Default | Description |
|---|---|---|
| `LLM_BASE_URL` | `https://router.huggingface.co/v1` | OpenAI-compatible LLM base URL |
| `LLM_MODEL` | `meta-llama/Llama-3.3-70B-Instruct` | Model identifier |
| `LLM_API_KEY` | *(required)* | HuggingFace API key |
| `TAVILY_API_KEY` | `your_tavily_api_key_here` | Tavily search key (optional) |

`extra = "ignore"` is set on the model config so any additional `.env` variables (e.g. embedding settings) do not raise validation errors.

---

## Streaming implementation

FastAPI's `StreamingResponse` with `media_type="text/event-stream"` is used. The response headers disable buffering so events reach the client immediately:

```python
headers={
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",   # Disables nginx proxy buffering
    "Connection": "keep-alive",
}
```

The generator `run_pipeline(query)` is `async` so it can `await` each agent without blocking the event loop. This means multiple research requests could technically run concurrently (though the frontend only ever has one in flight at a time).

---

## JSON extraction utility

Both ExtractionAgent and TrendAgent use a shared `_extract_json(text)` function:

```
1. json.loads(text)                          # Clean response
2. Regex: ```json ... ```                    # Markdown code block
3. Regex: first { ... } span in the text    # Embedded JSON
4. Return {}                                 # Fallback — agent handles downstream
```

This is necessary because instruction-tuned LLMs sometimes wrap JSON in prose or Markdown fences even when instructed not to.

---

## CORS

The FastAPI app allows requests from `http://localhost:5173` (Vite dev server). For production deployment, update `allow_origins` in `main.py` to your deployed frontend domain.

---

## Swapping the LLM provider

Because the LLM client uses the OpenAI SDK with a configurable `base_url`, any OpenAI-compatible provider can be used by updating `.env`:

```env
# OpenAI
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
LLM_API_KEY=sk-...

# Ollama (local)
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.3:70b
LLM_API_KEY=ollama
```

No code changes are required.
