// src/api/dashboardApi.js
// ─────────────────────────────────────────────
//  Dashboard API — wraps existing + new endpoints
//  All new endpoints have TODO comments for integration
// ─────────────────────────────────────────────

import axios from "axios";
import { buildApiUrl } from "./apiBase";
import { getHolidays }       from "./holidayApi";
import { getAttendance }     from "./attendanceApi";
import { fetchLeaveBalance } from "./leaveApi";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── GET /employees/summary ────────────────────
// Response: { activeEmployees, inactiveEmployees,
//             totalEmployees, employeeGrowthPercentage, todayOnboardings }
export const getEmployeeSummary = async () => {
  const response = await axios.get(
    buildApiUrl("/employees/summary"),
    authHeaders()
  );
  return response.data;
};

// ── GET /leaves/summary ───────────────────────
// Response: { approvedRequests, pendingRequests, rejectedRequests,
//             totalRequests, totalAllocated, totalUsed, totalRemaining,
//             leaveTypeBreakdown: [] }
export const getLeaveSummary = async (empId) => {
  const response = await axios.get(
    buildApiUrl("/leaves/summary"),
    {
      ...authHeaders(),
      ...(empId ? { params: { empId } } : {}),
    }
  );
  return response.data;
};

// ── Reuse existing holiday API ─────────────────
// getHolidays(year) from holidayApi.js
export const getUpcomingHolidays = async () => {
  const year     = new Date().getFullYear();
  const holidays = await getHolidays(year);
  const today    = new Date(); today.setHours(0, 0, 0, 0);

  const upcoming = holidays
    .filter((h) => new Date(h.holidayDate + "T00:00:00") >= today)
    .sort((a, b) => new Date(a.holidayDate) - new Date(b.holidayDate))
    .slice(0, 3);

  return upcoming;
};

// ── Reuse existing attendance API ─────────────
// Returns today's record from getAttendance()
export const getTodayAttendance = async () => {
  const records = await getAttendance();
  const todayKey = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const todayRecord = Array.isArray(records)
    ? records.find((r) => r.date === todayKey)
    : null;

  return todayRecord || null;
};

export const getTodayWorkAnniversaries = async () => {
  const response = await axios.get(
    buildApiUrl("/employees/anniversaries/today"),
    authHeaders()
  );

  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
};

export const getTodayBirthdays = async () => {
  const response = await axios.get(
    buildApiUrl("/employees/birthdays/today"),
    authHeaders()
  );

  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
};

// ── Reuse leave balance for breakdown ─────────
export { fetchLeaveBalance };
