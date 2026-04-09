// src/components/leave/LeaveBalanceSection.jsx
// ─────────────────────────────────────────────
//  Leave Balance — compact, category-wise display
//  Replaces generic dashboard cards
// ─────────────────────────────────────────────

export default function LeaveBalanceSection({ data }) {
  return (
    <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Leave Balance</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Leave Type", "Total", "Used", "Remaining"].map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                {/* Leave Type */}
                <td className="px-6 py-3">
                  <span className="text-sm font-medium text-gray-800">
                    {item.leave_type}
                  </span>
                </td>

                {/* Total */}
                <td className="px-6 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                    {item.total}
                  </span>
                </td>

                {/* Used */}
                <td className="px-6 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                    {item.used}
                  </span>
                </td>

                {/* Remaining */}
                <td className="px-6 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    {item.remaining}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
