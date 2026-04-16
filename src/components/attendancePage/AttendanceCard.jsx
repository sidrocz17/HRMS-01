// src/components/attendance/AttendanceCard.jsx

import { useEffect, useState } from "react";

// ── Status config ─────────────────────────────
const STATUS_CONFIG = {
  NOT_STARTED: {
    label: "Not Started",
    dot: "bg-gray-400",
    pill: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  },
  WORKING: {
    label: "Working",
    dot: "bg-emerald-400 animate-pulse",
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-blue-400",
    pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  },
};

// ── Helpers ───────────────────────────────────
function formatTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function calcElapsed(inISO) {
  const diff = Math.floor((Date.now() - new Date(inISO)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function calcTotal(inISO, outISO) {
  if (!inISO || !outISO) return "—";
  const diff = Math.floor((new Date(outISO) - new Date(inISO)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Component ─────────────────────────────────
export default function AttendanceCard({
  status,        // "NOT_STARTED" | "WORKING" | "COMPLETED"
  todayRecord,   // { inISO, outISO } or null
  onPunchIn,
  onPunchOut,
  submitting,
}) {
  const [elapsed, setElapsed] = useState("00:00:00");

  // Live timer when WORKING
  useEffect(() => {
    if (status !== "WORKING" || !todayRecord?.inISO) return;
    setElapsed(calcElapsed(todayRecord.inISO));
    const id = setInterval(() => setElapsed(calcElapsed(todayRecord.inISO)), 1000);
    return () => clearInterval(id);
  }, [status, todayRecord?.inISO]);

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_STARTED;

  const inTimeDisplay  = formatTime(todayRecord?.inISO);
  const outTimeDisplay = formatTime(todayRecord?.outISO);
  const totalHours     = calcTotal(todayRecord?.inISO, todayRecord?.outISO);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── Card header ── */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Today's Attendance</h2>
          <p className="text-xs text-gray-400 mt-0.5">{todayLabel()}</p>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* ── Stat grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
        {[
          {
            label: "In Time",
            value: inTimeDisplay,
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            ),
            color: "text-emerald-600",
          },
          {
            label: "Out Time",
            value: outTimeDisplay,
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            ),
            color: "text-red-500",
          },
          {
            label: "Working Hours",
            value: status === "WORKING" ? elapsed : totalHours,
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: "text-[#1a2240]",
            mono: status === "WORKING",
          },
          {
            label: "Date",
            value: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            color: "text-gray-600",
          },
        ].map(({ label, value, icon, color, mono }) => (
          <div key={label} className="px-5 py-5 flex flex-col gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
              <p className={`text-lg font-bold text-gray-800 mt-0.5 ${mono ? "font-mono tabular-nums" : ""}`}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Action buttons ── */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">

        {/* Punch In */}
        <button
          onClick={onPunchIn}
          disabled={status !== "NOT_STARTED" || submitting}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm
            ${status === "NOT_STARTED" && !submitting
              ? "bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          {submitting && status === "NOT_STARTED" ? "Punching In..." : "Punch In"}
        </button>

        {/* Punch Out */}
        <button
          onClick={onPunchOut}
          disabled={status !== "WORKING" || submitting}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm
            ${status === "WORKING" && !submitting
              ? "bg-red-600 hover:bg-red-700 active:scale-95 text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {submitting && status === "WORKING" ? "Punching Out..." : "Punch Out"}
        </button>

        {/* Status hint */}
        {status === "COMPLETED" && (
          <p className="text-xs text-gray-400 ml-1">
            ✓ Your attendance for today has been recorded.
          </p>
        )}
      </div>

    </div>
  );
}
