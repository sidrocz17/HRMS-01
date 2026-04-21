// src/pages/AttendanceReports.jsx
// ─────────────────────────────────────────────
//  Attendance Reports — HR / ADMIN only
//  Uses date-based getAllAttendance(date) from attendanceApi.js
//  All secondary filtering is client-side on fetched data
// ─────────────────────────────────────────────

import { useState, useEffect, useMemo } from "react";
import FiltersBar  from "../components/reports/FiltersBar";
import ReportsTable, { StatusBadge } from "../components/reports/ReportsTable";

// ── Import your existing API function ──────────
import { getAllAttendance } from "../api/attendanceApi";

// ── Working-hours threshold for LATE detection ─
const LATE_IN_TIME_24H = "09:30"; // any punch-in after this = Late

const pad = (value) => String(value).padStart(2, "0");

const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

// ── Derive attendance status from record ───────
function deriveStatus(record) {
  const apiStatus = String(record.status || "").trim().toUpperCase();
  if (apiStatus) return apiStatus;

  if (!record.inTime || record.inTime === "—") return "ABSENT";
  // Convert 12-hr display time → comparable string
  // inTime from your existing API is already formatted as "HH:MM AM/PM"
  const [timePart, meridiem] = String(record.inTime).trim().split(" ");
  if (!timePart || !meridiem) return "PRESENT";
  let [h, m] = timePart.split(":").map(Number);
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  const inAs24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return inAs24 > LATE_IN_TIME_24H ? "LATE" : "PRESENT";
}

