// src/components/offboarding/ApprovalModal.jsx
// ─────────────────────────────────────────────
//  HR / ADMIN: Approve or Reject a resignation request
//  Follows same modal style as ApproveLeaveModal.jsx
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";

const EMPTY_FORM = {
  finalLastWorkingDate: "",
  feedback:             "",
  isGoodToRehire:       true,
};

export default function ApprovalModal({
  request,      // offboarding record
  requestType = "resignation",
  submitting,
  apiError,
  onApprove,    // (formData) => void
  onReject,     // (formData) => void
  onClose,
}) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(EMPTY_FORM);
    setErrors({});
  }, [request]);

  if (!request) return null;

  const isTermination = requestType === "termination";
  const requestLabel = isTermination ? "termination" : "resignation";
  const primaryDateLabel = isTermination ? "Termination Date" : "Resignation Date";
  const secondaryDateLabel = isTermination
    ? "Effective Last Working Date"
    : "Proposed Last Day";

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ── Validate per action ────────────────────
  const validate = (action) => {
    const newErrors = {};
    if (action === "APPROVED" && !form.finalLastWorkingDate) {
      newErrors.finalLastWorkingDate = "Final last working date is required for approval.";
    }
    if (action === "REJECTED" && !form.feedback.trim()) {
      newErrors.feedback = "Feedback is required for rejection.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildActionPayload = (status) => ({
    status,
    finalLastWorkingDate:
      status === "APPROVED"
        ? form.finalLastWorkingDate
        : form.finalLastWorkingDate || null,
    feedback: form.feedback.trim(),
    ...(isTermination ? {} : { isGoodToRehire: form.isGoodToRehire }),
  });

  const handleApprove = () => {
    if (!validate("APPROVED")) return;
    onApprove(buildActionPayload("APPROVED"));
  };

  const handleReject = () => {
    if (!validate("REJECTED")) return;
    onReject(buildActionPayload("REJECTED"));
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  // ── Shared input class ────────────────────
  const inputCls = (field) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed
    ${errors[field]
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
    }`;

  const ErrMsg = ({ field }) =>
    errors[field] ? (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    ) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Take Action</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {`Review and approve or reject this ${requestLabel} request`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Request summary ── */}
        <div className="mx-6 mt-5 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-2.5">
          <DetailRow label="Employee"               value={request.employeeName} />
          <DetailRow
            label={primaryDateLabel}
            value={formatDate(isTermination ? request.terminationDate : request.resignationDate)}
          />
          <DetailRow
            label={secondaryDateLabel}
            value={formatDate(
              isTermination
                ? request.finalLastWorkingDate || request.terminationDate
                : request.proposedLastWorkingDate
            )}
          />
          {request.reason && (
            <DetailRow label="Reason" value={request.reason} />
          )}
        </div>

        {/* ── Form ── */}
        <div className="px-6 py-5 space-y-4">

          {/* Final Last Working Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Final Last Working Date
              <span className="text-red-500 ml-0.5">*</span>
              <span className="text-gray-400 font-normal ml-1">(required for Approval)</span>
            </label>
            <input
              type="date"
              value={form.finalLastWorkingDate}
              onChange={(e) => handleChange("finalLastWorkingDate", e.target.value)}
              disabled={submitting}
              className={inputCls("finalLastWorkingDate")}
            />
            <ErrMsg field="finalLastWorkingDate" />
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Feedback
              <span className="text-gray-400 font-normal ml-1">(required for Rejection)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Add your feedback or remarks..."
              value={form.feedback}
              onChange={(e) => handleChange("feedback", e.target.value)}
              disabled={submitting}
              className={`${inputCls("feedback")} resize-none`}
            />
            <ErrMsg field="feedback" />
          </div>

        </div>

        {/* ── API Error ── */}
        {apiError && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd" />
              </svg>
              {apiError}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={submitting}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-sm ${
              submitting
                ? "bg-red-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 active:scale-95"
            }`}
          >
            {submitting ? "Processing..." : "Reject"}
          </button>
          <button
            onClick={handleApprove}
            disabled={submitting}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-sm ${
              submitting
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
            }`}
          >
            {submitting ? "Processing..." : "Approve"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Small detail row inside summary card ───────
function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{label}</span>
      <span className="text-xs font-semibold text-gray-800 text-right">{value || "—"}</span>
    </div>
  );
}

// ── Format date helper ─────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
