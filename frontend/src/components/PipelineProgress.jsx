import { Globe, Zap, TrendingUp, FileText, Check, Loader2 } from "lucide-react";

const STAGES = [
  { id: "research",   label: "Research",   sub: "Web search",     icon: Globe },
  { id: "extraction", label: "Extraction", sub: "Signal mining",  icon: Zap },
  { id: "trends",     label: "Trends",     sub: "Clustering",     icon: TrendingUp },
  { id: "brief",      label: "Brief",      sub: "Report gen",     icon: FileText },
];
const ORDER = ["research", "extraction", "trends", "brief"];

export default function PipelineProgress({ currentStage, statusMessage, isComplete }) {
  const currentIdx = currentStage ? ORDER.indexOf(currentStage) : (isComplete ? ORDER.length : -1);

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Pipeline
          </span>
          {isComplete && (
            <span className="tag" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", borderColor: "rgba(16,185,129,0.25)" }}>
              <Check className="w-2.5 h-2.5" /> Done
            </span>
          )}
        </div>
        {statusMessage && !isComplete && (
          <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-2)" }}>
            <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--accent)" }} />
            <span className="italic">{statusMessage}</span>
          </p>
        )}
      </div>

      {/* Stages */}
      <div className="flex items-start gap-0">
        {STAGES.map((stage, i) => {
          const Icon    = stage.icon;
          const idx     = ORDER.indexOf(stage.id);
          const done    = isComplete || idx < currentIdx;
          const active  = !isComplete && stage.id === currentStage;
          const nextDone = i < STAGES.length - 1 && (isComplete || ORDER.indexOf(STAGES[i + 1].id) <= currentIdx);

          return (
            <div key={stage.id} className="flex items-center flex-1 last:flex-none">
              {/* Node + label */}
              <div className="flex flex-col items-center gap-2.5 w-20">
                {/* Node */}
                <div className="relative">
                  {/* Outer glow ring for active */}
                  {active && (
                    <div className="absolute inset-[-5px] rounded-full anim-glow"
                      style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.4)" }} />
                  )}
                  <div
                    className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500"
                    style={done ? {
                      background: "linear-gradient(135deg, #059669, #10b981)",
                      boxShadow: "0 0 20px rgba(16,185,129,0.35)"
                    } : active ? {
                      background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))",
                      border: "1.5px solid rgba(99,102,241,0.7)",
                      boxShadow: "0 0 16px rgba(99,102,241,0.2)"
                    } : {
                      background: "var(--surface)",
                      border: "1px solid var(--border)"
                    }}>
                    {done
                      ? <Check className="w-5 h-5 text-white" />
                      : <Icon className="w-4.5 h-4.5" style={{ color: active ? "#a5b4fc" : "var(--text-3)", width: 18, height: 18 }} />
                    }
                  </div>
                </div>

                {/* Labels */}
                <div className="text-center">
                  <p className="text-xs font-semibold leading-none mb-1 transition-colors duration-300"
                    style={{ color: done ? "#34d399" : active ? "#a5b4fc" : "var(--text-3)" }}>
                    {stage.label}
                  </p>
                  <p className="text-[10px] leading-none" style={{ color: "var(--text-3)" }}>
                    {stage.sub}
                  </p>
                </div>
              </div>

              {/* Connector bar */}
              {i < STAGES.length - 1 && (
                <div className="flex-1 mx-2 mb-7 relative h-px overflow-hidden rounded-full"
                  style={{ background: "var(--border)" }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{
                      width: nextDone ? "100%" : "0%",
                      background: "linear-gradient(90deg, #059669, #10b981)",
                      boxShadow: nextDone ? "0 0 6px rgba(16,185,129,0.5)" : "none",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
