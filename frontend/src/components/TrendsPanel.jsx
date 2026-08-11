import { TrendingUp } from "lucide-react";

const CARD_ACCENTS = [
  { bg: "rgba(99,102,241,0.06)",  border: "rgba(99,102,241,0.25)",  color: "#818cf8",  ring: "#6366f1"  },
  { bg: "rgba(139,92,246,0.06)",  border: "rgba(139,92,246,0.25)",  color: "#a78bfa",  ring: "#8b5cf6"  },
  { bg: "rgba(20,184,166,0.06)",  border: "rgba(20,184,166,0.25)",  color: "#2dd4bf",  ring: "#14b8a6"  },
  { bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.25)",  color: "#fbbf24",  ring: "#f59e0b"  },
  { bg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.25)",  color: "#34d399",  ring: "#10b981"  },
  { bg: "rgba(239,68,68,0.06)",   border: "rgba(239,68,68,0.25)",   color: "#f87171",  ring: "#ef4444"  },
];

function ConfidenceRing({ value, accentColor }) {
  const size        = 84;
  const strokeWidth = 6;
  const r           = (size - strokeWidth) / 2;
  const circ        = 2 * Math.PI * r;
  const pct         = Math.round((value || 0) * 100);
  const offset      = circ - (pct / 100) * circ;
  const ringColor   = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.3s cubic-bezier(0.16,1,0.3,1) 0.25s",
            filter: `drop-shadow(0 0 5px ${ringColor}88)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono text-xl font-bold leading-none" style={{ color: ringColor }}>{pct}%</span>
        <span className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>conf</span>
      </div>
    </div>
  );
}

function TrendCard({ trend, signals, index }) {
  const accent  = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const supporting = (trend.signal_indices || [])
    .map(i => signals[i])
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="glass-card flex flex-col overflow-hidden anim-fade-up"
      style={{ animationDelay: `${index * 80}ms`, borderColor: accent.border }}>

      {/* Accent glow bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent.ring}, transparent)` }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header: ring + title */}
        <div className="flex items-start gap-4 mb-4">
          <ConfidenceRing value={trend.confidence} accentColor={accent.ring} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-100 text-base leading-snug mb-1.5"
              style={{ letterSpacing: "-0.01em" }}>
              {trend.theme}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
              {trend.description}
            </p>
          </div>
        </div>

        {/* Implications */}
        {trend.implications && (
          <div className="flex-1 rounded-xl p-3 mb-4"
            style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1"
              style={{ color: accent.color }}>
              Strategic Implication
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
              {trend.implications}
            </p>
          </div>
        )}

        {/* Supporting signals */}
        {supporting.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-3)" }}>
              {trend.signal_indices?.length || supporting.length} supporting signals
            </p>
            <div className="space-y-1.5">
              {supporting.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs leading-snug"
                  style={{ color: "var(--text-2)" }}>
                  <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: accent.ring }} />
                  {s.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrendsPanel({ trends, signals }) {
  if (!trends.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3"
        style={{ color: "var(--text-3)" }}>
        <TrendingUp className="w-10 h-10 opacity-30" />
        <p className="text-sm">Trends will appear here after clustering</p>
      </div>
    );
  }

  const avgConf = Math.round(
    (trends.reduce((s, t) => s + (t.confidence || 0.7), 0) / trends.length) * 100
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          {trends.length} strategic trends identified
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "var(--text-3)" }}>avg confidence</span>
          <span className="mono text-xs font-bold"
            style={{ color: avgConf >= 80 ? "#34d399" : avgConf >= 60 ? "#fbbf24" : "#f87171" }}>
            {avgConf}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {trends.map((t, i) => (
          <TrendCard key={i} trend={t} signals={signals} index={i} />
        ))}
      </div>
    </div>
  );
}
