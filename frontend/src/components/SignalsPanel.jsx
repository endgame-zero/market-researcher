import { ExternalLink, Info, TrendingUp, Building2, Lightbulb, Gem, AlertTriangle, Zap } from "lucide-react";

const TYPE_META = {
  fact:        { label: "Fact",        Icon: Info,          bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", border: "rgba(59,130,246,0.25)"  },
  trend:       { label: "Trend",       Icon: TrendingUp,    bg: "rgba(139,92,246,0.12)",  color: "#a78bfa", border: "rgba(139,92,246,0.25)"  },
  player:      { label: "Player",      Icon: Building2,     bg: "rgba(249,115,22,0.12)",  color: "#fb923c", border: "rgba(249,115,22,0.25)"  },
  use_case:    { label: "Use Case",    Icon: Lightbulb,     bg: "rgba(20,184,166,0.12)",  color: "#2dd4bf", border: "rgba(20,184,166,0.25)"  },
  opportunity: { label: "Opportunity", Icon: Gem,           bg: "rgba(16,185,129,0.12)",  color: "#34d399", border: "rgba(16,185,129,0.25)"  },
  challenge:   { label: "Challenge",   Icon: AlertTriangle, bg: "rgba(239,68,68,0.12)",   color: "#f87171", border: "rgba(239,68,68,0.25)"   },
};

const DEFAULT_META = { label: "Signal", Icon: Zap, bg: "rgba(99,102,241,0.12)", color: "#818cf8", border: "rgba(99,102,241,0.25)" };

function ConfidenceDots({ value }) {
  const pct  = Math.round((value || 0) * 100);
  const fill = Math.round((pct / 100) * 5);
  return (
    <div className="flex items-center gap-1 shrink-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
          style={{ background: i < fill ? (pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#f87171") : "rgba(255,255,255,0.08)" }} />
      ))}
      <span className="mono text-[10px] ml-1.5" style={{ color: "var(--text-3)" }}>{pct}%</span>
    </div>
  );
}

function SignalItem({ signal, index }) {
  const meta   = TYPE_META[signal.type] || DEFAULT_META;
  const { Icon } = meta;

  const domain = (() => {
    try { return new URL(signal.source_url).hostname.replace("www.", ""); }
    catch { return ""; }
  })();

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl group transition-all duration-200 anim-fade-up"
      style={{ animationDelay: `${index * 35}ms`, background: "transparent", border: "1px solid transparent" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>

      {/* Icon */}
      <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
        style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 leading-snug mb-1.5">{signal.content}</p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {domain && (
              <a href={signal.source_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] transition-colors duration-150"
                style={{ color: "var(--text-3)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#818cf8"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}>
                <ExternalLink className="w-2.5 h-2.5" />
                {domain}
              </a>
            )}
          </div>
          <ConfidenceDots value={signal.confidence} />
        </div>
      </div>
    </div>
  );
}

function TypeGroup({ type, signals }) {
  const meta   = TYPE_META[type] || DEFAULT_META;
  const { Icon } = meta;

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-2 px-1">
        <div className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: meta.bg }}>
          <Icon className="w-3 h-3" style={{ color: meta.color }} />
        </div>
        <span className="text-xs font-semibold" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="mono text-[11px] px-1.5 py-0.5 rounded"
          style={{ background: meta.bg, color: meta.color }}>
          {signals.length}
        </span>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-base)" }}>
        {signals.map((s, i) => (
          <div key={i}>
            <SignalItem signal={s} index={i} />
            {i < signals.length - 1 && (
              <div className="mx-3 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SignalsPanel({ signals }) {
  if (!signals.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: "var(--text-3)" }}>
        <Zap className="w-10 h-10 opacity-30" />
        <p className="text-sm">Signals will appear here after extraction</p>
      </div>
    );
  }

  const grouped = signals.reduce((acc, s) => {
    const key = s.type || "fact";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const order = ["fact", "trend", "player", "opportunity", "challenge", "use_case"];
  const sortedKeys = [
    ...order.filter(k => grouped[k]),
    ...Object.keys(grouped).filter(k => !order.includes(k)),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          {signals.length} signals extracted across {sortedKeys.length} categories
        </p>
        <div className="flex gap-1.5">
          {sortedKeys.map(type => {
            const meta = TYPE_META[type] || DEFAULT_META;
            return (
              <span key={type} className="tag"
                style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}>
                {meta.label} {grouped[type].length}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {sortedKeys.map(type => (
          <TypeGroup key={type} type={type} signals={grouped[type]} />
        ))}
      </div>
    </div>
  );
}
