const statusClasses = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PRESENT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  LATE: "bg-amber-50 text-amber-700 ring-amber-200",
  ABSENT: "bg-red-50 text-red-700 ring-red-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  INACTIVE: "bg-red-50 text-red-700 ring-red-200",
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const formatText = (value, fallback = "-") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

function StatusPill({ value }) {
  const normalized = String(value || "").trim().toUpperCase();

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
        statusClasses[normalized] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {formatText(value)}
    </span>
  );
}

function EmptyState({ type }) {
  const label =
    type === "attendance" ? "attendance records" : "leave records";

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
      <svg
        className="mx-auto h-10 w-10 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M9 12h6m-6 4h6M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
        />
      </svg>
      <p className="mt-3 text-sm font-medium text-gray-700">
        No {label} found
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Records will appear here once data is available from the API.
      </p>
    </div>
  );
}

function AttendanceTable({ records }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                In
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Out
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Hours
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {toArray(records).map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {formatText(record.date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatText(record.inTime)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatText(record.outTime)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatText(record.workingHours)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <StatusPill value={record.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatText(record.remarks)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeaveTable({ records }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Leave Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                From
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                To
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Days
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Applied On
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {toArray(records).map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {formatText(record.leave_type)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatText(record.from_date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatText(record.to_date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatText(record.days)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <StatusPill value={record.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatText(record.applied_on)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EmployeeRecordsModal({
  isOpen,
  type,
  employeeName,
  records,
  isLoading,
  error,
  onClose,
}) {
  if (!isOpen) return null;

  const isAttendance = type === "attendance";
  const title = isAttendance ? "Attendance Records" : "Leave Records";
  const subtitle = isAttendance
    ? "Review this employee's attendance history."
    : "Review this employee's leave history.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
          <div className="mb-5 rounded-2xl bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Employee
            </p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {formatText(employeeName)}
            </p>
          </div>

          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#1a2240]" />
                <p className="mt-3 text-sm text-gray-500">
                  Loading {isAttendance ? "attendance" : "leave"} records...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : toArray(records).length === 0 ? (
            <EmptyState type={type} />
          ) : isAttendance ? (
            <AttendanceTable records={records} />
          ) : (
            <LeaveTable records={records} />
          )}
        </div>
      </div>
    </div>
  );
}
