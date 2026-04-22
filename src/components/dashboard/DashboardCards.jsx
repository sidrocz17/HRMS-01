// src/components/dashboard/DashboardCards.jsx
// ─────────────────────────────────────────────
//  Reusable card primitives for Dashboard
//  Follows same card style as Employee Management / Leave Management
// ─────────────────────────────────────────────

// ── Base card wrapper ──────────────────────────
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

// ── Card header row ────────────────────────────
export function CardHeader({ title, icon }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
      {icon && (
        <div className="w-7 h-7 rounded-lg bg-[#1a2240]/10 flex items-center justify-center text-[#1a2240]">
          {icon}
        </div>
      )}
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
    </div>
  );
}

// ── Metric card — top row summary cards ────────
// value, label, sub (node), icon (svg node)
export function MetricCard({ value, label, sub, icon, loading }) {
  return (
    <Card>
      <div className="px-5 py-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-gray-200 rounded w-20" />
              <div className="h-3.5 bg-gray-100 rounded w-28" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 leading-none">{value ?? "—"}</p>
              <p className="text-xs font-medium text-gray-500 mt-1.5">{label}</p>
              {sub && <div className="mt-2">{sub}</div>}
            </>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[#1a2240]/8 flex items-center justify-center flex-shrink-0 text-[#1a2240] opacity-60">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Small inline badge ─────────────────────────
export function Pill({ label, color = "gray" }) {
  const map = {
    green:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    amber:  "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    red:    "bg-red-50 text-red-600 ring-1 ring-red-200",
    blue:   "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    gray:   "bg-gray-100 text-gray-600",
    navy:   "bg-[#1a2240]/10 text-[#1a2240]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[color] || map.gray}`}>
      {label}
    </span>
  );
}

// ── Loading skeleton row ───────────────────────
export function SkeletonRow({ lines = 2 }) {
  return (
    <div className="animate-pulse space-y-2 px-5 py-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3.5 bg-gray-100 rounded ${i === 0 ? "w-3/4" : "w-1/2"}`} />
      ))}
    </div>
  );
}
