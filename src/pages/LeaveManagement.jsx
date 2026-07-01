// src/pages/LeaveManagement.jsx
// ─────────────────────────────────────────────
//  Leave Management — Full CRUD with RBAC
//  TanStack Query owns server state. Zustand owns UI/client state.
// ─────────────────────────────────────────────

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import LeaveBalanceSection from "../components/leave/LeaveBalanceSection";
import LeaveTable from "../components/leave/LeaveTable";
import TeamLeaveTable from "../components/leave/TeamLeaveTable";
import ApplyLeaveModal from "../components/leave/ApplyLeaveModal";
import ApproveLeaveModal from "../components/leave/ApproveLeaveModal";
import CancelLeaveModal from "../components/leave/CancelLeaveModal";
import LeaveDetailsModal from "../components/leave/LeaveDetailsModal";
import PostYearlyLeavesModal from "../components/modals/PostYearlyLeavesModal";
import { postYearlyLeavesForAllEmployees } from "../api/leaveApi";
import {
  useLeaveBalance,
  useLeaveSummary,
} from "../hooks/queries/useLeaveBalance";
import { useLeaveDetails } from "../hooks/queries/useLeaveDetails";
import { leaveQueryKeys } from "../hooks/queries/leaveQueryKeys";
import { getApiErrorMessage } from "../utils/leaveTransformers";
import { getUserFromToken } from "../utils/auth.js";
import useLeaveStore from "../store/useLeaveStore";

const ROLES = {
  EMPLOYEE: "employee",
  HR: "hr",
  ADMIN: "admin",
};

export default function LeaveManagement() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { role, empId: loggedInEmployeeId } = getUserFromToken();
  const hasEmployeeId = Boolean(String(loggedInEmployeeId || "").trim());
  const canViewTeamLeaves = [ROLES.HR, ROLES.ADMIN].includes(role);
  const canPostYearlyLeaves = [ROLES.HR, ROLES.ADMIN].includes(role);
  const requestedTab = String(searchParams.get("tab") || "")
    .trim()
    .toLowerCase();

  const [activeTab, setActiveTab] = useState(() =>
    requestedTab === "team-leaves" && canViewTeamLeaves
      ? "team-leaves"
      : "my-leaves"
  );
  const [showYearlyLeavesModal, setShowYearlyLeavesModal] = useState(false);
  const [detailsLeaveId, setDetailsLeaveId] = useState(null);
  const [localError, setLocalError] = useState("");
  const visibleTab =
    activeTab === "team-leaves" && !canViewTeamLeaves ? "my-leaves" : activeTab;

  // Zustand remains intentionally small: UI state only. Server state below is
  // read from TanStack Query, which replaces useEffect fetching and manual
  // refetch plumbing with cache-aware queries.
  const selectedLeave = useLeaveStore((state) => state.selectedLeave);
  const isApplyModalOpen = useLeaveStore((state) => state.isApplyModalOpen);
  const isApproveModalOpen = useLeaveStore((state) => state.isApproveModalOpen);
  const isCancelModalOpen = useLeaveStore((state) => state.isCancelModalOpen);
  const openApplyModal = useLeaveStore((state) => state.openApplyModal);

  const {
    data: leaveBalance = [],
    isError: isLeaveBalanceError,
    error: leaveBalanceError,
  } = useLeaveBalance(loggedInEmployeeId, {
    enabled: hasEmployeeId,
  });

  const {
    data: leaveSummary = null,
    isError: isLeaveSummaryError,
    error: leaveSummaryError,
  } = useLeaveSummary();

  const {
    data: leaveDetails = null,
    isFetching: leaveDetailsLoading,
    isError: isLeaveDetailsError,
    error: leaveDetailsError,
  } = useLeaveDetails(detailsLeaveId, {
    enabled: Boolean(detailsLeaveId),
  });

  const yearlyLeavesMutation = useMutation({
    mutationFn: postYearlyLeavesForAllEmployees,
    onSuccess: async () => {
      // Posting yearly leaves changes balances and summaries. Invalidation marks
      // those cache entries stale and refetches active observers automatically.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leaveQueryKeys.balance() }),
        queryClient.invalidateQueries({ queryKey: leaveQueryKeys.summary() }),
      ]);
    },
  });

  const pageError =
    localError ||
    (isLeaveBalanceError &&
      getApiErrorMessage(leaveBalanceError, "Failed to load leave balance")) ||
    (isLeaveSummaryError &&
      getApiErrorMessage(leaveSummaryError, "Failed to load leave summary")) ||
    "";

  const handleViewLeave = (leave) => {
    if (!leave?.id) return;
    setDetailsLeaveId(leave.id);
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
                setLocalError("Employee ID missing. Please log out and log in again.");
                return;
              }
              setLocalError("");
              openApplyModal();
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

      <LeaveBalanceSection data={leaveBalance} summary={leaveSummary} />

      {pageError && (
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
          {pageError}
        </div>
      )}

      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab("my-leaves")}
            className={`pb-3 text-sm font-medium border-b-2 transition-all ${
              visibleTab === "my-leaves"
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
                visibleTab === "team-leaves"
                  ? "text-[#1a2240] border-[#1a2240]"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              Team Leaves
            </button>
          )}
        </div>
      </div>

      {visibleTab === "my-leaves" && <LeaveTable />}

      {visibleTab === "team-leaves" && canViewTeamLeaves && (
        <TeamLeaveTable onView={handleViewLeave} />
      )}

      {isApplyModalOpen && <ApplyLeaveModal />}

      {showYearlyLeavesModal && (
        <PostYearlyLeavesModal
          isOpen={showYearlyLeavesModal}
          onClose={() => setShowYearlyLeavesModal(false)}
          onConfirm={(year) => yearlyLeavesMutation.mutateAsync(year)}
        />
      )}

      {isApproveModalOpen && selectedLeave && <ApproveLeaveModal />}

      {isCancelModalOpen && selectedLeave && <CancelLeaveModal />}

      <LeaveDetailsModal
        isOpen={Boolean(detailsLeaveId)}
        details={leaveDetails}
        isLoading={leaveDetailsLoading}
        error={
          isLeaveDetailsError
            ? getApiErrorMessage(leaveDetailsError, "Failed to load leave details")
            : ""
        }
        onClose={() => setDetailsLeaveId(null)}
      />
    </div>
  );
}
