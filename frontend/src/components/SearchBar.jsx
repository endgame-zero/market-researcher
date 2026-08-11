import { Search, Loader2 } from "lucide-react";

export default function SearchBar({ query, setQuery, onSubmit, isLoading, hero }) {
  const handleKeyDown = e => {
    if (e.key === "Enter" && !isLoading) onSubmit();
  };

  return (
    <div className="flex gap-3">
      {/* Input wrapper with gradient focus border */}
      <div className="relative flex-1 group">
        {/* Gradient border ring — visible on focus-within */}
        <div
          className="absolute -inset-px rounded-[13px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", zIndex: 0 }}
        />
        <div className="relative z-10 flex items-center rounded-[12px] overflow-hidden"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
          <Search
            className="absolute left-4 w-5 h-5 pointer-events-none"
            style={{ color: "var(--text-3)" }}
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hero
                ? "e.g. AI coding assistants 2025, EV battery technology trends..."
                : "New research topic..."
            }
            disabled={isLoading}
            className={`w-full bg-transparent pl-12 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none disabled:opacity-50 ${
              hero ? "py-4 text-base" : "py-3.5 text-sm"
            }`}
          />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading || !query.trim()}
        className={`flex items-center gap-2 text-white font-semibold rounded-xl btn-primary whitespace-nowrap ${
          hero ? "px-7 py-4 text-base" : "px-6 py-3.5 text-sm"
        }`}>
        {isLoading
          ? <><Loader2 className="w-4 h-4 animate-spin" />Researching…</>
          : <><Search className="w-4 h-4" />Research</>}
      </button>
    </div>
  );
}
