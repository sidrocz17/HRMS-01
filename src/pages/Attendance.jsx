// src/pages/Attendance.jsx
// ─────────────────────────────────────────────
//  Attendance Management
//  RBAC:
//    EMPLOYEE  → Punch In/Out + own history
//    HR/ADMIN  → Punch In/Out + view all records
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import ThoughtCard from "../components/attendancePage/ThoughtCard";
import AttendanceCard from "../components/attendancePage/AttendanceCard";
import AttendanceTable from "../components/attendancePage/AttendanceTable";
import {
  punchIn,
  punchOut,
  getAttendance,
} from "../api/attendanceApi";

// ── Status constants ──────────────────────────
const STATUS = {
  NOT_STARTED: "NOT_STARTED",
  WORKING: "WORKING",
  COMPLETED: "COMPLETED",
};

const pad = (value) => String(value).padStart(2, "0");

const getLocalDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

const getTodayKey = () => getLocalDateKey();

const deriveTodayState = (records = []) => {
  const todayKey = getTodayKey();

  const todayCandidates = records.filter((record) => {
    const candidateDate =
      getLocalDateKey(record.inISO) ||
      getLocalDateKey(record.outISO) ||
      record.dateISO ||
      "";

    return candidateDate === todayKey;
  });

  if (!todayCandidates.length) {
    return {
      status: STATUS.NOT_STARTED,
      hasCheckedInToday: false,
      todayRecord: null,
    };
  }

  const sortedRecords = [...todayCandidates].sort((a, b) => {
    const aTime = new Date(a.outISO || a.inISO || 0).getTime();
    const bTime = new Date(b.outISO || b.inISO || 0).getTime();
    return bTime - aTime;
  });

  const latestInRecord = sortedRecords.find((record) => record.inISO);
  const latestOutRecord = sortedRecords.find((record) => record.outISO);
  const hasCheckedInToday = todayCandidates.some(
    (record) => record.inISO || record.outISO
  );

  return {
    status:
      latestInRecord?.inISO && latestOutRecord?.outISO
        ? STATUS.COMPLETED
        : hasCheckedInToday
        ? STATUS.WORKING
        : STATUS.NOT_STARTED,
    hasCheckedInToday,
    todayRecord: hasCheckedInToday
      ? {
          inISO: latestInRecord?.inISO || latestOutRecord?.inISO || null,
          outISO: latestOutRecord?.outISO || null,
        }
      : null,
  };
};

// ── Simple in-memory toast ────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3000);
    return () => clearTimeout(id);
  }, [onDone]);

  const colors = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    info: "bg-[#1a2240]",
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white text-sm font-medium ${colors[type] || colors.info} animate-fade-in`}
    >
      {type === "success" && (
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      {type === "error" && (
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────
export default function Attendance() {
  // ── RBAC ──────────────────────────────────────
  const role = localStorage.getItem("role") || "employee";
  const isAdminOrHR = role === "admin" || role === "hr";
  const isEmployee = role === "employee";

  // ── State ──────────────────────────────────────
  const [status, setStatus] = useState(STATUS.NOT_STARTED);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null); // { inISO, outISO }
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  // ── Helpers ───────────────────────────────────
  const showToast = (message, type = "success") => setToast({ message, type });
  const clearToast = useCallback(() => setToast(null), []);

  // ── Load history on mount ─────────────────────
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getAttendance();
      const nextHistory = data || [];
      setHistory(nextHistory);

      const {
        status: derivedStatus,
        hasCheckedInToday: derivedHasCheckedInToday,
        todayRecord: derivedRecord,
      } =
        deriveTodayState(nextHistory);
      setStatus(derivedStatus);
      setHasCheckedInToday(derivedHasCheckedInToday);
      setTodayRecord(derivedRecord);
    } catch (err) {
      console.error("❌ Failed to load attendance:", err);
      showToast(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load attendance.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Punch In ──────────────────────────────────
  const handlePunchIn = async () => {
    setSubmitting(true);
    try {
      const result = await punchIn();
      const nextRecord = {
        inISO: result.inISO || result.outISO || null,
        outISO: result.outISO || null,
      };

      if (nextRecord.inISO && nextRecord.outISO) {
        setTodayRecord(nextRecord);
        setStatus(STATUS.WORKING);
        setHasCheckedInToday(true);
        showToast("Punched Out successfully! See you tomorrow.", "success");
      } else {
        setTodayRecord(nextRecord);
        setStatus(STATUS.WORKING);
        setHasCheckedInToday(true);
        showToast("Punched In successfully! Have a great day.", "success");
      }

      await loadHistory();
    } catch (err) {
      console.error("❌ Punch In failed:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to Punch In. Please try again.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Punch Out ────────────────────────────────
  const handlePunchOut = async () => {
    setSubmitting(true);
    try {
      const result = await punchOut();
      const nextRecord = {
        inISO: result.inISO || todayRecord?.inISO || null,
        outISO: result.outISO || null,
      };

      if (nextRecord.outISO) {
        setTodayRecord(nextRecord);
        setStatus(STATUS.WORKING);
        setHasCheckedInToday(true);
        showToast("Punched Out successfully! See you tomorrow.", "success");
      } else if (nextRecord.inISO) {
        setTodayRecord(nextRecord);
        setStatus(STATUS.WORKING);
        setHasCheckedInToday(true);
        showToast("Punched In successfully! Have a great day.", "success");
      }

      await loadHistory(); // refresh table
    } catch (err) {
      console.error("❌ Punch Out failed:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to Punch Out. Please try again.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track your daily attendance and working hours
          </p>
        </div>

        {/* Live clock badge */}
        <LiveClock />
      </div>

      {/* ── Thought of the Day ── */}
      <div className="mb-5">
        <ThoughtCard />
      </div>

      {/* ── Today's card + punch buttons (EMPLOYEE, HR, ADMIN) ── */}
      {(isEmployee || isAdminOrHR) && (
        <div className="mb-6">
          <AttendanceCard
            status={status}
            canPunchIn={!hasCheckedInToday}
            canPunchOut={hasCheckedInToday}
            todayRecord={todayRecord}
            onPunchIn={handlePunchIn}
            onPunchOut={handlePunchOut}
            submitting={submitting}
          />
        </div>
      )}

      {/* ── Attendance History Table ── */}
      <AttendanceTable
        records={history}
        isAdminOrHR={isAdminOrHR}
        loading={loading}
      />

      {/* ── Toast ── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={clearToast} />
      )}
    </div>
  );
}

// ── Live clock widget ─────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(time.getHours() % 12 || 12).padStart(2, "0");
  const m = String(time.getMinutes()).padStart(2, "0");
  const s = String(time.getSeconds()).padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-100 shadow-sm px-4 py-2.5 rounded-xl">
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm font-mono font-semibold text-gray-700 tabular-nums">
        {h}:{m}:{s}{" "}
        <span className="text-gray-400 font-sans font-medium text-xs">
          {ampm}
        </span>
      </span>
    </div>
  );
}
