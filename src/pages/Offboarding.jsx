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
import TerminationTable from "../components/offboarding/TerminationTable";
import {
  getOffboardingList,
  getTerminationList,
  applyResignation,
  approveRejectOffboarding,
  approveRejectTermination,
  initiateTermination,
} from "../api/offboardingApi";
import { deactivateEmployee } from "../api/employeeManagementApi";
import { getEmployees } from "../api/employeeManagementApi";
import { normalizeRole, ROLES } from "../config/roles.jsx";
import { getEmpIdFromToken, getRoleFromToken } from "../utils/auth.js";

// ── RBAC helpers ──────────────────────────────
const getRole = () => normalizeRole(getRoleFromToken()) || ROLES.EMPLOYEE;

const getEmpId = () => getEmpIdFromToken();

// ── Apply Resignation form initial state ───────
const EMPTY_APPLY = {
  resignationDate:        "",
  proposedLastWorkingDate: "",
  reason:                 "",
};

const EMPTY_TERMINATION_FORM = {
  empId: "",
  employeeName: "",
  terminationDate: "",
  reason: "",
  feedback: "",
  isGoodToRehire: false,
};

const pickEmployeeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.employees)) return payload.employees;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeEmployeeOption = (employee = {}) => {
  const empId =
    employee.emp_id ||
    employee.employee_id ||
    employee.empId ||
    employee.employeeId ||
    employee.id ||
    "";
  const firstName =
    employee.first_name || employee.firstName || employee.firstname || "";
  const lastName =
    employee.last_name || employee.lastName || employee.lastname || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    empId: String(empId || ""),
    employeeName:
      fullName ||
      employee.employeeName ||
      employee.name ||
      employee.email ||
      "Unknown Employee",
    email: employee.email || employee.email_id || employee.work_email || "",
    isActive:
      typeof employee.is_active === "boolean"
        ? employee.is_active
        : typeof employee.isActive === "boolean"
        ? employee.isActive
        : typeof employee.status === "string"
        ? employee.status.toLowerCase() === "active"
        : true,
  };
};

const normalizeTerminationRecord = (record = {}, fallback = {}) => ({
  terminationId:
    record.terminationId ||
    record.termination_id ||
    record.offboardingId ||
    record.offboarding_id ||
    fallback.terminationId ||
    fallback.offboardingId ||
    fallback.empId ||
    "",
  offboardingId:
    record.offboardingId ||
    record.offboarding_id ||
    record.terminationId ||
    record.termination_id ||
    fallback.offboardingId ||
    fallback.terminationId ||
    fallback.empId ||
    "",
  empId:
    record.empId ||
    record.emp_id ||
    record.employeeId ||
    record.employee_id ||
    fallback.empId ||
    "",
  employeeName:
    record.employeeName ||
    record.employee_name ||
    fallback.employeeName ||
    "—",
  terminationDate:
    record.terminationDate ||
    record.termination_date ||
    fallback.terminationDate ||
    "",
  finalLastWorkingDate:
    record.finalLastWorkingDate ||
    record.final_last_working_date ||
    fallback.finalLastWorkingDate ||
    null,
  reason: record.reason || fallback.reason || "",
  feedback: record.feedback || fallback.feedback || "",
  isGoodToRehire:
    typeof record.isGoodToRehire === "boolean"
      ? record.isGoodToRehire
      : typeof fallback.isGoodToRehire === "boolean"
      ? fallback.isGoodToRehire
      : false,
  status: record.status || fallback.status || "PENDING",
});

