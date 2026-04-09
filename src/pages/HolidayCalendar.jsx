// src/pages/HolidayCalendar.jsx
// ─────────────────────────────────────────────
//  Holiday Calendar Management Page
//  RBAC: Admin only for Add/Edit/Delete
//  UI: Consistent with Department / Designation pages
// ─────────────────────────────────────────────

import { useState, useMemo } from "react";
import { useHolidays }   from "../components/holiday/useHolidays";
import HolidayForm       from "../components/holiday/HolidayForm";
import DeleteConfirm     from "../components/holiday/DeleteConfirm";
import { HOLIDAY_TYPES, getYearOptions } from "../api/holidayApi";
import { normalizeRole } from "../config/roles.jsx";

const PAGE_SIZE = 10;

// ── Tooltip ───────────────────────────────────
const Tooltip = ({ text, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800
      text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity
      duration-150 whitespace-nowrap pointer-events-none z-10">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
    </div>
  </div>
);

// ── Holiday type badge ────────────────────────
const TypeBadge = ({ type }) => {
  const config = HOLIDAY_TYPES[type] || HOLIDAY_TYPES["National Holiday"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

// ── Format date nicely ────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric"
  });
};

// ── Month group label ─────────────────────────
const getMonthLabel = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

// ── Days until holiday ────────────────────────
const getDaysUntil = (dateStr) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7)  return `In ${diff} days`;
  return null;
};