// ── CSV export helper ──────────────────────────
function exportToCSV(data, filename) {
  if (!data.length) return;
  const headers = ["Employee", "Date", "In Time", "Out Time", "Working Hours", "Status"];
  const rows = data.map((r) => [
    r.employeeName,
    r.date,
    r.inTime,
    r.outTime,
    r.workingHours,
    r.status,
  ]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Summary card ───────────────────────────────
function SummaryCard({ label, value, color, sub }) {
  return (
    <div className="rounded-2xl px-5 py-4 shadow-sm border border-gray-100 bg-white">
      <p className={`text-3xl font-bold leading-none ${color}`}>{value}</p>
      <p className="text-xs font-medium text-gray-400 mt-1.5">{label}</p>
      {sub && <p className="text-xs text-gray-300 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
export default function AttendanceReports() {
  const todayDate = getTodayDate();

  // ── Raw data ───────────────────────────────────
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // ── Filters ────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState({
    employee: "",
    status:   "",
    dateFrom: todayDate,
  });

  // ── Load attendance when main date changes ────
  useEffect(() => {
    const load = async () => {
      const apiDate = filterValues.dateFrom || todayDate;

      setLoading(true);
      setApiError("");
      try {
        const data = await getAllAttendance(apiDate);
        const raw = Array.isArray(data) ? data : [];

        // Attach derived status
        const normalized = raw.map((r, i) => ({
          ...r,
          id:     r.id || `att-${i}`,
          status: deriveStatus(r),
        }));

        setAttendanceData(normalized);
      } catch (err) {
        console.error("❌ Attendance report load failed:", err);
        setAttendanceData([]);
        setApiError(err?.response?.data?.message || err?.message || "Failed to load attendance data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filterValues.dateFrom, todayDate]);

  // ── Client-side filter ─────────────────────────
  useEffect(() => {
    const nextFilteredData = attendanceData.filter((r) => {
      const q = search.toLowerCase().trim();
      const employeeName = String(r.employeeName || "");
      const rowDate = r.dateISO || r.inISO?.slice(0, 10) || r.outISO?.slice(0, 10) || "";

      if (
        q &&
        !employeeName.toLowerCase().includes(q) &&
        !String(r.date || "").toLowerCase().includes(q)
      ) {
        return false;
      }

      if (filterValues.employee && employeeName !== filterValues.employee) return false;
      if (filterValues.status && r.status !== filterValues.status) return false;
      if (filterValues.dateFrom && rowDate && rowDate !== filterValues.dateFrom) return false;

      return true;
    });

    setFilteredData(nextFilteredData);
  }, [attendanceData, search, filterValues]);

  // ── Unique employee options ────────────────────
  const employeeOptions = useMemo(() => {
    const names = [...new Set(attendanceData.map((r) => r.employeeName).filter(Boolean))];
    return names.map((n) => ({ value: n, label: n }));
  }, [attendanceData]);

  // ── Summary from filtered data ─────────────────
  const summary = useMemo(() => ({
    total:   filteredData.length,
    present: filteredData.filter((r) => r.status === "PRESENT").length,
    absent:  filteredData.filter((r) => r.status === "ABSENT").length,
    late:    filteredData.filter((r) => r.status === "LATE").length,
  }), [filteredData]);

  // ── Average working hours (present days only) ──
  const avgHours = useMemo(() => {
    const presentRows = filteredData.filter((r) => r.status === "PRESENT" && r.workingHours && r.workingHours !== "—");
    if (!presentRows.length) return "—";
    const total = presentRows.reduce((sum, r) => {
      // workingHours format: "Xh YYm"
      const match = String(r.workingHours).match(/(\d+)h\s*(\d+)m/);
      if (!match) return sum;
      return sum + parseInt(match[1]) * 60 + parseInt(match[2]);
    }, 0);
    const avgMin = Math.round(total / presentRows.length);
    return `${Math.floor(avgMin / 60)}h ${String(avgMin % 60).padStart(2, "0")}m`;
  }, [filteredData]);

  // ── Filter config ──────────────────────────────
  const filterConfig = [
    {
      key:     "employee",
      label:   "Employee",
      type:    "select",
      options: employeeOptions,
    },
    {
      key:     "status",
      label:   "Status",
      type:    "select",
      options: [
        { value: "PRESENT", label: "Present" },
        { value: "ABSENT",  label: "Absent"  },
        { value: "LATE",    label: "Late"    },
      ],
    },
    { key: "dateFrom", label: "Select Date", type: "date" },
  ];

  // ── Table columns ──────────────────────────────
  const columns = [
    {
      key:    "employeeName",
      label:  "Employee",
      render: (val) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#1a2240]/10 flex items-center justify-center text-[10px] font-bold text-[#1a2240] flex-shrink-0">
            {String(val || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <span className="font-medium text-gray-800">{val || "—"}</span>
        </div>
      ),
    },
    { key: "date", label: "Date" },
    {
      key:    "inTime",
      label:  "In Time",
      render: (val) => val && val !== "—" ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {val}
        </span>
      ) : <span className="text-gray-300 text-xs">—</span>,
    },
    {
      key:    "outTime",
      label:  "Out Time",
      render: (val) => val && val !== "—" ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          {val}
        </span>
      ) : <span className="text-gray-300 text-xs">—</span>,
    },
    {
      key:    "workingHours",
      label:  "Working Hours",
      render: (val) => val && val !== "—" ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {val}
        </span>
      ) : <span className="text-gray-300 text-xs">—</span>,
    },
    {
      key:    "status",
      label:  "Status",
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  const handleFilterChange = (key, value) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));

  const handleReset = () => {
    setSearch("");
    setFilterValues({ employee: "", status: "", dateFrom: todayDate });
  };

  const handleExport = () =>
    exportToCSV(filteredData, `attendance-report-${(filterValues.dateFrom || todayDate)}.csv`);

  const handleToday = () =>
    setFilterValues((prev) => ({
      ...prev,
      dateFrom: todayDate,
    }));

  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">

      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              View and export attendance records across all employees
            </p>
          </div>
          <button
            type="button"
            onClick={handleToday}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── Global error ── */}
      {apiError && (
        <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd" />
          </svg>
          {apiError}
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <SummaryCard label="Total Records"  value={summary.total}   color="text-[#1a2240]"   />
        <SummaryCard label="Present Days"   value={summary.present} color="text-emerald-600" />
        <SummaryCard label="Absent Days"    value={summary.absent}  color="text-red-600"     />
        <SummaryCard label="Late Entries"   value={summary.late}    color="text-amber-600"   sub={`Avg: ${avgHours}`} />
      </div>

      {/* ── Filters bar ── */}
      <FiltersBar
        search={search}
        onSearchChange={setSearch}
        filters={filterConfig}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleReset}
        onExport={handleExport}
        resultCount={filteredData.length}
      />

      {/* ── Table ── */}
      <ReportsTable columns={columns} data={filteredData} loading={loading} />

    </div>
  );
}
