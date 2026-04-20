// src/pages/Offboarding.jsx
// ─────────────────────────────────────────────
//  Offboarding Management Page
//  RBAC:
//    EMPLOYEE → Apply resignation + view own requests
//    HR/ADMIN → View all requests + Approve / Reject
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import OffboardingTable from "../components/offboarding/OffboardingTable";
import ApprovalModal    from "../components/offboarding/ApprovalModal";
import {
  getOffboardingList,
  applyResignation,
  approveRejectOffboarding,
} from "../api/offboardingApi";
import { normalizeRole, ROLES } from "../config/roles.jsx";

// ── RBAC helpers ──────────────────────────────
const getRole = () => normalizeRole(localStorage.getItem("role")) || ROLES.EMPLOYEE;

const getEmpId = () => {
  try {
    const user        = JSON.parse(localStorage.getItem("user")        || "{}");
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
    return (
      localStorage.getItem("employeeId") ||
      user.employeeId  || user.empId  || user.emp_id  ||
      userDetails.empId || userDetails.emp_id || userDetails.employeeId ||
      user.id          || ""
    );
  } catch {
    return localStorage.getItem("employeeId") || "";
  }
};

// ── Apply Resignation form initial state ───────
const EMPTY_APPLY = {
  resignationDate:        "",
  proposedLastWorkingDate: "",
  reason:                 "",
};

