// src/components/leave/LeaveTable.jsx
// ─────────────────────────────────────────────
//  My Leaves — table showing user's leave requests
// ─────────────────────────────────────────────

const StatusBadge = ({ status }) => {
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

  const style = config[status] || config["Pending"];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
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

export default function LeaveTable({ data, onCancel }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Leave Type", "From Date", "To Date", "Days", "Status", "Applied On", "Actions"].map((col) => (
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
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm font-medium">No leaves found</p>
                    <p className="text-xs">Click "Apply Leave" to submit a new request</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((leave) => (
                <tr
                  key={leave.id}
                  className="group hover:bg-gray-50/80 transition-colors duration-100"
                >
                  {/* Leave Type */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1a2240]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#1a2240]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {leave.leave_type}
                      </span>
                    </div>
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
                      {leave.applied_on}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {/* Cancel (only for Pending) */}
                      {leave.status === "Pending" && (
                        <Tooltip text="Cancel">
                          <button
                            onClick={() => onCancel(leave.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </Tooltip>
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
