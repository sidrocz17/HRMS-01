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

// ── GET /api/attendance-policy ────────────────
// Returns the current active attendance policy
// Response: { id, minInTime, minOutTime, minWorkingHour, halfDayHour, updatedBy, updatedOn }
export const fetchAttendancePolicy = async () => {
  // TODO: integrate real API
  // const response = await axios.get(`${BASE_URL}/attendance-policy`, authHeaders());
  // return response.data;

  console.log("📋 Fetching attendance policy...");
  return MOCK_POLICY;
};

// ── POST /api/attendance-policy ───────────────
// Creates the attendance policy (admin only)
// Request body: { minInTime, minOutTime, minWorkingHour, halfDayHour }
export const createAttendancePolicy = async (payload) => {
  const userId = getUserId();
  const body = {
    minInTime: payload.min_in_time,
    minOutTime: payload.min_out_time,
    minWorkingHour: Number(payload.min_working_hour),
    halfDayHour: Number(payload.half_day_hour),
    createdBy: userId,
    updatedBy: userId,
  };

  console.log("📤 Creating attendance policy:", body);
  const response = await axios.post(
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
  // TODO: integrate real API
  // const response = await axios.get(
  //   `${BASE_URL}/attendance-policy/history`,
  //   authHeaders()
  // );
  // return response.data;

  console.log("📋 Fetching attendance policy history...");
  return MOCK_HISTORY;
};

// ── Helper: get logged-in user UUID ──────────
const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.id || user.userId || "";
  } catch {
    return "";
  }
};

// ── MOCK DATA — remove when API is ready ──────
const MOCK_POLICY = {
  id:             "policy-001",
  minInTime:      "09:00",
  minOutTime:     "18:00",
  minWorkingHour: 8,
  halfDayHour:    4,
  updatedBy:      "Sarah Johnson",
  updatedOn:      "2026-04-07T10:30:00Z",
};

const MOCK_HISTORY = [
  {
    id:           "h-001",
    date:         "2026-04-07",
    updatedBy:    "Sarah Johnson",
    minInTime:    "09:00",
    minOutTime:   "18:00",
    workingHours: 8,
    halfDayHours: 4,
  },
  {
    id:           "h-002",
    date:         "2026-03-15",
    updatedBy:    "Michael Chen",
    minInTime:    "09:30",
    minOutTime:   "18:30",
    workingHours: 8,
    halfDayHours: 4,
  },
  {
    id:           "h-003",
    date:         "2026-02-10",
    updatedBy:    "Emma Williams",
    minInTime:    "09:00",
    minOutTime:   "17:30",
    workingHours: 7.5,
    halfDayHours: 4,
  },
  {
    id:           "h-004",
    date:         "2026-01-05",
    updatedBy:    "David Brown",
    minInTime:    "08:30",
    minOutTime:   "17:00",
    workingHours: 8,
    halfDayHours: 4,
  },
];
