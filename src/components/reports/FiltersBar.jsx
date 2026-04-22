// src/components/reports/FiltersBar.jsx
// ─────────────────────────────────────────────
//  Generic filter bar for Leave and Attendance reports
//  Props-driven — parent passes filter config + state
// ─────────────────────────────────────────────

export default function FiltersBar({
  search,
  onSearchChange,
  filters = [],       // [{ key, label, options: [{value, label}] }]
  values  = {},       // { [key]: selectedValue }
  onChange,           // (key, value) => void
  onReset,            // () => void
  onExport,           // () => void
  exportDisabled = false,
  resultCount = 0,
}) {
  const hasActiveFilter =
    search.trim() !== "" ||
    filters.some((f) => values[f.key] && values[f.key] !== "");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 mb-5 space-y-4">

      {/* ── Row 1: Search + Export ── */}
      <div className="flex items-center gap-3 flex-wrap justify-between">

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search employee name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none
              focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all placeholder:text-gray-300"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {hasActiveFilter && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-50 border border-gray-200 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          )}
          <button
            onClick={onExport}
            disabled={exportDisabled || resultCount === 0}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-[#1a2240] hover:bg-[#243055] active:scale-95 px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Row 2: Dropdown filters ── */}
      {filters.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {filters.map((filter) => (
            <div key={filter.key} className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider pl-1">
                {filter.label}
              </label>
              {filter.type === "date" ? (
                <input
                  type="date"
                  value={values[filter.key] || ""}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none
                    focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all
                    text-gray-700 bg-white"
                />
              ) : (
                <select
                  value={values[filter.key] || ""}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none
                    focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all
                    text-gray-700 bg-white cursor-pointer"
                >
                  <option value="">All {filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
