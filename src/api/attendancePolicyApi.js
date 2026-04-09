// src/api/attendancePolicyApi.js
// ─────────────────────────────────────────────
//  API layer for Attendance Policy module.
//  Follows same pattern as departmentApi.js
// ─────────────────────────────────────────────

import axios from "axios";

const BASE_URL = "/api";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

const withSeconds = (timeValue) => {
  if (!timeValue) return timeValue;
  return timeValue.length === 5 ? `${timeValue}:00` : timeValue;
};

// ── GET /api/attendance-policy ────────────────
// Returns the current active attendance policy
// Response: { id, minInTime, minOutTime, minWorkingHour, halfDayHour, updatedBy, updatedOn }
export const fetchAttendancePolicy = async () => {
  const response = await axios.get(`${BASE_URL}/attendance-policy`, authHeaders());
  return response.data?.data ?? response.data;
};

// ── POST /api/attendance-policy ───────────────
// Creates the attendance policy (admin only)
// Request body: { minInTime, minOutTime, minWorkingHour, halfDayHour, createdBy }
export const createAttendancePolicy = async (payload) => {
  const userId = getUserId();
  const body = {
    minInTime: withSeconds(payload.min_in_time),
    minOutTime: withSeconds(payload.min_out_time),
    minWorkingHour: Number(payload.min_working_hour),
    halfDayHour: Number(payload.half_day_hour),
    createdBy: userId,
  };

  console.log("📤 Creating attendance policy:", body);
  const response = await axios.post(
    `${BASE_URL}/attendance-policy`,
    body,
    authHeaders()
  );
  return response.data;
};

// ── PUT /api/attendance-policy ────────────────
// Updates the attendance policy
// Request body: { minInTime, minOutTime, minWorkingHour, halfDayHour, updatedBy }
export const updateAttendancePolicy = async (payload) => {
  const userId = getUserId();
  const body = {
    minInTime: withSeconds(payload.min_in_time),
    minOutTime: withSeconds(payload.min_out_time),
    minWorkingHour: Number(payload.min_working_hour),
    halfDayHour: Number(payload.half_day_hour),
    updatedBy: userId,
  };

  const response = await axios.put(
    `${BASE_URL}/attendance-policy`,
    body,
    authHeaders()
  );
  return response.data;
};

// ── GET /api/attendance-policy/history ────────
// Returns list of historical policy changes
// Response: [{ id, date, updatedBy, minInTime, minOutTime, workingHours, halfDayHours }]
export const fetchAttendancePolicyHistory = async () => {
  return [];
};

// ── Helper: get logged-in user UUID ──────────
const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return (
      user.id ||
      user.userId ||
      user.uuid ||
      user.employeeId ||
      localStorage.getItem("userId") ||
      localStorage.getItem("uuid") ||
      localStorage.getItem("employeeId") ||
      ""
    );
  } catch {
    return (
      localStorage.getItem("userId") ||
      localStorage.getItem("uuid") ||
      localStorage.getItem("employeeId") ||
      ""
    );
  }
};
