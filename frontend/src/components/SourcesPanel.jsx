import { useState } from "react";
import { ExternalLink, Globe } from "lucide-react";

function Favicon({ domain }) {
  const [err, setErr] = useState(false);
  if (err || !domain) return <Globe className="w-4 h-4 shrink-0" style={{ color: "var(--text-3)" }} />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`}
      alt=""
      width={16} height={16}
      className="rounded-sm shrink-0"
      onError={() => setErr(true)}
    />
  );
}

function ScoreBar({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#6366f1";
  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-1 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}66` }} />
      </div>
      <span className="mono text-[11px]" style={{ color: "var(--text-3)" }}>{pct}%</span>
    </div>
  );
}

function SourceCard({ source, index, featured }) {
  const domain = (() => {
    try { return new URL(source.url).hostname.replace("www.", ""); }
    catch { return source.url; }
  })();

  return (
    <div
      className="glass-card group flex flex-col h-full transition-all duration-300 overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Hover gradient line at top */}
      <div className="h-px w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }} />

      <div className="p-4 flex flex-col flex-1">
        {/* Domain + link */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Favicon domain={domain} />
            <span className="text-xs truncate" style={{ color: "var(--text-3)" }}>{domain}</span>
          </div>
          <a href={source.url} target="_blank" rel="noopener noreferrer"
            className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{ background: "var(--surface)", color: "var(--text-2)" }}
            onClick={e => e.stopPropagation()}>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug mb-2 text-slate-200"
          style={{ display: "-webkit-box", WebkitLineClamp: featured ? 3 : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {source.title || "Untitled"}
        </h3>

        {/* Snippet */}
        <p className="text-xs leading-relaxed flex-1"
          style={{
            color: "var(--text-2)",
            display: "-webkit-box",
            WebkitLineClamp: featured ? 5 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
          {source.snippet}
        </p>

        {/* Score */}
        <ScoreBar score={source.score} />
      </div>
    </div>
  );
}

export default function SourcesPanel({ sources }) {
  if (!sources.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3"
        style={{ color: "var(--text-3)" }}>
        <Globe className="w-10 h-10 opacity-30" />
        <p className="text-sm">Sources will appear here after search begins</p>
      </div>
    );
  }

  const [featured, ...rest] = sources;

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
        {sources.length} sources collected and indexed by relevance
      </p>

      {/* Bento grid: first card is wider */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Featured source spans 2 cols */}
        <div className="md:col-span-2 anim-fade-up">
          <SourceCard source={featured} index={0} featured />
        </div>

        {/* Second source */}
        {rest[0] && (
          <div className="anim-fade-up" style={{ animationDelay: "60ms" }}>
            <SourceCard source={rest[0]} index={1} />
          </div>
        )}

        {/* Remaining: 3-col grid */}
        {rest.slice(1).map((s, i) => (
          <div key={i} className="anim-fade-up" style={{ animationDelay: `${(i + 2) * 60}ms` }}>
            <SourceCard source={s} index={i + 2} />
          </div>
        ))}
      </div>
    </div>
  );
}
