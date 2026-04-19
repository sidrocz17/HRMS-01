// src/api/leaveApi.js
// ─────────────────────────────────────────────
//  Leave Management API calls
//  Follows the pattern of departmentApi.js and designationApi.js
// ─────────────────────────────────────────────

import axios from "axios";
import { BASE_URL, buildApiUrl } from "./apiBase";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── POST /leaves/apply — Apply for leave ──────
export const applyLeave = async (formData) => {
  const body = {
    empLeaveId: formData.empLeaveId,
    leaveDay: formData.leaveDay,
    description: formData.description,
    noOfDays: formData.noOfDays,
    startDate: formData.startDate,
    endDate: formData.endDate,
  };

  console.log("📤 Applying leave:", body);

  const response = await axios.post(
    buildApiUrl("/leaves/apply"),
    body,
    authHeaders()
  );

  console.log("📥 Leave application response:", response.data);
  return response.data;
};

// ── GET /leaves/my — Get user's leaves ────────
export const fetchMyLeaves = async () => {
  const response = await axios.get(
    buildApiUrl("/leaves/my"),
    authHeaders()
  );

  return response.data;
};

// ── GET /leaves/history?empId={empId} — Get leave history for an employee ──
export const fetchLeaveHistory = async (empId) => {
  const response = await axios.get(buildApiUrl("/leaves/history"), {
    ...authHeaders(),
    params: { empId },
  });

  return response.data;
};

// ── GET /leaves/requests — Get pending/all leave requests for HR/Admin ──
export const fetchTeamLeaves = async () => {
  const response = await axios.get(
    buildApiUrl("/leaves/requests"),
    authHeaders()
  );

  return response.data;
};

// ── GET /leaves/:id — Get leave details ──────
export const fetchLeaveDetails = async (id) => {
  const response = await axios.get(
    buildApiUrl(`/leaves/${id}`),
    authHeaders()
  );

  return response.data;
};

// ── PUT /leaves/:id/approve — Approve leave ──
export const approveLeave = async (id) => {
  const response = await axios.put(
    buildApiUrl(`/leaves/${id}/approve`),
    {},
    authHeaders()
  );

  console.log("📥 Approve response:", response.data);
  return response.data;
};

// ── PUT /leaves/:id/reject — Reject leave ────
export const rejectLeave = async (id, remarks = "") => {
  const body = { remarks };

  const response = await axios.put(
    buildApiUrl("/leaves/approve-reject"),
    body,
    authHeaders()
  );

  console.log("📥 Reject response:", response.data);
  return response.data;
};

// ── DELETE /leaves/:id — Cancel leave request ─
export const cancelLeave = async (id) => {
  const response = await axios.delete(
    buildApiUrl(`/leaves/${id}`),
    authHeaders()
  );

  console.log("📥 Cancel response:", response.data);
  return response.data;
};

// ── GET /leaves/balance/{empId} — Get leave balance ──
// Backward compatible: if empId is omitted, calls `/leaves/balance`.
export const fetchLeaveBalance = async (empId) => {
  const path = empId
    ? buildApiUrl(`/leaves/balance/${empId}`)
    : buildApiUrl("/leaves/balance");

  const response = await axios.get(path, authHeaders());
  return response.data;
};

// ── GET /leave-types — Get all leave types ───
export const fetchLeaveTypes = async () => {
  const response = await axios.get(
    buildApiUrl("/leave-types"),
    authHeaders()
  );

  return response.data;
};

// ── POST /leaves/approve-reject — Approve or reject leave ──
export const approveRejectLeave = async (
  leaveApplicationId,
  action,
  remarks = ""
) => {
  const status =
    String(action || "").trim().toLowerCase() === "approve"
      ? "APPROVED"
      : "REJECTED";

  const body = {
    leaveApplicationId,
    status,
    remarks,
  };

  console.log("📤 Approve/Reject leave:", body);

  const response = await axios.post(
    buildApiUrl("/leaves/approve-reject"),
    body,
    authHeaders()
  );

  console.log("📥 Approve/Reject response:", response.data);
  return response.data;
};

// ── POST /employee-leaves/allocate — Allocate leaves for an employee ──
// Expected payload: { empId, joiningDate, year, createdBy }
export const allocateEmployeeLeaves = async (payload = {}) => {
  const response = await axios.post(
    buildApiUrl("/employee-leaves/allocate"),
    payload,
    authHeaders()
  );

  return response.data;
};

// ── POST /credit-yearly?year={year} — Allocate yearly leaves for all employees ──
export const postYearlyLeavesForAllEmployees = async (year) => {
  const normalizedYear = Number.parseInt(year, 10);

  if (!Number.isFinite(normalizedYear)) {
    throw new Error("A valid year is required");
  }

  const response = await axios.post(
    buildApiUrl("/credit-yearly"),
    {},
    {
      ...authHeaders(),
      params: { year: normalizedYear },
    }
  );

  return response.data;
};
