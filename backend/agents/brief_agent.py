from openai import AsyncOpenAI
from config import settings


class BriefAgent:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.llm_base_url,
            api_key=settings.llm_api_key,
        )

    async def run(
        self,
        query: str,
        sources: list[dict],
        signals: list[dict],
        trends: list[dict],
    ) -> str:
        sources_text = "\n".join(
            f"- [{s['title']}]({s['url']}): {s['snippet']}" for s in sources
        )

        signals_text = "\n".join(
            f"- [{s['type'].upper()}] {s['content']}" for s in signals[:15]
        )

        trends_text = "\n".join(
            f"- **{t['theme']}** (confidence: {int(t['confidence'] * 100)}%): {t['description']}\n  Implications: {t['implications']}"
            for t in trends
        )

        prompt = f"""You are a senior market research analyst. Write a comprehensive market research brief in markdown.

Research topic: {query}

Sources consulted:
{sources_text}

Key signals extracted:
{signals_text}

Strategic trends identified:
{trends_text}

Write a professional brief with these exact sections:

# Market Research Brief: {query}

## Executive Summary
(2-3 crisp sentences summarizing the key finding)

## Market Overview
(General landscape, size, key dynamics)

## Key Trends & Insights
(Reference the trends above with data points from signals)

## Key Players & Products
(Notable companies, products, technologies mentioned)

## Opportunities & Challenges
(Balanced view of what the data reveals)

## Strategic Recommendations
(3-5 actionable recommendations based on the research)

## Sources
(List all sources with URLs)

Be specific. Use bullet points within sections. Include numbers and statistics where available. Write for a business executive audience."""

        response = await self.client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior market research analyst writing professional reports.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=3000,
        )

        return response.choices[0].message.content or "Brief generation failed."
