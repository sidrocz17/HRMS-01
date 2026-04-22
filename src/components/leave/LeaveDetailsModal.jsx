import { formatDisplayDate } from "../../utils/date";
import useEmployee from "../../hooks/useEmployee";

const formatValue = (value, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized ? normalized : fallback;
};

const formatDateValue = (value) => formatDisplayDate(value) || "-";

const resolveDisplayPerson = (directName, fallbackId, getEmployeeName) => {
  const normalizedDirectName = String(directName || "").trim();
  if (normalizedDirectName) return normalizedDirectName;

  const resolvedFromId = String(getEmployeeName(fallbackId) || "").trim();
  return resolvedFromId || "-";
};

const DetailItem = ({ label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-gray-800 break-all">
      {value}
    </p>
  </div>
);

const StatusPill = ({ status }) => {
  const normalized = String(status || "").trim().toUpperCase();

  const styles = {
    APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    REJECTED: "bg-red-50 text-red-700 ring-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        styles[normalized] || "bg-gray-100 text-gray-700 ring-gray-200"
      }`}
    >
      {formatValue(normalized || "PENDING")}
    </span>
  );
};

export default function LeaveDetailsModal({
  isOpen,
  details,
  isLoading,
  error,
  onClose,
}) {
  const { getEmployeeName } = useEmployee();
  const approvedByDisplay = resolveDisplayPerson(
    details?.approver,
    details?.approvedBy,
    getEmployeeName
  );
  const rejectedByDisplay = resolveDisplayPerson(
    details?.denier,
    details?.rejectedBy,
    getEmployeeName
  );

  if (!isOpen) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Leave Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review the full leave request information.
            </p>
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

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#1a2240]" />
                <p className="mt-3 text-sm text-gray-500">
                  Loading leave details...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : details ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Created By
                  </p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {formatValue(details.employeeName)}
                  </p>
                </div>
                <StatusPill status={details.status} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <DetailItem
                  label="Leave Application ID"
                  value={formatValue(details.leaveApplicationId)}
                />
                <DetailItem
                  label="Leave Type"
                  value={formatValue(details.leaveType)}
                />
                <DetailItem
                  label="Start Date"
                  value={formatDateValue(details.startDate)}
                />
                <DetailItem
                  label="End Date"
                  value={formatDateValue(details.endDate)}
                />
                <DetailItem
                  label="No. Of Days"
                  value={formatValue(details.noOfDays)}
                />
                <DetailItem
                  label="Created On"
                  value={formatDateValue(details.createdOn)}
                />
                <DetailItem
                  label="Approved By"
                  value={formatValue(approvedByDisplay)}
                />
                <DetailItem
                  label="Approved On"
                  value={formatDateValue(details.approvedOn)}
                />
                <DetailItem
                  label="Rejected By"
                  value={formatValue(rejectedByDisplay)}
                />
                <DetailItem
                  label="Rejected On"
                  value={formatDateValue(details.rejectedOn)}
                />
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Remarks
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  {formatValue(details.remarks)}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              No leave details available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
