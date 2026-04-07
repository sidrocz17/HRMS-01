// src/api/holidayApi.js
// ─────────────────────────────────────────────
//  API layer for Holiday Calendar.
//  Keeps holiday data access aligned with the
//  rest of the app's src/api folder structure.
// ─────────────────────────────────────────────

import axios from "axios";

const BASE_URL = "/api";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── Helper: get logged-in user UUID ──────────
const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.id || user.userId || "";
  } catch {
    return "";
  }
};

// ── GET /api/holidays?year=YYYY ───────────────
// Returns: Array of holiday objects for the given year
// Response shape: [{ holidayId, holidayName, holidayDate, holidayType, calendarYear, ... }]
export const getHolidays = async (year) => {
  // TODO: integrate API
  // const response = await axios.get(
  //   `${BASE_URL}/holidays?year=${year}`,
  //   authHeaders()
  // );
  // return response.data;

  console.log(`📋 Fetching holidays for year: ${year}`);
  return MOCK_HOLIDAYS.filter((h) => h.calendarYear === year);
};

// ── POST /api/holiday ─────────────────────────
// Request body: { holidayName, holidayDate, holidayType, calendarYear, createdBy, updatedBy }
// Response: { message: "Holiday added successfully" } or new holiday object
export const createHoliday = async (payload) => {
  // TODO: integrate API
  // const userId = getUserId();
  // const response = await axios.post(
  //   `${BASE_URL}/holiday`,
  //   {
  //     holidayName: payload.holidayName,
  //     holidayDate: payload.holidayDate,
  //     holidayType: Number(payload.holidayType),
  //     calendarYear: payload.calendarYear,
  //     createdBy: userId,
  //     updatedBy: userId,
  //   },
  //   authHeaders()
  // );
  // return response.data;

  console.log("📤 Creating holiday:", payload, "userId:", getUserId());
  return { message: "Holiday added successfully" };
};

// ── PUT /api/holiday/:id ──────────────────────
// Request body: { holidayName, holidayDate, holidayType, calendarYear, updatedBy }
// Response: { message: "Holiday updated successfully" } or updated object
export const updateHoliday = async (id, payload) => {
  // TODO: integrate API
  // const userId = getUserId();
  // const response = await axios.put(
  //   `${BASE_URL}/holiday/${id}`,
  //   {
  //     holidayName: payload.holidayName,
  //     holidayDate: payload.holidayDate,
  //     holidayType: Number(payload.holidayType),
  //     calendarYear: payload.calendarYear,
  //     updatedBy: userId,
  //   },
  //   authHeaders()
  // );
  // return response.data;

  console.log(`📤 Updating holiday [${id}]:`, payload, "userId:", getUserId());
  return { message: "Holiday updated successfully" };
};

// ── DELETE /api/holiday/:id ───────────────────
// Response: { message: "Holiday deleted successfully" }
export const deleteHoliday = async (id) => {
  // TODO: integrate API
  // const response = await axios.delete(
  //   `${BASE_URL}/holiday/${id}`,
  //   authHeaders()
  // );
  // return response.data;

  console.log(`🗑️ Deleting holiday [${id}]`);
  return { message: "Holiday deleted successfully" };
};

// ── Holiday type mapping ──────────────────────
export const HOLIDAY_TYPES = {
  1: { label: "National Holiday", color: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", dot: "bg-blue-400" },
  2: { label: "Optional Holiday", color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-400" },
  3: { label: "Company Holiday", color: "bg-violet-50 text-violet-700 ring-1 ring-violet-200", dot: "bg-violet-400" },
};

export const HOLIDAY_TYPE_OPTIONS = [
  { value: "1", label: "National Holiday" },
  { value: "2", label: "Optional Holiday" },
  { value: "3", label: "Company Holiday" },
];

// ── Generate year options (current ± 2) ───────
export const getYearOptions = () => {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1, current + 2];
};

// ── MOCK DATA — remove when GET API is ready ──
const MOCK_HOLIDAYS = [
  { holidayId: "1", holidayName: "New Year's Day", holidayDate: "2026-01-01", holidayType: 1, calendarYear: 2026 },
  { holidayId: "2", holidayName: "Republic Day", holidayDate: "2026-01-26", holidayType: 1, calendarYear: 2026 },
  { holidayId: "3", holidayName: "Holi", holidayDate: "2026-03-25", holidayType: 1, calendarYear: 2026 },
  { holidayId: "4", holidayName: "Good Friday", holidayDate: "2026-04-03", holidayType: 2, calendarYear: 2026 },
  { holidayId: "5", holidayName: "Eid ul-Fitr", holidayDate: "2026-04-10", holidayType: 1, calendarYear: 2026 },
  { holidayId: "6", holidayName: "Annual Company Day", holidayDate: "2026-05-15", holidayType: 3, calendarYear: 2026 },
  { holidayId: "7", holidayName: "Independence Day", holidayDate: "2026-08-15", holidayType: 1, calendarYear: 2026 },
  { holidayId: "8", holidayName: "Gandhi Jayanti", holidayDate: "2026-10-02", holidayType: 1, calendarYear: 2026 },
  { holidayId: "9", holidayName: "Diwali", holidayDate: "2026-11-08", holidayType: 1, calendarYear: 2026 },
  { holidayId: "10", holidayName: "Company Fest Day", holidayDate: "2026-12-01", holidayType: 3, calendarYear: 2026 },
  { holidayId: "11", holidayName: "Christmas Day", holidayDate: "2026-12-25", holidayType: 1, calendarYear: 2026 },
  { holidayId: "12", holidayName: "New Year's Eve", holidayDate: "2026-12-31", holidayType: 2, calendarYear: 2026 },
  { holidayId: "13", holidayName: "New Year's Day", holidayDate: "2025-01-01", holidayType: 1, calendarYear: 2025 },
  { holidayId: "14", holidayName: "Republic Day", holidayDate: "2025-01-26", holidayType: 1, calendarYear: 2025 },
];
