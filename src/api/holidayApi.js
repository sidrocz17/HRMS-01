// src/api/holidayApi.js
// ─────────────────────────────────────────────
//  API layer for Holiday Calendar.
//  Keeps holiday data access aligned with the
//  rest of the app's src/api folder structure.
// ─────────────────────────────────────────────

import axios from "axios";

const BASE_URL = "/api";
const DEFAULT_HOLIDAY_TYPE = "National Holiday";

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

const isHolidayActive = (holiday) => {
  if (holiday?.isActive === undefined && holiday?.is_active === undefined) {
    return true;
  }

  return holiday?.isActive === true || holiday?.is_active === true;
};

// ── GET /api/holidays ─────────────────────────
// Returns: Array of holiday objects for the given year
// Response shape: [{ holidayId, holidayName, holidayDate, holidayType, calendarYear, ... }]
export const getHolidays = async (year) => {
  const response = await axios.get(`${BASE_URL}/holidays`, authHeaders());
  const holidays = Array.isArray(response.data) ? response.data.filter(isHolidayActive) : [];

  if (!year) return holidays;

  return holidays.filter((h) => {
    const holidayYear = h.calendarYear || h.calendar_year;
    return Number(holidayYear) === Number(year);
  });
};

// ── POST /api/holiday ─────────────────────────
// Request body: { holidayName, holidayDate, holidayType, calendarYear, createdBy, updatedBy }
// Response: { message: "Holiday added successfully" } or new holiday object
export const createHoliday = async (payload) => {
  const userId = getUserId();
  const response = await axios.post(
    `${BASE_URL}/holiday`,
    {
      holidayName: payload.holidayName,
      holidayDate: payload.holidayDate,
      holidayType: payload.holidayType,
      calendarYear: payload.calendarYear,
      createdBy: userId,
      updatedBy: userId,
    },
    authHeaders()
  );
  return response.data;
};

// ── PUT /api/holiday/:id ──────────────────────
// Request body: { holidayName, holidayDate, holidayType, calendarYear, updatedBy }
// Response: { message: "Holiday updated successfully" } or updated object
export const updateHoliday = async (id, payload) => {
  const userId = getUserId();
  const response = await axios.put(
    `${BASE_URL}/holiday/${id}`,
    {
      holidayName: payload.holidayName,
      holidayDate: payload.holidayDate,
      holidayType: payload.holidayType,
      calendarYear: payload.calendarYear,
      updatedBy: userId,
    },
    authHeaders()
  );
  return response.data;
};

// ── DELETE /api/holiday/:id ───────────────────
// Response: { message: "Holiday deleted successfully" }
export const deleteHoliday = async (id) => {
  const response = await axios.delete(
    `${BASE_URL}/holiday/${id}/deactivate`,
    authHeaders()
  );
  return response.data;
};

// ── Holiday type mapping ──────────────────────
export const HOLIDAY_TYPES = {
  "National Holiday": { label: "National Holiday", color: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", dot: "bg-blue-400" },
  "Optional Holiday": { label: "Optional Holiday", color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-400" },
  "Company Holiday": { label: "Company Holiday", color: "bg-violet-50 text-violet-700 ring-1 ring-violet-200", dot: "bg-violet-400" },
};

export const HOLIDAY_TYPE_OPTIONS = [
  { value: "National Holiday", label: "National Holiday" },
  { value: "Optional Holiday", label: "Optional Holiday" },
  { value: "Company Holiday", label: "Company Holiday" },
];

export const normalizeHolidayType = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "1" || normalized === "national holiday") return "National Holiday";
  if (normalized === "2" || normalized === "optional holiday") return "Optional Holiday";
  if (normalized === "3" || normalized === "company holiday") return "Company Holiday";

  return value || DEFAULT_HOLIDAY_TYPE;
};

// ── Generate year options (current ± 2) ───────
export const getYearOptions = () => {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1, current + 2];
};

// ── MOCK DATA — remove when GET API is ready ──
