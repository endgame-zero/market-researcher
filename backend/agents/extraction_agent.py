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


class ExtractionAgent:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.llm_base_url,
            api_key=settings.llm_api_key,
        )

    async def run(self, query: str, sources: list[dict]) -> list[dict]:
        combined = "\n\n---\n\n".join(
            f"Source: {s['title']}\nURL: {s['url']}\n\n{s['content']}"
            for s in sources
        )

        prompt = f"""You are a market research analyst. Extract structured signals from the content below.

Research topic: {query}

Content:
{combined[:8000]}

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{{
  "signals": [
    {{
      "type": "fact|trend|player|use_case|opportunity|challenge",
      "content": "specific insight or data point",
      "source_url": "url of the source",
      "confidence": 0.85
    }}
  ]
}}

Extract 10-20 signals. Focus on specific, actionable insights with numbers/stats where available."""

        response = await self.client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a market research analyst. Respond only with valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=2048,
        )

        raw = response.choices[0].message.content or ""
        data = _extract_json(raw)
        signals = data.get("signals", [])

        if not signals:
            signals = [
                {
                    "type": "fact",
                    "content": f"Research content collected for: {query}",
                    "source_url": sources[0]["url"] if sources else "",
                    "confidence": 0.5,
                }
            ]

        return signals
