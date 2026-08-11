from tavily import AsyncTavilyClient
from config import settings

MOCK_SOURCES = [
    {
        "title": "Global Market Overview and Industry Trends 2025",
        "url": "https://example.com/market-overview-2025",
        "snippet": "The global market is experiencing rapid transformation driven by AI adoption, shifting consumer preferences, and new regulatory frameworks. Key players are consolidating while startups continue to disrupt traditional segments.",
        "content": "The global market is experiencing rapid transformation driven by AI adoption, shifting consumer preferences, and new regulatory frameworks. Key players are consolidating while startups continue to disrupt traditional segments. Market size reached $450B in 2024, projected to grow at 18% CAGR through 2029. North America leads with 38% market share, followed by Europe at 27% and Asia-Pacific at 29%. Enterprise adoption increased 64% YoY. SMB penetration remains low at 23%, representing a significant growth opportunity. Top challenges include integration complexity (cited by 71% of enterprises), data privacy concerns (68%), and high upfront costs (55%). Leading vendors invested heavily in no-code/low-code capabilities to lower adoption barriers.",
        "score": 0.91,
    },
    {
        "title": "Competitive Landscape: Key Players and Market Share",
        "url": "https://example.com/competitive-landscape",
        "snippet": "The competitive landscape is dominated by three major players controlling 58% of total market share, while a fragmented long tail of 200+ vendors competes for the remainder. Recent M&A activity signals further consolidation.",
        "content": "The competitive landscape is dominated by three major players controlling 58% of total market share, while a fragmented long tail of 200+ vendors competes for the remainder. Recent M&A activity signals further consolidation. Company A holds 24% share with $12B ARR and 40% YoY growth. Company B at 19% share focuses on enterprise vertical with $9.5B ARR. Company C at 15% leads SMB segment with highest NPS score of 72. Venture funding reached $8.2B in 2024, a 34% increase from 2023. Top-funded startups are targeting AI-native architecture, real-time data processing, and vertical-specific solutions. Geographic expansion into Southeast Asia and Latin America is a common growth vector.",
        "score": 0.87,
    },
    {
        "title": "Technology Trends Reshaping the Industry",
        "url": "https://example.com/tech-trends",
        "snippet": "AI and machine learning are fundamentally reshaping product capabilities. Generative AI features saw 312% adoption growth in 2024. Edge computing and real-time processing are becoming table stakes for enterprise buyers.",
        "content": "AI and machine learning are fundamentally reshaping product capabilities. Generative AI features saw 312% adoption growth in 2024. Edge computing and real-time processing are becoming table stakes for enterprise buyers. API-first architectures enable 3x faster integrations. Companies with AI-native products command 2.4x higher valuations. Automation is reducing operational costs by 35-50% for early adopters. Privacy-preserving ML techniques (federated learning, differential privacy) are gaining traction in regulated industries. Open-source models are commoditizing base capabilities, pushing vendors toward proprietary fine-tuned models and data moats. Low-latency inference infrastructure is a key differentiator.",
        "score": 0.84,
    },
    {
        "title": "Consumer and Enterprise Adoption Patterns",
        "url": "https://example.com/adoption-patterns",
        "snippet": "Adoption is bifurcating: enterprises prioritize security and compliance, while SMBs value ease of use and pricing. Freemium models drive top-of-funnel but conversion rates vary widely from 2-8% depending on product category.",
        "content": "Adoption is bifurcating: enterprises prioritize security and compliance, while SMBs value ease of use and pricing. Freemium models drive top-of-funnel but conversion rates vary widely from 2-8% depending on product category. Average contract value for enterprise deals increased 28% to $185K. Sales cycles remain long at 6-9 months for enterprise, 2-4 weeks for SMB. Customer success investment is critical: companies with dedicated CS teams show 40% lower churn. Product-led growth strategies are outperforming traditional sales motions for sub-$50K ACV segments. Mobile-first adoption rising sharply: 61% of SMB users primarily access via mobile devices.",
        "score": 0.79,
    },
    {
        "title": "Regulatory Environment and Compliance Challenges",
        "url": "https://example.com/regulatory-landscape",
        "snippet": "Regulatory scrutiny is intensifying globally. The EU AI Act, US executive orders on AI, and data localization requirements in 40+ countries are reshaping product roadmaps and go-to-market strategies for global vendors.",
        "content": "Regulatory scrutiny is intensifying globally. The EU AI Act, US executive orders on AI, and data localization requirements in 40+ countries are reshaping product roadmaps and go-to-market strategies for global vendors. Compliance costs increased 22% YoY, now averaging $4.2M annually for mid-size vendors. Companies investing in compliance infrastructure early are gaining trust advantages. SOC 2 Type II, ISO 27001, and GDPR compliance are baseline requirements for enterprise sales. Emerging requirements around AI explainability and algorithmic auditing will add complexity. Vendors with modular, jurisdiction-configurable architectures are better positioned. Privacy-by-design is transitioning from differentiator to hygiene factor.",
        "score": 0.75,
    },
]


class ResearchAgent:
    def __init__(self):
        self._use_mock = not settings.tavily_api_key or settings.tavily_api_key == "your_tavily_api_key_here"
        if not self._use_mock:
            self.client = AsyncTavilyClient(api_key=settings.tavily_api_key)

    async def run(self, query: str) -> list[dict]:
        if self._use_mock:
            return self._mock_results(query)

        response = await self.client.search(
            query=query,
            search_depth="advanced",
            max_results=5,
            include_raw_content=True,
        )

        sources = []
        for r in response.get("results", []):
            content = r.get("raw_content") or r.get("content", "")
            sources.append(
                {
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "snippet": r.get("content", "")[:300],
                    "content": content[:4000],
                    "score": round(r.get("score", 0), 3),
                }
            )

        return sources

    def _mock_results(self, query: str) -> list[dict]:
        results = []
        for s in MOCK_SOURCES:
            results.append({**s, "title": s["title"].replace("the Industry", f"the {query} Industry").replace("the industry", f"the {query} industry")})
        return results
