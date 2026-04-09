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

// ── RBAC Config ───────────────────────────────
const ROLES = {
  EMPLOYEE: "employee",
  HR: "hr",
  ADMIN: "admin",
};

// ── Dummy data for My Leaves ──────────────────
const DUMMY_MY_LEAVES = [
  {
    id: "1",
    leave_type: "Sick Leave",
    from_date: "Apr 15, 2026",
    to_date: "Apr 17, 2026",
    days: 3,
    status: "Approved",
    applied_on: "Apr 8, 2026",
  },
  {
    id: "2",
    leave_type: "Casual Leave",
    from_date: "Apr 20, 2026",
    to_date: "Apr 20, 2026",
    days: 0.5,
    status: "Pending",
    applied_on: "Apr 8, 2026",
  },
  {
    id: "3",
    leave_type: "Earned Leave",
    from_date: "Mar 10, 2026",
    to_date: "Mar 14, 2026",
    days: 5,
    status: "Approved",
    applied_on: "Mar 1, 2026",
  },
  {
    id: "4",
    leave_type: "Sick Leave",
    from_date: "Feb 5, 2026",
    to_date: "Feb 5, 2026",
    days: 1,
    status: "Rejected",
    applied_on: "Feb 4, 2026",
  },
];

// ── Dummy data for Team Leaves (HR/Admin) ─────
const DUMMY_TEAM_LEAVES = [
  {
    id: "t1",
    employee_name: "John Smith",
    leave_type: "Casual Leave",
    from_date: "Apr 12, 2026",
    to_date: "Apr 12, 2026",
    days: 1,
    status: "Approved",
    applied_on: "Apr 8, 2026",
  },
  {
    id: "t2",
    employee_name: "Sarah Johnson",
    leave_type: "Sick Leave",
    from_date: "Apr 18, 2026",
    to_date: "Apr 19, 2026",
    days: 2,
    status: "Pending",
    applied_on: "Apr 15, 2026",
  },
  {
    id: "t3",
    employee_name: "Michael Brown",
    leave_type: "Earned Leave",
    from_date: "Apr 25, 2026",
    to_date: "Apr 30, 2026",
    days: 6,
    status: "Approved",
    applied_on: "Mar 20, 2026",
  },
  {
    id: "t4",
    employee_name: "Emily Davis",
    leave_type: "Comp Off",
    from_date: "Apr 10, 2026",
    to_date: "Apr 10, 2026",
    days: 0.5,
    status: "Approved",
    applied_on: "Apr 7, 2026",
  },
];

// ── Dummy leave balance ────────────────────────
const DUMMY_LEAVE_BALANCE = [
  { id: "1", leave_type: "Trainee Casual Leave", total: 12, used: 4, remaining: 8 },
  { id: "2", leave_type: "Trainee Sick Leave", total: 10, used: 2, remaining: 8 },
  { id: "3", leave_type: "Earned Leave", total: 15, used: 5, remaining: 10 },
  { id: "4", leave_type: "Comp Off", total: 5, used: 1, remaining: 4 },
];

export default function LeaveManagement() {
  // ── RBAC ──────────────────────────────────────
  const role = localStorage.getItem("role") || ROLES.EMPLOYEE;

  // ── State ─────────────────────────────────────
  const [activeTab, setActiveTab] = useState("my-leaves");
  const [myLeaves, setMyLeaves] = useState(DUMMY_MY_LEAVES);
  const [teamLeaves, setTeamLeaves] = useState(DUMMY_TEAM_LEAVES);
  const [leaveBalance] = useState(DUMMY_LEAVE_BALANCE);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approvalAction, setApprovalAction] = useState(null);
  const [apiError, setApiError] = useState("");

  // ── Handlers: Apply Leave ─────────────────────
  const handleApplyLeave = (formData) => {
    console.log("Apply leave:", formData);
    const newLeave = {
      id: String(myLeaves.length + 1),
      leave_type: formData.leave_type,
      from_date: formData.from_date,
      to_date: formData.to_date,
      days: formData.days,
      status: "Pending",
      applied_on: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
    setMyLeaves((prev) => [newLeave, ...prev]);
    setShowApplyModal(false);
  };

  // ── Handlers: Approve/Reject ──────────────────
  const handleApproveClick = (leave, action) => {
    setApprovalTarget(leave);
    setApprovalAction(action);
    setShowApproveModal(true);
    setApiError("");
  };

  const handleApprovalSubmit = (action, remarks = "") => {
    if (!approvalTarget) return;

    const updatedStatus = action === "approve" ? "Approved" : "Rejected";

    setTeamLeaves((prev) =>
      prev.map((l) =>
        l.id === approvalTarget.id ? { ...l, status: updatedStatus } : l
      )
    );

    console.log(`Leave ${action}ed:`, {
      leaveId: approvalTarget.id,
      status: updatedStatus,
      remarks,
    });

    setShowApproveModal(false);
    setApprovalTarget(null);
    setApprovalAction(null);
  };

  // ── Cancel Leave ──────────────────────────────
  const handleCancelLeave = (leaveId) => {
    setMyLeaves((prev) => prev.filter((l) => l.id !== leaveId));
  };

  // ── Access check ──────────────────────────────
  const canViewTeamLeaves = [ROLES.HR, ROLES.ADMIN].includes(role);

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
        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Apply Leave
        </button>
      </div>

      {/* ── Leave Balance Section ── */}
      <LeaveBalanceSection data={leaveBalance} />

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
        <LeaveTable
          data={myLeaves}
          onCancel={handleCancelLeave}
        />
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
          leaveTypes={["Casual Leave", "Sick Leave", "Earned Leave", "Comp Off"]}
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
