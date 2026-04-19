// src/components/leave/TeamLeaveTable.jsx
// ─────────────────────────────────────────────
//  Team Leaves — HR/Admin only, shows all team leave requests
// ─────────────────────────────────────────────

import { useState } from "react";

const StatusBadge = ({ status }) => {
  const normalizedStatus = (() => {
    const value = String(status || "").trim().toLowerCase();
    if (!value) return "Pending";
    return value.charAt(0).toUpperCase() + value.slice(1);
  })();

  const config = {
    Approved: {
      dot: "bg-emerald-400",
      pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    },
    Pending: {
      dot: "bg-amber-400",
      pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    },
    Rejected: {
      dot: "bg-red-400",
      pill: "bg-red-50 text-red-600 ring-1 ring-red-200",
    },
  };

  const style = config[normalizedStatus] || config["Pending"];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {normalizedStatus}
    </span>
  );
};

const Tooltip = ({ text, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-10">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
    </div>
  </div>
);

export default function TeamLeaveTable({ data, role, onApprove }) {
  const [search, setSearch] = useState("");

  const filtered = data.filter(
    (leave) =>
      String(leave.employee_name || "").toLowerCase().includes(search.toLowerCase()) ||
      String(leave.leave_type || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by employee or leave type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none
              focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all placeholder:text-gray-300"
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Employee Name", "Leave Type", "From Date", "To Date", "Days", "Status", "Applied On", "Actions"].map((col) => (
                <th
                  key={col}
                  className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-medium">No team leaves found</p>
                    <p className="text-xs">
                      {search ? "Try adjusting your search" : "No pending approvals"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((leave) => (
                <tr
                  key={leave.id}
                  className="group hover:bg-gray-50/80 transition-colors duration-100"
                >
                  {/* Employee Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1a2240]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#1a2240]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {leave.employee_name}
                      </span>
                    </div>
                  </td>

                  {/* Leave Type */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{leave.leave_type}</span>
                  </td>

                  {/* From Date */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{leave.from_date}</span>
                  </td>

                  {/* To Date */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{leave.to_date}</span>
                  </td>

                  {/* Days */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                      {leave.days} {leave.days === 1 ? "day" : "days"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={leave.status} />
                  </td>

                  {/* Applied On */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {leave.applied_on || "-"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {/* Approve (only for Pending) */}
                      {String(leave.status || "").trim().toLowerCase() === "pending" && (
                        <>
                          <Tooltip text="Approve">
                            <button
                              onClick={() => onApprove(leave, "approve")}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-150"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </Tooltip>

                          <Tooltip text="Reject">
                            <button
                              onClick={() => onApprove(leave, "reject")}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
