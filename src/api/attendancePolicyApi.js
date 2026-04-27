// src/api/attendancePolicyApi.js
// ─────────────────────────────────────────────
//  API layer for Attendance Policy module.
//  Follows same pattern as departmentApi.js
// ─────────────────────────────────────────────

import axios from "axios";
import { buildApiUrl } from "./apiBase";
import { getUserFromToken } from "../utils/auth.js";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── GET /api/attendance-policy ────────────────
// Returns the current active attendance policy
// Response: { id, minInTime, minOutTime, minWorkingHour, halfDayHour, updatedBy, updatedOn }
export const fetchAttendancePolicy = async () => {
  const response = await axios.get(buildApiUrl("/attendance-policy"), authHeaders());
  return response.data?.data ?? response.data;
};

// ── POST /api/attendance-policy ───────────────
// Creates the attendance policy (admin only)
// Request body: { minWorkingHour, halfDayHour }
export const createAttendancePolicy = async (payload) => {
  const { userId } = getUserFromToken();
  const normalizeTime = (value) => {
    if (!value) return "";
    const trimmed = String(value).trim();
    return /^\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
  };

  const body = {
    minInTime: normalizeTime(payload.min_in_time),
    minOutTime: normalizeTime(payload.min_out_time),
    minWorkingHour: Number(payload.min_working_hour),
    halfDayHour: Number(payload.half_day_hour),
    createdBy: payload.createdBy || userId,
  };
  const response = await axios.post(
    buildApiUrl("/attendance-policy"),
    body,
    authHeaders()
  );
  return response.data;
};

// ── PUT /api/attendance-policy/:attPolicyId ───
// Updates the attendance policy
// Request body: { minWorkingHour, halfDayHour }
export const updateAttendancePolicy = async (attPolicyId, payload) => {
  const normalizeTime = (value) => {
    if (!value) return "";
    const trimmed = String(value).trim();
    return /^\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
  };

  const body = {
    minInTime: normalizeTime(payload.min_in_time),
    minOutTime: normalizeTime(payload.min_out_time),
    minWorkingHour: Number(payload.min_working_hour),
    halfDayHour: Number(payload.half_day_hour),
  };

  if (!attPolicyId) {
    throw new Error("Attendance policy ID is required for update.");
  }

  const response = await axios.put(
    buildApiUrl(`/attendance-policy/${attPolicyId}`),
    body,
    authHeaders()
  );
  return response.data;
};

// ── DELETE /api/attendance-policies/:id ───────
// Deletes a policy record by id
export const deleteAttendancePolicy = async (id) => {
  const response = await axios.delete(
    buildApiUrl(`/attendance-policies/${id}`),
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
