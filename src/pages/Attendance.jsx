// src/pages/Attendance.jsx
// ─────────────────────────────────────────────
//  Attendance Management
//  RBAC:
//    EMPLOYEE  → Punch In/Out + own history
//    HR/ADMIN  → Punch In/Out + view all records
// ─────────────────────────────────────────────

import { useMemo, useState, useEffect, useCallback } from "react";
import ThoughtCard from "../components/attendancePage/ThoughtCard";
import AttendanceCard from "../components/attendancePage/AttendanceCard";
import AttendanceTable from "../components/attendancePage/AttendanceTable";
import { useAttendance } from "../hooks/queries/useAttendance";
import { usePunchIn, usePunchOut } from "../hooks/mutations/useAttendancePunch";
import { attendancePunchSchema } from "../schemas/attendanceSchema";
import useAttendanceStore from "../store/useAttendanceStore";
import { getApiErrorMessage } from "../utils/leaveTransformers";
import { getUserFromToken } from "../utils/auth.js";

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
    date.getDate(),
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
    (record) => record.inISO || record.outISO,
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
  const { role, empId: loggedInEmployeeId } = getUserFromToken();
  const isAdminOrHR = role === "admin" || role === "hr";
  const isEmployee = role === "employee";
  const hasEmployeeId = Boolean(String(loggedInEmployeeId || "").trim());

  // ── Client/UI state ────────────────────────────
  const [toast, setToast] = useState(null); // { message, type }
  const selectedDate = useAttendanceStore((state) => state.selectedDate);
  const filters = useAttendanceStore((state) => state.filters);
  const setSelectedDate = useAttendanceStore((state) => state.setSelectedDate);
  const setFilters = useAttendanceStore((state) => state.setFilters);
  const resetFilters = useAttendanceStore((state) => state.resetFilters);

  const {
    data: attendanceRecords = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useAttendance({
    date: isAdminOrHR ? selectedDate : undefined,
    isAdminOrHR,
    enabled: hasEmployeeId,
  });

  const todayState = useMemo(
    () => deriveTodayState(attendanceRecords),
    [attendanceRecords],
  );

  const filteredRecords = useMemo(() => {
    const search = String(filters.search || "")
      .trim()
      .toLowerCase();
    const statusFilter = String(filters.status || "")
      .trim()
      .toUpperCase();

    return attendanceRecords.filter((record) => {
      const matchesDate =
        !isAdminOrHR || !selectedDate || record.dateISO === selectedDate;
      const matchesStatus =
        !statusFilter ||
        String(record.status || "").toUpperCase() === statusFilter;
      const matchesSearch =
        !search ||
        [record.employeeName, record.employeeId, record.remarks]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [
    attendanceRecords,
    filters.search,
    filters.status,
    isAdminOrHR,
    selectedDate,
  ]);

  // ── Helpers ───────────────────────────────────
  const showToast = (message, type = "success") => setToast({ message, type });
  const clearToast = useCallback(() => setToast(null), []);

  const buildPunchPayload = (punchType) =>
    attendancePunchSchema.parse({
      employeeId: loggedInEmployeeId,
      date: getTodayKey(),
      punchType,
      remarks: "",
    });

  const punchInMutation = usePunchIn({
    onSuccess: ({ message }) => showToast(message, "success"),
    onError: ({ message }) => showToast(message, "error"),
  });

  const punchOutMutation = usePunchOut({
    onSuccess: ({ message }) => showToast(message, "success"),
    onError: ({ message }) => showToast(message, "error"),
  });

  const submitting = punchInMutation.isPending || punchOutMutation.isPending;
  const pageError = !hasEmployeeId
    ? "Employee ID missing. Please log out and log in again."
    : isError
      ? getApiErrorMessage(error, "Failed to load attendance.")
      : "";

  // ── Punch In ──────────────────────────────────
  const handlePunchIn = async () => {
    try {
      await punchInMutation.mutateAsync(buildPunchPayload("IN"));
    } catch (err) {
      if (err?.issues) {
        showToast(err.issues[0]?.message || "Invalid punch request.", "error");
      }
    }
  };

  // ── Punch Out ────────────────────────────────
  const handlePunchOut = async () => {
    try {
      await punchOutMutation.mutateAsync(buildPunchPayload("OUT"));
    } catch (err) {
      if (err?.issues) {
        showToast(err.issues[0]?.message || "Invalid punch request.", "error");
      }
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
            status={todayState.status}
            canPunchIn={hasEmployeeId && !todayState.hasCheckedInToday}
            canPunchOut={hasEmployeeId && todayState.status === STATUS.WORKING}
            todayRecord={todayState.todayRecord}
            onPunchIn={handlePunchIn}
            onPunchOut={handlePunchOut}
            submitting={submitting}
          />
        </div>
      )}

      {pageError && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {pageError}
        </div>
      )}

      <div className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
        <div className="flex flex-wrap items-end gap-4">
          {isAdminOrHR && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
              />
            </label>
          )}

          {isAdminOrHR && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Search
              </span>
              <input
                type="search"
                value={filters.search}
                onChange={(event) => setFilters({ search: event.target.value })}
                placeholder="Employee or remarks"
                className="h-10 w-64 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </span>
            <select
              value={filters.status}
              onChange={(event) => setFilters({ status: event.target.value })}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
            >
              <option value="">All</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
          >
            Reset
          </button>

          {isFetching && !isLoading && (
            <span className="pb-2 text-xs font-medium text-gray-400">
              Refreshing...
            </span>
          )}
        </div>
      </div>

      {/* ── Attendance History Table ── */}
      <AttendanceTable
        records={filteredRecords}
        isAdminOrHR={isAdminOrHR}
        loading={isLoading}
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
