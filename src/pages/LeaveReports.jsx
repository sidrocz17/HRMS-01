// src/pages/LeaveReports.jsx
// ─────────────────────────────────────────────
//  Leave Reports — HR / ADMIN only
//  Uses existing fetchTeamLeaves() from leaveApi.js
//  and existing fetchLeaveTypes() from leaveTypeApi.js
//  All filtering is client-side on fetched data
// ─────────────────────────────────────────────

import { useState, useEffect, useMemo } from "react";
import FiltersBar  from "../components/reports/FiltersBar";
import ReportsTable, { StatusBadge } from "../components/reports/ReportsTable";

// ── Import your existing API functions ─────────
import { fetchTeamLeaves }  from "../api/leaveApi";
import { fetchLeaveTypes }  from "../api/leaveTypeApi";

// ── CSV export helper ──────────────────────────
function exportToCSV(data, filename) {
  if (!data.length) return;
  const headers = ["Employee", "Leave Type", "From Date", "To Date", "Days", "Status"];
  const rows = data.map((r) => [
    r.employee_name,
    r.leave_type,
    r.from_date,
    r.to_date,
    r.days,
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
function SummaryCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl px-5 py-4 shadow-sm border border-gray-100 bg-white`}>
      <p className={`text-3xl font-bold leading-none ${color}`}>{value}</p>
      <p className="text-xs font-medium text-gray-400 mt-1.5">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
export default function LeaveReports() {
  // ── Raw data ───────────────────────────────────
  const [rawData, setRawData]         = useState([]);
  const [leaveTypes, setLeaveTypes]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [apiError, setApiError]       = useState("");

  // ── Filters ────────────────────────────────────
  const [search, setSearch]           = useState("");
  const [filterValues, setFilterValues] = useState({
    employee:  "",
    status:    "",
    leaveType: "",
    dateFrom:  "",
    dateTo:    "",
  });

  // ── Load data on mount (once) ──────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setApiError("");
      try {
        const [leaves, types] = await Promise.allSettled([
          fetchTeamLeaves(),
          fetchLeaveTypes(),
        ]);

        if (leaves.status === "fulfilled") {
          const raw = Array.isArray(leaves.value)
            ? leaves.value
            : Array.isArray(leaves.value?.data) ? leaves.value.data : [];

          // Normalise to consistent shape
          setRawData(raw.map((item, i) => ({
            id:            item.leaveApplicationId || item.leaveId || item.id || String(i),
            employee_name: item.employeeName || item.employee_name || item.empName || "—",
            leave_type:    item.leaveType || item.leaveTypeName || item.leave_type || "—",
            from_date:     item.startDate  || item.fromDate  || item.from_date  || "—",
            to_date:       item.endDate    || item.toDate    || item.to_date    || "—",
            days:          item.noOfDays   ?? item.days      ?? 0,
            status:        String(item.status || "PENDING").toUpperCase(),
            applied_on:    item.appliedOn  || item.appliedDate || item.createdAt || "—",
          })));
        } else {
          setApiError("Failed to load leave data.");
        }

        if (types.status === "fulfilled") {
          const raw = Array.isArray(types.value) ? types.value : Array.isArray(types.value?.data) ? types.value.data : [];
          setLeaveTypes(raw.map((t) => ({
            value: t.type || t.leaveType || t.name || "",
            label: t.type || t.leaveType || t.name || "",
          })).filter((t) => t.value));
        }
      } catch (err) {
        setApiError(err?.message || "Failed to load leave reports.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Unique employee list for filter ───────────
  const employeeOptions = useMemo(() => {
    const names = [...new Set(rawData.map((r) => r.employee_name).filter(Boolean))];
    return names.map((n) => ({ value: n, label: n }));
  }, [rawData]);

  // ── Client-side filter ─────────────────────────
  const filtered = useMemo(() => {
    return rawData.filter((r) => {
      const q = search.toLowerCase();
      if (q && !r.employee_name.toLowerCase().includes(q) && !r.leave_type.toLowerCase().includes(q)) return false;
      if (filterValues.employee  && r.employee_name !== filterValues.employee)  return false;
      if (filterValues.status    && r.status         !== filterValues.status)    return false;
      if (filterValues.leaveType && r.leave_type     !== filterValues.leaveType) return false;
      if (filterValues.dateFrom  && r.from_date < filterValues.dateFrom)         return false;
      if (filterValues.dateTo    && r.from_date > filterValues.dateTo)           return false;
      return true;
    });
  }, [rawData, search, filterValues]);

  // ── Summary counts from filtered data ─────────
  const summary = useMemo(() => ({
    total:    filtered.length,
    approved: filtered.filter((r) => r.status === "APPROVED").length,
    pending:  filtered.filter((r) => r.status === "PENDING").length,
    rejected: filtered.filter((r) => r.status === "REJECTED").length,
  }), [filtered]);

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
        { value: "APPROVED", label: "Approved" },
        { value: "PENDING",  label: "Pending"  },
        { value: "REJECTED", label: "Rejected" },
      ],
    },
    {
      key:     "leaveType",
      label:   "Leave Type",
      type:    "select",
      options: leaveTypes,
    },
    { key: "dateFrom", label: "From Date", type: "date" },
    { key: "dateTo",   label: "To Date",   type: "date" },
  ];

  // ── Table columns ──────────────────────────────
  const columns = [
    {
      key:    "employee_name",
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
    { key: "leave_type", label: "Leave Type" },
    { key: "from_date",  label: "From Date"  },
    { key: "to_date",    label: "To Date"    },
    {
      key:    "days",
      label:  "Days",
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
          {val ?? "—"}
        </span>
      ),
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
    setFilterValues({ employee: "", status: "", leaveType: "", dateFrom: "", dateTo: "" });
  };

  const handleExport = () =>
    exportToCSV(filtered, `leave-report-${new Date().toISOString().slice(0, 10)}.csv`);

  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leave Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View and export leave data across all employees
        </p>
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
        <SummaryCard label="Total Requests" value={summary.total}    color="text-[#1a2240]"     />
        <SummaryCard label="Approved"        value={summary.approved} color="text-emerald-600"   />
        <SummaryCard label="Pending"         value={summary.pending}  color="text-amber-600"     />
        <SummaryCard label="Rejected"        value={summary.rejected} color="text-red-600"       />
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
        resultCount={filtered.length}
      />

      {/* ── Table ── */}
      <ReportsTable columns={columns} data={filtered} loading={loading} />

    </div>
  );
}
