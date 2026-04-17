// src/pages/LeaveManagement.jsx
// ─────────────────────────────────────────────
//  Leave Management — Full CRUD with RBAC
//  RBAC: EMPLOYEE (My Leaves only), HR (My + Team), ADMIN (My + Team all)
//  UI matches Department/Designation pages exactly
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import LeaveBalanceSection from "../components/leave/LeaveBalanceSection";
import LeaveTable from "../components/leave/LeaveTable";
import TeamLeaveTable from "../components/leave/TeamLeaveTable";
import ApplyLeaveModal from "../components/leave/ApplyLeaveModal";
import ApproveLeaveModal from "../components/leave/ApproveLeaveModal";
import PostYearlyLeavesModal from "../components/modals/PostYearlyLeavesModal";
import {
  applyLeave,
  fetchLeaveBalance,
  fetchLeaveHistory,
  fetchTeamLeaves,
  approveRejectLeave,
  postYearlyLeavesForAllEmployees,
} from "../api/leaveApi";
import { fetchLeaveTypes } from "../api/leaveTypeApi";
import { formatDisplayDate } from "../utils/date";

// ── RBAC Config ───────────────────────────────
const ROLES = {
  EMPLOYEE: "employee",
  HR: "hr",
  ADMIN: "admin",
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const mapLeaveBalanceItem = (item = {}, index = 0) => ({
  id:
    item.empLeaveId ||
    item.emp_leave_id ||
    item.id ||
    item.uuid ||
    String(index + 1),
  leave_type_id:
    item.leaveTypeId ||
    item.leave_type_id ||
    item.typeId ||
    item.type_id ||
    null,
  leave_type:
    item.leaveTypeName ||
    item.leaveType ||
    item.leave_type ||
    item.typeName ||
    item.name ||
    "Leave",
  year: item.year ?? item.calendarYear ?? item.calendar_year ?? null,
  total: item.totalLeaves ?? item.total ?? 0,
  used: item.usedLeaves ?? item.used ?? 0,
  remaining: item.remainingLeaves ?? item.remaining ?? 0,
});

const getLoggedInEmployeeId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");

    return (
      localStorage.getItem("employeeId") ||
      user.employeeId ||
      user.empId ||
      user.emp_id ||
      user.id ||
      userDetails.empId ||
      userDetails.emp_id ||
      userDetails.employeeId ||
      userDetails.employee_id ||
      userDetails.id ||
      user.uuid ||
      ""
    );
  } catch {
    return localStorage.getItem("employeeId") || "";
  }
};

const normalizeLeaveBalance = (response) =>
  toArray(response)
    .map(mapLeaveBalanceItem)
    .filter((item) => item.id && item.leave_type)
    .sort((a, b) => {
      const yearDiff = Number(b.year || 0) - Number(a.year || 0);
      if (yearDiff !== 0) return yearDiff;
      return String(a.leave_type).localeCompare(String(b.leave_type));
    });

const toTitleCaseStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Pending";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const mapLeaveHistoryItem = (item = {}, index = 0) => ({
  id:
    item.leaveApplicationId ||
    item.leaveId ||
    item.id ||
    item.uuid ||
    String(index + 1),
  leave_type:
    item.leaveType ||
    item.leaveTypeName ||
    item.leave_type ||
    item.typeName ||
    "Leave",
  from_date: formatDisplayDate(item.startDate || item.fromDate || item.from_date) || "-",
  to_date: formatDisplayDate(item.endDate || item.toDate || item.to_date) || "-",
  days: item.noOfDays ?? item.days ?? 0,
  status: toTitleCaseStatus(item.status),
  applied_on:
    formatDisplayDate(
      item.appliedOn ||
        item.appliedDate ||
        item.createdAt ||
        item.created_at
    ) || "-",
  remarks: item.remarks || "",
  sort_date:
    item.startDate ||
    item.fromDate ||
    item.from_date ||
    item.appliedOn ||
    item.appliedDate ||
    item.createdAt ||
    item.created_at ||
    "",
});

const normalizeLeaveHistory = (response) =>
  toArray(response)
    .map(mapLeaveHistoryItem)
    .filter((item) => item.id)
    .sort(
      (a, b) =>
        new Date(b.sort_date || 0).getTime() - new Date(a.sort_date || 0).getTime()
    );

