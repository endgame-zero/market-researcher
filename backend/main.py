import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from config import settings
from agents.research_agent import ResearchAgent
from agents.extraction_agent import ExtractionAgent
from agents.trend_agent import TrendAgent
from agents.brief_agent import BriefAgent

app = FastAPI(title="Market Research Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    query: str


def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def run_pipeline(query: str):
    try:
        using_mock = not settings.tavily_api_key or settings.tavily_api_key == "your_tavily_api_key_here"
        search_msg = "Loading demo sources (set TAVILY_API_KEY for live web search)..." if using_mock else "Searching the web for relevant sources..."

        yield sse("status", {"stage": "research", "message": search_msg})
        sources = await ResearchAgent().run(query)
        yield sse("sources", {"sources": sources})

        yield sse("status", {"stage": "extraction", "message": f"Extracting signals from {len(sources)} sources..."})
        signals = await ExtractionAgent().run(query, sources)
        yield sse("signals", {"signals": signals})

        yield sse("status", {"stage": "trends", "message": f"Clustering {len(signals)} signals into strategic trends..."})
        trends = await TrendAgent().run(query, signals)
        yield sse("trends", {"trends": trends})

        yield sse("status", {"stage": "brief", "message": "Generating executive research brief..."})
        brief = await BriefAgent().run(query, sources, signals, trends)
        yield sse("brief", {"brief": brief})

        yield sse("complete", {"message": "Research complete!"})

    except Exception as e:
        yield sse("error", {"message": str(e)})


@app.post("/api/research")
async def research(request: ResearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    return StreamingResponse(
        run_pipeline(request.query.strip()),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "tavily_configured": bool(
            settings.tavily_api_key and settings.tavily_api_key != "your_tavily_api_key_here"
        ),
        "llm_model": settings.llm_model,
    }
