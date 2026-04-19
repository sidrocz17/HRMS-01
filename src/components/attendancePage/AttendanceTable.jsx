// src/components/attendance/AttendanceTable.jsx

import { useState, useMemo } from "react";

const PAGE_SIZE = 8;

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

export default function AttendanceTable({ records = [], isAdminOrHR = false, loading = false }) {
  const [search, setSearch]       = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Filter ────────────────────────────────────
  const filtered = useMemo(() =>
    records.filter((r) => {
      const q = search.toLowerCase();
      return (
        (r.date         || "").toLowerCase().includes(q) ||
        (r.employeeName || "").toLowerCase().includes(q)
      );
    }), [records, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  // ── Columns ───────────────────────────────────
  const columns = [
    ...(isAdminOrHR ? ["Employee"] : []),
    "Date",
    "In Time",
    "Out Time",
    "Working Hours",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── Table header bar ── */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Attendance History</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isAdminOrHR ? "All employee attendance records" : "Your attendance records"}
          </p>
        </div>

        {/* Search + Export */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={isAdminOrHR ? "Search by employee or date..." : "Search by date..."}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none
                focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all
                placeholder:text-gray-300 w-64"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <button className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl transition-all">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {columns.map((col) => (
                <th key={col} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">

            {/* Loading */}
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">Loading records...</span>
                  </div>
                </td>
              </tr>

            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium">No attendance records found</p>
                    <p className="text-xs">
                      {search ? "Try adjusting your search" : "Records will appear here once you start marking attendance"}
                    </p>
                  </div>
                </td>
              </tr>

            ) : paginated.map((record) => (
              <tr
                key={record.id}
                className="group hover:bg-gray-50/80 transition-colors duration-100"
              >
                {/* Employee (HR/Admin only) */}
                {isAdminOrHR && (
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-[#1a2240]/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#1a2240]">
                        {(record.employeeName || "?").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                        {record.employeeName || "—"}
                      </span>
                    </div>
                  </td>
                )}

                {/* Date */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{record.date}</span>
                  </div>
                </td>

                {/* In Time */}
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {record.inTime || "—"}
                  </span>
                </td>

                {/* Out Time */}
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {record.outTime || "—"}
                  </span>
                </td>

                {/* Working Hours */}
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {record.workingHours || "—"}
                  </span>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-700">
            {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}
          </span>{" "}
          of <span className="font-medium text-gray-700">{filtered.length}</span> records
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

    </div>
  );
}