const mapTeamLeaveItem = (item = {}, index = 0) => ({
  id:
    item.leaveApplicationId ||
    item.leaveId ||
    item.id ||
    item.uuid ||
    String(index + 1),
  employee_name:
    item.employeeName ||
    item.employee_name ||
    item.empName ||
    item.emp_name ||
    item.fullName ||
    item.name ||
    "Employee",
  employee_id:
    item.empId ||
    item.emp_id ||
    item.employeeId ||
    item.employee_id ||
    "",
  leave_type:
    item.leaveType ||
    item.leaveTypeName ||
    item.leave_type ||
    item.typeName ||
    "Leave",
  from_date:
    formatDisplayDate(item.startDate || item.fromDate || item.from_date) || "-",
  to_date:
    formatDisplayDate(item.endDate || item.toDate || item.to_date) || "-",
  days: item.noOfDays ?? item.days ?? 0,
  status: toTitleCaseStatus(item.status),
  applied_on:
    formatDisplayDate(
      item.appliedOn ||
        item.appliedDate ||
        item.createdAt ||
        item.created_at
    ) || "-",
  remarks: item.remarks || "",
  sort_date:
    item.appliedOn ||
    item.appliedDate ||
    item.createdAt ||
    item.created_at ||
    item.startDate ||
    item.fromDate ||
    item.from_date ||
    "",
});

const normalizeTeamLeaves = (response) =>
  toArray(response)
    .map(mapTeamLeaveItem)
    .filter((item) => item.id)
    .sort(
      (a, b) =>
        new Date(b.sort_date || 0).getTime() - new Date(a.sort_date || 0).getTime()
    );