// ── View Detail Modal (EMPLOYEE + resolved records) ─
function ViewModal({ record, requestType = "resignation", onClose }) {
  if (!record) return null;

  const isTermination = requestType === "termination";

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
            {
              label: isTermination ? "Termination Date" : "Resignation Date",
              value: formatDate(
                isTermination ? record.terminationDate : record.resignationDate
              ),
            },
            {
              label: isTermination ? "Effective Last Day" : "Proposed Last Day",
              value: formatDate(
                isTermination
                  ? record.finalLastWorkingDate || record.terminationDate
                  : record.proposedLastWorkingDate
              ),
            },
            { label: "Final Last Day",        value: formatDate(record.finalLastWorkingDate) || "Not set" },
            { label: "Status",               value: record.status },
            { label: "Reason",               value: record.reason },
            ...(!isTermination
              ? [{ label: "Feedback", value: record.feedback || "—" }]
              : []),
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
  const [activeTab, setActiveTab] = useState("resignation-requests");
  const [offboardingList, setOffboardingList] = useState([]);
  const [terminationList, setTerminationList] = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [apiError, setApiError]               = useState("");

  // ── Apply modal (EMPLOYEE) ─────────────────────
  const [showApplyModal, setShowApplyModal]   = useState(false);
  const [applyForm, setApplyForm]             = useState(EMPTY_APPLY);
  const [applyErrors, setApplyErrors]         = useState({});
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyApiError, setApplyApiError]     = useState("");
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [terminationForm, setTerminationForm] = useState(
    EMPTY_TERMINATION_FORM
  );
  const [terminationErrors, setTerminationErrors] = useState({});
  const [terminationSubmitting, setTerminationSubmitting] = useState(false);
  const [terminationApiError, setTerminationApiError] = useState("");
  const [terminationEmployeeSearch, setTerminationEmployeeSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeOptionsLoading, setEmployeeOptionsLoading] = useState(false);

  // ── Approval modal (HR/ADMIN) ──────────────────
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequestType, setSelectedRequestType] = useState("resignation");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionApiError, setActionApiError]    = useState("");

  // ── View modal (all roles) ─────────────────────
  const [viewRecord, setViewRecord]           = useState(null);
  const [viewRequestType, setViewRequestType] = useState("resignation");

  // ── Load list ──────────────────────────────────
  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    setApiError("");
    try {
      const [resignationData, terminationData] = await Promise.all([
        getOffboardingList(),
        isAdminOrHR ? getTerminationList() : Promise.resolve([]),
      ]);
      const normalizedData = Array.isArray(resignationData)
        ? resignationData
        : [];
      const normalizedTerminationData = (Array.isArray(terminationData)
        ? terminationData
        : []
      ).map((record) => normalizeTerminationRecord(record));

      setOffboardingList(
        isAdminOrHR
          ? normalizedData
          : normalizedData.filter((record) => String(record.empId || "") === String(empId || ""))
      );
      setTerminationList(normalizedTerminationData);
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

  const loadEmployeeOptions = async () => {
    if (employeeOptionsLoading || employeeOptions.length > 0) return;

    setEmployeeOptionsLoading(true);
    try {
      const response = await getEmployees();
      const normalized = pickEmployeeList(response)
        .map(normalizeEmployeeOption)
        .filter((employee) => employee.empId && employee.isActive);
      setEmployeeOptions(normalized);
    } catch (err) {
      console.error("❌ Failed to load employees for termination:", err);
      setTerminationApiError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load employees."
      );
    } finally {
      setEmployeeOptionsLoading(false);
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

  const validateTermination = () => {
    const errs = {};

    if (!terminationForm.empId) errs.empId = "Employee is required.";
    if (!terminationForm.terminationDate)
      errs.terminationDate = "Termination date is required.";
    if (!terminationForm.reason.trim()) errs.reason = "Reason is required.";
    if (!terminationForm.feedback.trim())
      errs.feedback = "Feedback is required.";

    setTerminationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleTerminationChange = (field, value) => {
    setTerminationForm((prev) => ({ ...prev, [field]: value }));
    if (terminationErrors[field]) {
      setTerminationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const openTerminationModal = async () => {
    setTerminationForm(EMPTY_TERMINATION_FORM);
    setTerminationErrors({});
    setTerminationApiError("");
    setTerminationEmployeeSearch("");
    setShowTerminationModal(true);
    await loadEmployeeOptions();
  };

  const closeTerminationModal = () => {
    if (terminationSubmitting) return;
    setShowTerminationModal(false);
  };

  const handleEmployeeSelect = (employee) => {
    setTerminationForm((prev) => ({
      ...prev,
      empId: employee.empId,
      employeeName: employee.employeeName,
    }));
    setTerminationEmployeeSearch(employee.employeeName);
    setTerminationErrors((prev) => ({ ...prev, empId: "" }));
  };

  const handleInitiateTermination = async () => {
    if (!validateTermination()) return;

    setTerminationSubmitting(true);
    setTerminationApiError("");
    try {
      const payload = {
        empId: terminationForm.empId,
        terminationDate: terminationForm.terminationDate,
        reason: terminationForm.reason.trim(),
        feedback: terminationForm.feedback.trim(),
        isGoodToRehire: terminationForm.isGoodToRehire,
      };

      const response = await initiateTermination(payload);
      const createdRecord = normalizeTerminationRecord(response, {
        ...payload,
        employeeName: terminationForm.employeeName,
        status: "PENDING",
      });

      setTerminationList((prev) => [createdRecord, ...prev]);
      setShowTerminationModal(false);
      setTerminationForm(EMPTY_TERMINATION_FORM);
      setTerminationEmployeeSearch("");
    } catch (err) {
      console.error("❌ Termination initiation failed:", err);
      setTerminationApiError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to initiate termination."
      );
    } finally {
      setTerminationSubmitting(false);
    }
  };

  // ── Approve / Reject ───────────────────────────
  const handleAction = async (actionPayload) => {
    if (!selectedRequest) return;

    setActionSubmitting(true);
    setActionApiError("");
    try {
      const normalizedActionStatus = String(actionPayload.status || "").trim().toUpperCase();

      if (selectedRequestType === "termination") {
        const response = await approveRejectTermination(
          selectedRequest.offboardingId,
          actionPayload
        );
        const resolvedTerminationStatus = String(
          response?.status || normalizedActionStatus
        )
          .trim()
          .toUpperCase();

        if (resolvedTerminationStatus === "APPROVED") {
          const targetEmpId =
            selectedRequest.empId ||
            selectedRequest.employeeId ||
            response?.empId ||
            response?.employeeId ||
            "";

          if (!targetEmpId) {
            throw new Error("Employee ID missing for deactivation.");
          }

          await deactivateEmployee(targetEmpId);
          console.log("✅ Employee deactivated:", targetEmpId);
        }

        setTerminationList((prev) =>
          prev.map((record) =>
            record.offboardingId === selectedRequest.offboardingId
              ? {
                  ...record,
                  status: resolvedTerminationStatus,
                  finalLastWorkingDate:
                    response?.finalLastWorkingDate ||
                    actionPayload.finalLastWorkingDate ||
                    record.finalLastWorkingDate,
                  feedback:
                    response?.feedback ??
                    actionPayload.feedback,
                  isGoodToRehire:
                    typeof response?.isGoodToRehire === "boolean"
                      ? response.isGoodToRehire
                      : actionPayload.isGoodToRehire,
                }
              : record
          )
        );
      } else {
        const response = await approveRejectOffboarding(
          selectedRequest.offboardingId,
          actionPayload
        );
        console.log("✅ Action taken:", response);

        if (normalizedActionStatus === "APPROVED") {
          const targetEmpId =
            selectedRequest.empId ||
            selectedRequest.employeeId ||
            response?.empId ||
            response?.employeeId ||
            "";

          if (!targetEmpId) {
            throw new Error("Employee ID missing for deactivation.");
          }

          await deactivateEmployee(targetEmpId);
          console.log("✅ Employee deactivated:", targetEmpId);
        }

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
      }

      setSelectedRequest(null);
      setSelectedRequestType("resignation");
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

  const terminationInputCls = (field) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed
    ${
      terminationErrors[field]
        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
    }`;

  const TerminationErrMsg = ({ field }) =>
    terminationErrors[field] ? (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {terminationErrors[field]}
      </p>
    ) : null;

  const filteredEmployeeOptions = employeeOptions
    .filter((employee) =>
      employee.employeeName
        .toLowerCase()
        .includes(terminationEmployeeSearch.toLowerCase())
    )
    .slice(0, 8);
  const combinedRequests = [...offboardingList, ...terminationList];

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
              ? activeTab === "termination-requests"
                ? "Review and manage employee termination requests"
                : "Review and manage employee resignation requests"
              : "Submit and track your resignation request"}
          </p>
        </div>

        {/* Employee: apply resignation button */}
        {!isAdminOrHR && activeTab === "resignation-requests" && (
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

        {isAdminOrHR && (
          <button
            onClick={openTerminationModal}
            className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Initiate Termination
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
            { label: "Total",    value: combinedRequests.length,                                      color: "bg-[#1a2240]/10 text-[#1a2240]" },
            { label: "Pending",  value: combinedRequests.filter((r) => r.status === "PENDING").length,  color: "bg-amber-50 text-amber-700" },
            { label: "Approved", value: combinedRequests.filter((r) => r.status === "APPROVED").length, color: "bg-emerald-50 text-emerald-700" },
            { label: "Rejected", value: combinedRequests.filter((r) => r.status === "REJECTED").length, color: "bg-red-50 text-red-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl px-5 py-4 shadow-sm ${color} bg-white border border-gray-100`}>
              <p className="text-3xl font-bold leading-none">{value}</p>
              <p className="text-xs font-medium mt-1.5 opacity-70">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab("resignation-requests")}
            className={`pb-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "resignation-requests"
                ? "text-[#1a2240] border-[#1a2240]"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Resignation Requests
          </button>

          {isAdminOrHR && (
            <button
              onClick={() => setActiveTab("termination-requests")}
              className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "termination-requests"
                  ? "text-[#1a2240] border-[#1a2240]"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Termination Requests
            </button>
          )}
        </div>
      </div>

      {/* ── Resignation Requests ── */}
      {activeTab === "resignation-requests" && (
        <OffboardingTable
          data={offboardingList}
          isAdminOrHR={isAdminOrHR}
          loading={loading}
          onTakeAction={(record) => {
            setSelectedRequest(record);
            setSelectedRequestType("resignation");
            setActionApiError("");
          }}
          onView={(record) => {
            setViewRecord(record);
            setViewRequestType("resignation");
          }}
        />
      )}

      {/* ── Termination Requests ── */}
      {activeTab === "termination-requests" && isAdminOrHR && (
        <TerminationTable
          data={terminationList}
          loading={false}
          onTakeAction={(record) => {
            setSelectedRequest(record);
            setSelectedRequestType("termination");
            setActionApiError("");
          }}
          onView={(record) => {
            setViewRecord(record);
            setViewRequestType("termination");
          }}
        />
      )}

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

      {/* ── Initiate Termination Modal (HR / ADMIN) ── */}
      {showTerminationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !terminationSubmitting) {
              closeTerminationModal();
            }
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Initiate Termination
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Search and select an employee, then submit termination details
                </p>
              </div>
              <button
                onClick={closeTerminationModal}
                disabled={terminationSubmitting}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Search Employee <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-3 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search employee name..."
                    value={terminationEmployeeSearch}
                    onChange={(e) => {
                      setTerminationEmployeeSearch(e.target.value);
                      if (terminationForm.empId) {
                        setTerminationForm((prev) => ({
                          ...prev,
                          empId: "",
                          employeeName: "",
                        }));
                      }
                    }}
                    disabled={terminationSubmitting}
                    className={`${terminationInputCls("empId")} pl-9`}
                  />
                </div>
                <div className="mt-2 border border-gray-200 rounded-xl max-h-52 overflow-y-auto bg-gray-50/50">
                  {employeeOptionsLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Loading employees...
                    </div>
                  ) : filteredEmployeeOptions.length > 0 ? (
                    filteredEmployeeOptions.map((employee) => (
                      <button
                        key={employee.empId}
                        type="button"
                        onClick={() => handleEmployeeSelect(employee)}
                        className={`w-full px-4 py-3 text-left hover:bg-white transition-colors border-b last:border-b-0 border-gray-100 ${
                          terminationForm.empId === employee.empId
                            ? "bg-white"
                            : ""
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {employee.employeeName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {employee.email || employee.empId}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No employees found.
                    </div>
                  )}
                </div>
                {terminationForm.empId && (
                  <p className="mt-2 text-xs text-emerald-700">
                    Selected employee ID: {terminationForm.empId}
                  </p>
                )}
                <TerminationErrMsg field="empId" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Termination Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={terminationForm.terminationDate}
                  onChange={(e) =>
                    handleTerminationChange("terminationDate", e.target.value)
                  }
                  disabled={terminationSubmitting}
                  className={terminationInputCls("terminationDate")}
                />
                <TerminationErrMsg field="terminationDate" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter termination reason..."
                  value={terminationForm.reason}
                  onChange={(e) =>
                    handleTerminationChange("reason", e.target.value)
                  }
                  disabled={terminationSubmitting}
                  className={`${terminationInputCls("reason")} resize-none`}
                />
                <TerminationErrMsg field="reason" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter feedback..."
                  value={terminationForm.feedback}
                  onChange={(e) =>
                    handleTerminationChange("feedback", e.target.value)
                  }
                  disabled={terminationSubmitting}
                  className={`${terminationInputCls("feedback")} resize-none`}
                />
                <TerminationErrMsg field="feedback" />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Eligible for Rehire
                  </p>
                  <p className="text-xs text-gray-400">
                    {terminationForm.isGoodToRehire
                      ? "Employee can be rehired in the future"
                      : "Employee is not eligible for rehire"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleTerminationChange(
                      "isGoodToRehire",
                      !terminationForm.isGoodToRehire
                    )
                  }
                  disabled={terminationSubmitting}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                    terminationForm.isGoodToRehire
                      ? "bg-emerald-500"
                      : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                      terminationForm.isGoodToRehire
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {terminationApiError && (
              <div className="px-6 pb-2">
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {terminationApiError}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={closeTerminationModal}
                disabled={terminationSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateTermination}
                disabled={terminationSubmitting}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm ${
                  terminationSubmitting
                    ? "bg-[#1a2240]/60 cursor-not-allowed"
                    : "bg-[#1a2240] hover:bg-[#243055] active:scale-95"
                }`}
              >
                {terminationSubmitting ? "Submitting..." : "Create Termination"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approval Modal (HR / ADMIN) ── */}
      {selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          requestType={selectedRequestType}
          submitting={actionSubmitting}
          apiError={actionApiError}
          onApprove={handleAction}
          onReject={handleAction}
          onClose={() => {
            if (!actionSubmitting) {
              setSelectedRequest(null);
              setSelectedRequestType("resignation");
              setActionApiError("");
            }
          }}
        />
      )}

      {/* ── View Modal ── */}
      {viewRecord && (
        <ViewModal
          record={viewRecord}
          requestType={viewRequestType}
          onClose={() => {
            setViewRecord(null);
            setViewRequestType("resignation");
          }}
        />
      )}

    </div>
  );
}