export default function HolidayCalendar() {
  // ── RBAC ──────────────────────────────────────
  const role = normalizeRole(localStorage.getItem("role"));
  const isAdmin = role === "admin";

  // ── Year ──────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const yearOptions = getYearOptions();

  // ── Holiday hook ──────────────────────────────
  const {
    holidays, loading, submitting, apiError, setApiError,
    selectedYear, setSelectedYear,
    isDuplicateDate,
    addHoliday, editHoliday, removeHoliday,
  } = useHolidays(currentYear);

  // ── Local UI state ────────────────────────────
  const [search, setSearch]             = useState("");
  const [typeFilter, setTypeFilter]     = useState("all");
  const [currentPage, setCurrentPage]   = useState(1);
  const [showForm, setShowForm]         = useState(false);
  const [formMode, setFormMode]         = useState("add");
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Filtered list ─────────────────────────────
  const filtered = useMemo(() =>
    holidays.filter((h) => {
      const matchSearch = (h.holidayName || "").toLowerCase().includes(search.toLowerCase());
      const matchType   = typeFilter === "all" || String(h.holidayType) === typeFilter;
      return matchSearch && matchType;
    }), [holidays, search, typeFilter]
  );

  // ── Paginated ─────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Summary counts ────────────────────────────
  const counts = useMemo(() => ({
    total:    holidays.length,
    national: holidays.filter((h) => h.holidayType === "National Holiday").length,
    optional: holidays.filter((h) => h.holidayType === "Optional Holiday").length,
    company:  holidays.filter((h) => h.holidayType === "Company Holiday").length,
  }), [holidays]);

  // ── Upcoming holiday ──────────────────────────
  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return holidays.find((h) => new Date(h.holidayDate + "T00:00:00") >= today) || null;
  }, [holidays]);

  // ── CRUD handlers ─────────────────────────────
  const handleAdd = () => {
    setFormMode("add");
    setEditTarget(null);
    setApiError("");
    setShowForm(true);
  };

  const handleEdit = (h) => {
    setFormMode("edit");
    setEditTarget(h);
    setApiError("");
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    const success = formMode === "add"
      ? await addHoliday(formData)
      : await editHoliday(editTarget.id, formData);
    if (success) {
      setShowForm(false);
      setCurrentPage(1);
    }
  };

  const handleDeleteConfirm = async () => {
    const success = await removeHoliday(deleteTarget.id);
    if (success) {
      setDeleteTarget(null);
    }
  };

  // ── Pagination numbers ────────────────────────
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  // ── Access Denied ─────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Access Denied</h2>
          <p className="text-sm text-gray-500">You don't have permission to manage holidays.</p>
          <p className="text-xs text-gray-400 mt-1">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Holiday Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage company holidays for the calendar year
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setCurrentPage(1); }}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all cursor-pointer"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Holiday
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Holidays", value: counts.total,    color: "bg-[#1a2240]", text: "text-white",       sub: "text-white/60"  },
          { label: "National",       value: counts.national, color: "bg-blue-50",   text: "text-blue-700",    sub: "text-blue-400"  },
          { label: "Optional",       value: counts.optional, color: "bg-amber-50",  text: "text-amber-700",   sub: "text-amber-400" },
          { label: "Company",        value: counts.company,  color: "bg-violet-50", text: "text-violet-700",  sub: "text-violet-400"},
        ].map((card) => (
          <div key={card.label} className={`${card.color} rounded-2xl px-5 py-4 shadow-sm`}>
            <p className={`text-3xl font-bold ${card.text} leading-none`}>{card.value}</p>
            <p className={`text-xs font-medium ${card.sub} mt-1.5`}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── Upcoming holiday banner ── */}
      {upcoming && getDaysUntil(upcoming.holidayDate) && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              {getDaysUntil(upcoming.holidayDate)}: {upcoming.holidayName}
            </p>
            <p className="text-xs text-emerald-600">{formatDate(upcoming.holidayDate)}</p>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">

        {/* Left — search + type filter */}
        <div className="flex items-center gap-3 flex-1">

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search holidays..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none
                focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all placeholder:text-gray-300"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Type filter pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { value: "all", label: "All" },
              { value: "National Holiday", label: "National" },
              { value: "Optional Holiday", label: "Optional" },
              { value: "Company Holiday", label: "Company"  },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => { setTypeFilter(f.value); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  typeFilter === f.value
                    ? "bg-white text-[#1a2240] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full">

            {/* Head */}
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Holiday Name", "Date", "Type", "Year", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-50">

              {/* Loading */}
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Loading holidays...</span>
                    </div>
                  </td>
                </tr>

              ) : paginated.length === 0 ? (

                /* Empty state */
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                        <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">No holidays found</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {search
                            ? "Try adjusting your search"
                            : `No holidays configured for ${selectedYear}`}
                        </p>
                      </div>
                      {!search && (
                        <button
                          onClick={handleAdd}
                          className="mt-1 text-xs font-semibold text-[#1a2240] hover:underline"
                        >
                          + Add first holiday
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

              ) : paginated.map((h) => {
                const daysUntil = getDaysUntil(h.holidayDate);
                const isPast    = new Date(h.holidayDate + "T00:00:00") < new Date(new Date().setHours(0,0,0,0));

                return (
                  <tr
                    key={h.id}
                    className={`group transition-colors duration-100 hover:bg-gray-50/80 ${isPast ? "opacity-50" : ""}`}
                  >
                    {/* Holiday Name */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1a2240]/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#1a2240]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{h.holidayName}</span>
                          {daysUntil && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                              {daysUntil}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 font-medium">
                        {formatDate(h.holidayDate)}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4">
                      <TypeBadge type={h.holidayType} />
                    </td>

                    {/* Year */}
                    <td className="px-4 py-4">
                      <span className="text-sm font-mono font-medium text-gray-500">{h.calendarYear}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">

                        <Tooltip text="Edit">
                          <button
                            onClick={() => handleEdit(h)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </Tooltip>

                        <Tooltip text="Delete">
                          <button
                            onClick={() => setDeleteTarget(h)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </Tooltip>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of <span className="font-medium text-gray-700">{filtered.length}</span> holidays
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span key={`e-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 text-sm font-medium rounded-lg transition-all ${
                      currentPage === page
                        ? "bg-[#1a2240] text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Modals ── */}
      {showForm && (
        <HolidayForm
          mode={formMode}
          initial={editTarget}
          isDuplicateDate={isDuplicateDate}
          submitting={submitting}
          apiError={apiError}
          onSubmit={handleFormSubmit}
          onClose={() => {
            if (!submitting) {
              setShowForm(false);
              setApiError("");
            }
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          holidayName={deleteTarget.holidayName}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
