// src/components/dashboard/AttendanceChartCard.jsx
// ─────────────────────────────────────────────
//  Today's Attendance — Donut chart (Recharts)
//  Drop-in replacement for the attendance section
//  in Dashboard.jsx
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { buildApiUrl } from "../../api/apiBase";

// ── Colour map ────────────────────────────────
const COLORS = {
  Present: "#10b981",   // emerald-500
  Absent:  "#ef4444",   // red-500
  Late:    "#f59e0b",   // amber-500
};

const PILL = {
  Present: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Absent:  "bg-red-50 text-red-600 ring-1 ring-red-200",
  Late:    "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

// ── Today as YYYY-MM-DD ───────────────────────
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Derive status from a single record ─────────
// Mirrors the same logic used in AttendanceReports.jsx
const LATE_THRESHOLD = "09:30"; // 24-hr — adjust to company policy

function deriveStatus(record) {
  const inRaw = record.inTime || record.inISO || "";
  if (!inRaw || inRaw === "—") return "Absent";

  // If inTime is already formatted "HH:MM AM/PM"
  const match12 = String(inRaw).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12) {
    let h = parseInt(match12[1]);
    const mm = parseInt(match12[2]);
    const meridiem = match12[3].toUpperCase();
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    const as24 = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    return as24 > LATE_THRESHOLD ? "Late" : "Present";
  }

  // If inISO is a full ISO string
  if (String(inRaw).includes("T")) {
    const d = new Date(inRaw);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}` > LATE_THRESHOLD ? "Late" : "Present";
    }
  }

  return "Present";
}

// ── Custom tooltip ────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-100 shadow-md rounded-xl px-3 py-2 text-xs">
      <span className="font-semibold text-gray-800">{name}: </span>
      <span className="text-gray-600">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
export default function AttendanceChartCard() {
  const [counts, setCounts]   = useState({ Present: 0, Absent: 0, Late: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError("");
      try {
        const url      = `${buildApiUrl("/attendance/all")}?date=${todayISO()}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data    = await response.json();
        const records = Array.isArray(data)
          ? data
          : Array.isArray(data?.data) ? data.data : [];

        const tally = { Present: 0, Absent: 0, Late: 0 };
        records.forEach((r) => {
          const status = deriveStatus(r);
          tally[status] = (tally[status] || 0) + 1;
        });

        setCounts(tally);
      } catch (err) {
        console.error("❌ Attendance chart fetch failed:", err);
        setError("Could not load attendance data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const total   = counts.Present + counts.Absent + counts.Late;
  const pct     = total > 0 ? Math.round((counts.Present / total) * 100) : 0;

  const chartData = [
    { name: "Present", value: counts.Present },
    { name: "Absent",  value: counts.Absent  },
    { name: "Late",    value: counts.Late     },
  ].filter((d) => d.value > 0);   // hide zero-value slices

  // ─────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── Card header ── */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-[#1a2240]/10 flex items-center justify-center text-[#1a2240]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-gray-900">Today's Attendance</h2>
        <span className="ml-auto text-xs text-gray-400">{todayISO()}</span>
      </div>

      {/* ── Body ── */}
      <div className="px-5 py-4">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <p className="text-xs text-red-500 text-center py-8 italic">{error}</p>
        )}

        {/* No data */}
        {!loading && !error && total === 0 && (
          <p className="text-xs text-gray-400 text-center py-8 italic">
            No attendance records for today
          </p>
        )}

        {/* Chart + stats */}
        {!loading && !error && total > 0 && (
          <>
            {/* Donut chart */}
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="75%"
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centre label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold text-gray-900">{pct}%</p>
                <p className="text-xs text-gray-400 mt-0.5">Present</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: "Present", key: "Present" },
                { label: "Absent",  key: "Absent"  },
                { label: "Late",    key: "Late"     },
                { label: "Total",   key: null        },
              ].map(({ label, key }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    key ? PILL[key] : "bg-gray-100 text-gray-600"
                  }`}>
                    {key ? counts[key] : total}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Colour legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-50">
              {Object.entries(COLORS).map(([name, color]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-500">{name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