export default function LeaveManagement() {
  // ── RBAC ──────────────────────────────────────
  const role = localStorage.getItem("role") || ROLES.EMPLOYEE;
  const loggedInEmployeeId = getLoggedInEmployeeId();
  const hasEmployeeId = Boolean(String(loggedInEmployeeId || "").trim());

  // ── State ─────────────────────────────────────
  const [activeTab, setActiveTab] = useState("my-leaves");
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showYearlyLeavesModal, setShowYearlyLeavesModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approvalAction, setApprovalAction] = useState(null);
  const [apiError, setApiError] = useState("");

  const canViewTeamLeaves = [ROLES.HR, ROLES.ADMIN].includes(role);
  const canPostYearlyLeaves = [ROLES.HR, ROLES.ADMIN].includes(role);

  useEffect(() => {
    const loadLeaveData = async () => {
      try {
        const [balanceResult, historyResult, teamLeavesResult, leaveTypesResult] =
          await Promise.allSettled([
          hasEmployeeId ? fetchLeaveBalance(loggedInEmployeeId) : Promise.resolve([]),
          hasEmployeeId ? fetchLeaveHistory(loggedInEmployeeId) : Promise.resolve([]),
          canViewTeamLeaves ? fetchTeamLeaves() : Promise.resolve([]),
          fetchLeaveTypes(),
          ]);

        if (balanceResult.status === "fulfilled") {
          setLeaveBalance(normalizeLeaveBalance(balanceResult.value));
        } else {
          setLeaveBalance([]);
          // Don't block the page if employeeId is missing; show a message only when user tries to apply.
          if (hasEmployeeId) {
            setApiError(
              balanceResult.reason?.response?.data?.message ||
                balanceResult.reason?.message ||
                "Failed to load leave balance"
            );
          }
        }

        if (historyResult.status === "fulfilled") {
          setMyLeaves(normalizeLeaveHistory(historyResult.value));
        } else {
          setMyLeaves([]);
          if (hasEmployeeId) {
            setApiError(
              historyResult.reason?.response?.data?.message ||
                historyResult.reason?.message ||
                "Failed to load leave history"
            );
          }
        }

        if (teamLeavesResult.status === "fulfilled") {
          setTeamLeaves(normalizeTeamLeaves(teamLeavesResult.value));
        } else {
          setTeamLeaves([]);
          if (canViewTeamLeaves) {
            setApiError(
              teamLeavesResult.reason?.response?.data?.message ||
                teamLeavesResult.reason?.message ||
                "Failed to load leave requests"
            );
          }
        }

        if (leaveTypesResult.status === "fulfilled") {
          const raw = toArray(leaveTypesResult.value);
          const normalized = raw
            .map((t) => ({
              id: t.typeId ?? t.id ?? t.type_id,
              name: t.type ?? t.leaveType ?? t.name ?? t.label ?? "",
            }))
            .filter((t) => t.id && t.name);

          setLeaveTypes(normalized);
        }
      } catch (error) {
        console.error("❌ Failed to load leave data:", error);
        setLeaveBalance([]);
        setApiError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to load leave data"
        );
      }
    };

    loadLeaveData();
  }, [canViewTeamLeaves, hasEmployeeId, loggedInEmployeeId]);

  const resolveLeaveTypeName = (balanceItem) => {
    if (!leaveTypes.length) return balanceItem.leave_type;

    if (balanceItem.leave_type_id) {
      const matchedById = leaveTypes.find(
        (t) => String(t.id) === String(balanceItem.leave_type_id)
      );
      if (matchedById) return matchedById.name;
    }

    const normalizedName = String(balanceItem.leave_type || "")
      .trim()
      .toLowerCase();
    const matchedByName = leaveTypes.find(
      (t) => String(t.name).trim().toLowerCase() === normalizedName
    );
    return matchedByName?.name || balanceItem.leave_type;
  };

  const handlePostYearlyLeaves = async (year) => {
    const response = await postYearlyLeavesForAllEmployees(year);
    try {
      if (!hasEmployeeId) return response;
      const refreshed = await fetchLeaveBalance(loggedInEmployeeId);
      setLeaveBalance(normalizeLeaveBalance(refreshed));
    } catch (e) {
      console.error("❌ Failed to refresh leave balance:", e);
    }
    return response;
  };

  // ── Handlers: Apply Leave ─────────────────────
  const handleApplyLeave = async (formData) => {
    setApiError("");

    try {
      const response = await applyLeave(formData);
      console.log("✅ Leave apply response:", response);

      if (hasEmployeeId) {
        const refreshedHistory = await fetchLeaveHistory(loggedInEmployeeId);
        setMyLeaves(normalizeLeaveHistory(refreshedHistory));
      }
      setShowApplyModal(false);
    } catch (error) {
      console.error("❌ Apply leave failed:", error);
      setApiError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to apply leave",
      );
    }

    return;
  };

  // ── Handlers: Approve/Reject ──────────────────
  const handleApproveClick = (leave, action) => {
    setApprovalTarget(leave);
    setApprovalAction(action);
    setShowApproveModal(true);
    setApiError("");
  };

  const handleApprovalSubmit = async (action, remarks = "") => {
    if (!approvalTarget) return;

    try {
      setApiError("");
      await approveRejectLeave(approvalTarget.id, action, remarks);

      if (canViewTeamLeaves) {
        const refreshedRequests = await fetchTeamLeaves();
        setTeamLeaves(normalizeTeamLeaves(refreshedRequests));
      }

      console.log(`Leave ${action}ed:`, {
        leaveId: approvalTarget.id,
        status: action === "approve" ? "Approved" : "Rejected",
        remarks,
      });

      setShowApproveModal(false);
      setApprovalTarget(null);
      setApprovalAction(null);
    } catch (error) {
      console.error("Error approving/rejecting leave:", error);
      setApiError(
        error.response?.data?.message || "Failed to process leave request",
      );
    }
  };

  // ── Cancel Leave ──────────────────────────────
  const handleCancelLeave = (leaveId) => {
    setMyLeaves((prev) => prev.filter((l) => l.id !== leaveId));
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Leave Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and track your leave requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canPostYearlyLeaves && (
            <button
              onClick={() => setShowYearlyLeavesModal(true)}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 active:scale-95 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 transition-all duration-150"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3M4 11h16M6 19h12a2 2 0 002-2v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Post Yearly Leaves
            </button>
          )}

          <button
            onClick={() => {
              if (!hasEmployeeId) {
                setApiError("Employee ID missing. Please log out and log in again.");
                return;
              }
              setShowApplyModal(true);
            }}
            className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Apply Leave
          </button>
        </div>
      </div>

      {/* ── Leave Balance Section ── */}
      <LeaveBalanceSection data={leaveBalance} />

      {/* ── API Error ── */}
      {apiError && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {apiError}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab("my-leaves")}
            className={`pb-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "my-leaves"
                ? "text-[#1a2240] border-[#1a2240]"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            My Leaves
          </button>

          {canViewTeamLeaves && (
            <button
              onClick={() => setActiveTab("team-leaves")}
              className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "team-leaves"
                  ? "text-[#1a2240] border-[#1a2240]"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Team Leaves
            </button>
          )}
        </div>
      </div>

      {/* ── My Leaves Table ── */}
      {activeTab === "my-leaves" && (
        <LeaveTable data={myLeaves} onCancel={handleCancelLeave} />
      )}

      {/* ── Team Leaves Table ── */}
      {activeTab === "team-leaves" && canViewTeamLeaves && (
        <TeamLeaveTable
          data={teamLeaves}
          role={role}
          onApprove={handleApproveClick}
        />
      )}

      {/* ── Modals ── */}
      {showApplyModal && (
        <ApplyLeaveModal
          onSubmit={handleApplyLeave}
          onClose={() => setShowApplyModal(false)}
          leaveTypes={leaveBalance.map((item) => ({
            id: item.id,
            name: resolveLeaveTypeName(item),
          }))}
        />
      )}

      {showYearlyLeavesModal && (
        <PostYearlyLeavesModal
          isOpen={showYearlyLeavesModal}
          onClose={() => setShowYearlyLeavesModal(false)}
          onConfirm={handlePostYearlyLeaves}
        />
      )}

      {showApproveModal && approvalTarget && (
        <ApproveLeaveModal
          leave={approvalTarget}
          action={approvalAction}
          onApprove={() => handleApprovalSubmit("approve")}
          onReject={(remarks) => handleApprovalSubmit("reject", remarks)}
          onClose={() => {
            setShowApproveModal(false);
            setApprovalTarget(null);
            setApprovalAction(null);
          }}
        />
      )}
    </div>
  );
}
