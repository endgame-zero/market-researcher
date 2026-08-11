import { useState, useEffect } from "react";
import {
  BarChart2, AlertCircle, Globe, Zap, TrendingUp,
  FileText, FlaskConical, ChevronRight,
} from "lucide-react";
import SearchBar from "./components/SearchBar";
import PipelineProgress from "./components/PipelineProgress";
import SourcesPanel from "./components/SourcesPanel";
import SignalsPanel from "./components/SignalsPanel";
import TrendsPanel from "./components/TrendsPanel";
import BriefPanel from "./components/BriefPanel";

const TABS = [
  { id: "sources",  label: "Sources",  icon: Globe },
  { id: "signals",  label: "Signals",  icon: Zap },
  { id: "trends",   label: "Trends",   icon: TrendingUp },
  { id: "brief",    label: "Brief",    icon: FileText },
];

const EXAMPLES = [
  "AI coding assistants 2025",
  "EV battery technology trends",
  "B2B SaaS pricing strategies",
  "Sustainable packaging market",
  "Generative AI in healthcare",
];

export default function App() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [currentStage, setCurrentStage] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isComplete, setIsComplete]     = useState(false);
  const [activeTab, setActiveTab]       = useState("sources");
  const [error, setError]               = useState(null);
  const [isMockMode, setIsMockMode]     = useState(false);
  const [sources, setSources]           = useState([]);
  const [signals, setSignals]           = useState([]);
  const [trends, setTrends]             = useState([]);
  const [brief, setBrief]               = useState("");

  const hasData = sources.length > 0 || signals.length > 0 || trends.length > 0 || brief;

  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(d => setIsMockMode(!d.tavily_configured))
      .catch(() => {});
  }, []);

  const handleResearch = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setIsComplete(false);
    setCurrentStage("research");
    setStatusMessage("");
    setSources([]);
    setSignals([]);
    setTrends([]);
    setBrief("");
    setActiveTab("sources");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.trim()) continue;
          let eventType = null, eventData = null;
          for (const line of part.split("\n")) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) {
              try { eventData = JSON.parse(line.slice(6)); } catch {}
            }
          }
          if (!eventType || !eventData) continue;
          switch (eventType) {
            case "status":
              setCurrentStage(eventData.stage);
              setStatusMessage(eventData.message);
              if (eventData.stage === "extraction") setActiveTab("signals");
              if (eventData.stage === "trends")     setActiveTab("trends");
              if (eventData.stage === "brief")      setActiveTab("brief");
              break;
            case "sources":  setSources(eventData.sources || []); setActiveTab("sources"); break;
            case "signals":  setSignals(eventData.signals || []); break;
            case "trends":   setTrends(eventData.trends  || []); break;
            case "brief":    setBrief(eventData.brief    || ""); break;
            case "complete":
              setIsComplete(true);
              setCurrentStage(null);
              setStatusMessage("");
              setIsLoading(false);
              break;
            case "error":
              setError(eventData.message);
              setIsLoading(false);
              break;
          }
        }
      }
    } catch (e) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const tabCount = id => {
    if (id === "sources") return sources.length;
    if (id === "signals") return signals.length;
    if (id === "trends")  return trends.length;
    if (id === "brief")   return brief ? 1 : 0;
    return 0;
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">

      {/* ── Ambient background orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute rounded-full anim-float-1"
          style={{ width: 720, height: 720, top: "-15%", left: "-8%",
            background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 68%)" }} />
        <div className="absolute rounded-full anim-float-2"
          style={{ width: 580, height: 580, bottom: "0%", right: "-8%",
            background: "radial-gradient(circle, rgba(139,92,246,0.065) 0%, transparent 68%)" }} />
        <div className="absolute rounded-full anim-float-3"
          style={{ width: 360, height: 360, top: "40%", left: "55%",
            background: "radial-gradient(circle, rgba(192,132,252,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* ── Grid overlay ── */}
      <div className="fixed inset-0 grid-bg pointer-events-none" aria-hidden />

      {/* ── Header ── */}
      <header className="relative z-20 border-b"
        style={{ borderColor: "var(--border)", background: "rgba(2,6,23,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
        {/* Thin gradient accent line */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(139,92,246,0.6), transparent)" }} />

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}>
              <BarChart2 className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 tracking-tight leading-none">Market Research</span>
                <span className="text-slate-500 font-light leading-none">/ AI</span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                Agentic intelligence pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMockMode && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}>
                <FlaskConical className="w-3 h-3" />
                Demo mode
              </span>
            )}
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
              style={{ background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Llama 3.3 · 70B
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20">

        {/* Hero state */}
        {!hasData && !isLoading && (
          <div className="flex flex-col items-center pt-20 pb-10 text-center anim-fade-in">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold mb-8"
              style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              4-stage pipeline · Web search → Signals → Trends → Brief
            </div>

            <h2 className="text-5xl sm:text-6xl font-extrabold text-slate-100 leading-[1.1] tracking-tight mb-5">
              Market Intelligence,
              <br />
              <span className="gradient-text">on demand.</span>
            </h2>

            <p className="text-lg mb-10 max-w-lg leading-relaxed" style={{ color: "var(--text-2)" }}>
              Type any market, technology, or industry. Our agents search, extract signals,
              cluster trends, and write an executive brief — in minutes.
            </p>

            <div className="w-full max-w-2xl mb-5">
              <SearchBar query={query} setQuery={setQuery} onSubmit={handleResearch} isLoading={isLoading} hero />
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => setQuery(ex)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm transition-all duration-200 cursor-pointer"
                  style={{ background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border)" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                    e.currentTarget.style.color       = "var(--text-1)";
                    e.currentTarget.style.background  = "var(--surface-hover)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color       = "var(--text-2)";
                    e.currentTarget.style.background  = "var(--surface)";
                  }}>
                  {ex}
                  <ChevronRight className="w-3 h-3 opacity-50" />
                </button>
              ))}
            </div>

            {/* Pipeline preview illustration */}
            <div className="mt-14 flex items-center gap-2 opacity-30">
              {["Search", "Extract", "Trends", "Brief"].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">{s}</span>
                  {i < arr.length - 1 && <span className="text-slate-700">→</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Active state: compact search */}
        {(hasData || isLoading) && (
          <div className="pt-6 mb-5 anim-fade-in">
            <SearchBar query={query} setQuery={setQuery} onSubmit={handleResearch} isLoading={isLoading} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl mb-5 anim-fade-up"
            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)" }}>
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Research failed</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(248,113,113,0.75)" }}>{error}</p>
            </div>
          </div>
        )}

        {/* Pipeline + tabs */}
        {(isLoading || hasData) && (
          <div className="space-y-5 anim-fade-up">
            <PipelineProgress
              currentStage={currentStage}
              statusMessage={statusMessage}
              isComplete={isComplete}
            />

            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-2xl"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
              {TABS.map(({ id, label, icon: Icon }) => {
                const count    = tabCount(id);
                const isActive = activeTab === id;
                return (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className="flex items-center gap-2 flex-1 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer justify-center"
                    style={isActive ? {
                      background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
                      color: "#a5b4fc",
                      border: "1px solid rgba(99,102,241,0.3)",
                      boxShadow: "0 0 20px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
                    } : {
                      color: "var(--text-3)",
                      background: "transparent",
                      border: "1px solid transparent",
                    }}>
                    <Icon className="w-4 h-4 hidden sm:block" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.slice(0, 3)}</span>
                    {count > 0 && (
                      <span className="mono text-[11px] px-1.5 py-0.5 rounded-md"
                        style={{
                          background: isActive ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)",
                          color: isActive ? "#c7d2fe" : "var(--text-3)",
                        }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div key={activeTab} className="anim-fade-in">
              {activeTab === "sources" && <SourcesPanel sources={sources} />}
              {activeTab === "signals" && <SignalsPanel signals={signals} />}
              {activeTab === "trends"  && <TrendsPanel  trends={trends}  signals={signals} />}
              {activeTab === "brief"   && <BriefPanel   brief={brief}    query={query} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