// ── View Detail Modal (EMPLOYEE + resolved records) ─
function ViewModal({ record, onClose }) {
  if (!record) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Request Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {[
            { label: "Employee",              value: record.employeeName },
            { label: "Resignation Date",      value: formatDate(record.resignationDate) },
            { label: "Proposed Last Day",     value: formatDate(record.proposedLastWorkingDate) },
            { label: "Final Last Day",        value: formatDate(record.finalLastWorkingDate) || "Not set" },
            { label: "Status",               value: record.status },
            { label: "Reason",               value: record.reason },
            { label: "Feedback",             value: record.feedback || "—" },
            { label: "Eligible for Rehire",  value: record.isGoodToRehire === false ? "No" : record.isGoodToRehire ? "Yes" : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{label}</span>
              <span className="text-xs font-semibold text-gray-800 text-right">{value || "—"}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────
export default function Offboarding() {
  const role        = getRole();
  const isAdminOrHR = role === ROLES.ADMIN || role === ROLES.HR;
  const empId       = getEmpId();

  // ── State ─────────────────────────────────────
  const [offboardingList, setOffboardingList] = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [apiError, setApiError]               = useState("");

  // ── Apply modal (EMPLOYEE) ─────────────────────
  const [showApplyModal, setShowApplyModal]   = useState(false);
  const [applyForm, setApplyForm]             = useState(EMPTY_APPLY);
  const [applyErrors, setApplyErrors]         = useState({});
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyApiError, setApplyApiError]     = useState("");

  // ── Approval modal (HR/ADMIN) ──────────────────
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionApiError, setActionApiError]    = useState("");

  // ── View modal (all roles) ─────────────────────
  const [viewRecord, setViewRecord]           = useState(null);

  // ── Load list ──────────────────────────────────
  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    setApiError("");
    try {
      const data = await getOffboardingList();
      const normalizedData = Array.isArray(data) ? data : [];
      setOffboardingList(
        isAdminOrHR
          ? normalizedData
          : normalizedData.filter((record) => String(record.empId || "") === String(empId || ""))
      );
    } catch (err) {
      console.error("❌ Failed to load offboarding list:", err);
      setApiError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load records."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Apply resignation ──────────────────────────
  const validateApply = () => {
    const errs = {};
    if (!applyForm.resignationDate)         errs.resignationDate        = "Resignation date is required.";
    if (!applyForm.proposedLastWorkingDate) errs.proposedLastWorkingDate = "Proposed last working date is required.";
    if (!applyForm.reason.trim())           errs.reason                 = "Reason is required.";
    if (
      applyForm.resignationDate &&
      applyForm.proposedLastWorkingDate &&
      applyForm.proposedLastWorkingDate < applyForm.resignationDate
    ) {
      errs.proposedLastWorkingDate = "Proposed last day must be after resignation date.";
    }
    setApplyErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleApplySubmit = async () => {
    if (!validateApply()) return;

    if (!empId) {
      setApplyApiError("Employee ID missing. Please log out and log in again.");
      return;
    }

    setApplySubmitting(true);
    setApplyApiError("");
    try {
      const payload = {
        empId,
        resignationDate:        applyForm.resignationDate,
        proposedLastWorkingDate: applyForm.proposedLastWorkingDate,
        reason:                 applyForm.reason.trim(),
      };
      const response = await applyResignation(payload);
      console.log("✅ Resignation applied:", response);

      // Prepend new record to list
      setOffboardingList((prev) => [response, ...prev]);
      setShowApplyModal(false);
      setApplyForm(EMPTY_APPLY);
    } catch (err) {
      console.error("❌ Apply resignation failed:", err);
      setApplyApiError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit resignation. Please try again."
      );
    } finally {
      setApplySubmitting(false);
    }
  };

  // ── Approve / Reject ───────────────────────────
  const handleAction = async (actionPayload) => {
    if (!selectedRequest) return;

    setActionSubmitting(true);
    setActionApiError("");
    try {
      const response = await approveRejectOffboarding(
        selectedRequest.offboardingId,
        actionPayload
      );
      console.log("✅ Action taken:", response);

      // Update local list
      setOffboardingList((prev) =>
        prev.map((r) =>
          r.offboardingId === selectedRequest.offboardingId
            ? {
                ...r,
                status:               response.status,
                finalLastWorkingDate: response.finalLastWorkingDate || actionPayload.finalLastWorkingDate,
                feedback:             actionPayload.feedback,
                isGoodToRehire:       actionPayload.isGoodToRehire,
              }
            : r
        )
      );

      setSelectedRequest(null);
    } catch (err) {
      console.error("❌ Action failed:", err);
      setActionApiError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to process request. Please try again."
      );
    } finally {
      setActionSubmitting(false);
    }
  };

  // ── Apply form field change ────────────────────
  const handleApplyChange = (field, value) => {
    setApplyForm((prev) => ({ ...prev, [field]: value }));
    if (applyErrors[field]) setApplyErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const inputCls = (field) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed
    ${applyErrors[field]
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
    }`;

  const ErrMsg = ({ field }) =>
    applyErrors[field] ? (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd" />
        </svg>
        {applyErrors[field]}
      </p>
    ) : null;

  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Offboarding Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdminOrHR
              ? "Review and manage employee resignation requests"
              : "Submit and track your resignation request"}
          </p>
        </div>

        {/* Employee: apply resignation button */}
        {!isAdminOrHR && (
          <button
            onClick={() => {
              setApplyForm(EMPTY_APPLY);
              setApplyErrors({});
              setApplyApiError("");
              setShowApplyModal(true);
            }}
            className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Apply Resignation
          </button>
        )}
      </div>

      {/* ── Global error ── */}
      {apiError && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd" />
          </svg>
          {apiError}
        </div>
      )}

      {/* ── Summary strip — HR/ADMIN ── */}
      {isAdminOrHR && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",    value: offboardingList.length,                                      color: "bg-[#1a2240]/10 text-[#1a2240]" },
            { label: "Pending",  value: offboardingList.filter((r) => r.status === "PENDING").length,  color: "bg-amber-50 text-amber-700" },
            { label: "Approved", value: offboardingList.filter((r) => r.status === "APPROVED").length, color: "bg-emerald-50 text-emerald-700" },
            { label: "Rejected", value: offboardingList.filter((r) => r.status === "REJECTED").length, color: "bg-red-50 text-red-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl px-5 py-4 shadow-sm ${color} bg-white border border-gray-100`}>
              <p className="text-3xl font-bold leading-none">{value}</p>
              <p className="text-xs font-medium mt-1.5 opacity-70">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <OffboardingTable
        data={offboardingList}
        isAdminOrHR={isAdminOrHR}
        loading={loading}
        onTakeAction={(record) => {
          setSelectedRequest(record);
          setActionApiError("");
        }}
        onView={(record) => setViewRecord(record)}
      />

      {/* ════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════ */}

      {/* ── Apply Resignation Modal (EMPLOYEE) ── */}
      {showApplyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget && !applySubmitting) setShowApplyModal(false); }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Apply Resignation</h2>
                <p className="text-xs text-gray-400 mt-0.5">Submit your resignation request</p>
              </div>
              <button
                onClick={() => !applySubmitting && setShowApplyModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">

              {/* Resignation Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Resignation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={applyForm.resignationDate}
                  onChange={(e) => handleApplyChange("resignationDate", e.target.value)}
                  disabled={applySubmitting}
                  className={inputCls("resignationDate")}
                />
                <ErrMsg field="resignationDate" />
              </div>

              {/* Proposed Last Working Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Proposed Last Working Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={applyForm.proposedLastWorkingDate}
                  onChange={(e) => handleApplyChange("proposedLastWorkingDate", e.target.value)}
                  disabled={applySubmitting}
                  className={inputCls("proposedLastWorkingDate")}
                />
                <ErrMsg field="proposedLastWorkingDate" />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter your reason for resignation..."
                  value={applyForm.reason}
                  onChange={(e) => handleApplyChange("reason", e.target.value)}
                  disabled={applySubmitting}
                  className={`${inputCls("reason")} resize-none`}
                />
                <ErrMsg field="reason" />
              </div>

            </div>

            {/* API Error */}
            {applyApiError && (
              <div className="px-6 pb-2">
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd" />
                  </svg>
                  {applyApiError}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => !applySubmitting && setShowApplyModal(false)}
                disabled={applySubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleApplySubmit}
                disabled={applySubmitting}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm ${
                  applySubmitting
                    ? "bg-[#1a2240]/60 cursor-not-allowed"
                    : "bg-[#1a2240] hover:bg-[#243055] active:scale-95"
                }`}
              >
                {applySubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : "Submit Resignation"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Approval Modal (HR / ADMIN) ── */}
      {selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          submitting={actionSubmitting}
          apiError={actionApiError}
          onApprove={handleAction}
          onReject={handleAction}
          onClose={() => {
            if (!actionSubmitting) {
              setSelectedRequest(null);
              setActionApiError("");
            }
          }}
        />
      )}

      {/* ── View Modal ── */}
      {viewRecord && (
        <ViewModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
        />
      )}

    </div>
  );
}
