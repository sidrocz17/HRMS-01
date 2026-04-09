// src/components/leave/ApproveLeaveModal.jsx
// ─────────────────────────────────────────────
//  Approve/Reject Leave Modal
//  Shows leave details and action buttons
// ─────────────────────────────────────────────

import { useState } from "react";

export default function ApproveLeaveModal({
  leave,
  action,
  onApprove,
  onReject,
  onClose,
}) {
  const [remarks, setRemarks] = useState("");

  const handleApprove = () => {
    onApprove();
    setRemarks("");
  };

  const handleReject = () => {
    onReject(remarks);
    setRemarks("");
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {action === "reject" ? "Reject Leave Request" : "Approve Leave Request"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {action === "reject"
                ? "Provide a reason for rejection"
                : "Review and approve this request"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {action === "reject" ? (
            <>
              {/* Rejection Remarks Input */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Reason for Rejection <span className="text-red-500">*</span>
                </p>
                <textarea
                  rows={4}
                  placeholder="Explain the reason for rejecting this leave request..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none
                    focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all
                    resize-none placeholder:text-gray-300"
                />
              </div>
            </>
          ) : (
            <>
              {/* Employee Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Employee</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{leave.employee_name}</p>
                </div>
              </div>

              {/* Leave Details */}
              <div className="space-y-3">
                {/* Leave Type */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Leave Type</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{leave.leave_type}</p>
                  </div>
                </div>

                {/* Duration */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">From</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{leave.from_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">To</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{leave.to_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Days</p>
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                        {leave.days}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Applied On */}
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Applied On</p>
                  <p className="text-sm text-gray-600 mt-1">{leave.applied_on}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-semibold">
                  ⏳ Status: Pending Approval
                </p>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          {action === "reject" ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!remarks.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all"
              >
                Approve
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
