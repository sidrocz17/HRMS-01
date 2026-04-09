// src/api/leaveApi.js
// ─────────────────────────────────────────────
//  Leave Management API calls
//  Follows the pattern of departmentApi.js and designationApi.js
// ─────────────────────────────────────────────

import axios from "axios";

const BASE_URL = "/api";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── POST /leaves — Apply for leave ────────────
export const applyLeave = async (formData) => {
  const body = {
    leaveType: formData.leave_type,
    fromDate: formData.from_date,
    toDate: formData.to_date,
    days: formData.days,
    typeOfDay: formData.type_of_day,
    halfSelection: formData.half_selection,
    reason: formData.reason,
  };

  console.log("📤 Applying leave:", body);

  const response = await axios.post(
    `${BASE_URL}/leaves`,
    body,
    authHeaders()
  );

  console.log("📥 Leave application response:", response.data);
  return response.data;
};

// ── GET /leaves/my — Get user's leaves ────────
export const fetchMyLeaves = async () => {
  const response = await axios.get(
    `${BASE_URL}/leaves/my`,
    authHeaders()
  );

  return response.data;
};

// ── GET /leaves/team — Get team leaves (HR/Admin) ──
export const fetchTeamLeaves = async () => {
  const response = await axios.get(
    `${BASE_URL}/leaves/team`,
    authHeaders()
  );

  return response.data;
};

// ── GET /leaves/:id — Get leave details ──────
export const fetchLeaveDetails = async (id) => {
  const response = await axios.get(
    `${BASE_URL}/leaves/${id}`,
    authHeaders()
  );

  return response.data;
};

// ── PUT /leaves/:id/approve — Approve leave ──
export const approveLeave = async (id) => {
  const response = await axios.put(
    `${BASE_URL}/leaves/${id}/approve`,
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
    `${BASE_URL}/leaves/${id}/reject`,
    body,
    authHeaders()
  );

  console.log("📥 Reject response:", response.data);
  return response.data;
};

// ── DELETE /leaves/:id — Cancel leave request ─
export const cancelLeave = async (id) => {
  const response = await axios.delete(
    `${BASE_URL}/leaves/${id}`,
    authHeaders()
  );

  console.log("📥 Cancel response:", response.data);
  return response.data;
};

// ── GET /leaves/balance — Get leave balance ──
export const fetchLeaveBalance = async () => {
  const response = await axios.get(
    `${BASE_URL}/leaves/balance`,
    authHeaders()
  );

  return response.data;
};

// ── GET /leave-types — Get all leave types ───
export const fetchLeaveTypes = async () => {
  const response = await axios.get(
    `${BASE_URL}/leave-types`,
    authHeaders()
  );

  return response.data;
};
