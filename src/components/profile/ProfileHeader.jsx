// src/components/profile/ProfileHeader.jsx
// ─────────────────────────────────────────────
//  Top banner card — avatar initials, name,
//  department, designation, status, joining date
// ─────────────────────────────────────────────

// ── Format date helper ─────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProfileHeader({ data }) {
  if (!data) return null;

  const fullName    = [data.firstName, data.lastName].filter(Boolean).join(" ") || "—";
  const initials    = [data.firstName?.[0], data.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const department  = data.department?.deptName  || "—";
  const designation = data.designation?.title    || "—";
  const isActive    = data.isActive !== false;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">

      {/* ── Top colour strip ── */}
      <div className="h-3 bg-[#1a2240]" />

      <div className="px-6 py-6 flex items-center gap-5 flex-wrap">

        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-[#1a2240] flex items-center justify-center flex-shrink-0 ring-4 ring-white shadow-md">
          <span className="text-2xl font-bold text-white tracking-wide">{initials}</span>
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{fullName}</h1>

            {/* Active / Inactive badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-red-50 text-red-600 ring-1 ring-red-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-0.5">{designation}</p>

          {/* Chips row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <MetaChip
              icon={
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              label={department}
            />
            <MetaChip
              icon={
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              label={`Joined ${formatDate(data.joinDate)}`}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Small icon + text chip ─────────────────────
function MetaChip({ icon, label }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
      <span className="text-gray-400">{icon}</span>
      {label}
    </div>
  );
}
