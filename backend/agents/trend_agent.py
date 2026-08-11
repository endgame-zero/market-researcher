import json
import re
from openai import AsyncOpenAI
from config import settings


def _extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass

    return {}


class TrendAgent:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.llm_base_url,
            api_key=settings.llm_api_key,
        )

    async def run(self, query: str, signals: list[dict]) -> list[dict]:
        signals_text = "\n".join(
            f"{i}. [{s['type'].upper()}] {s['content']} (confidence: {s['confidence']})"
            for i, s in enumerate(signals)
        )

        prompt = f"""You are a market research analyst. Cluster these signals into higher-level strategic trends.

Research topic: {query}

Signals:
{signals_text}

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{{
  "trends": [
    {{
      "theme": "Short theme name",
      "description": "2-3 sentence description of this trend",
      "confidence": 0.88,
      "signal_indices": [0, 2, 5],
      "implications": "What this means for the market or businesses"
    }}
  ]
}}

Identify 4-6 distinct trends. Each trend should synthesize multiple signals."""

        response = await self.client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a market research analyst. Respond only with valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2048,
        )

        raw = response.choices[0].message.content or ""
        data = _extract_json(raw)
        trends = data.get("trends", [])

        if not trends:
            trends = [
                {
                    "theme": "Market Overview",
                    "description": f"Analysis of {query} based on collected research signals.",
                    "confidence": 0.6,
                    "signal_indices": list(range(min(3, len(signals)))),
                    "implications": "Further research recommended.",
                }
            ]

        return trends
