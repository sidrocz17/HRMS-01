// src/api/attendanceApi.js

import axios from "axios";
import { buildApiUrl } from "./apiBase";
import { getToken, getUserFromToken } from "../utils/auth.js";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  },
});

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const getResponseObjects = (value) => {
  const root = asObject(value);
  const data = asObject(root.data);

  return [
    root,
    data,
    asObject(root.result),
    asObject(root.payload),
    asObject(root.attendance),
    asObject(data.result),
    asObject(data.payload),
    asObject(data.attendance),
  ];
};

const firstFilled = (...values) =>
  values.find(
    (value) => value !== undefined && value !== null && String(value).trim() !== ""
  );

const isIsoDateLike = (value) =>
  typeof value === "string" &&
  (/^\d{4}-\d{2}-\d{2}T/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value));

const isTimeOnly = (value) =>
  typeof value === "string" &&
  /^\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?$/.test(value);

const combineDateAndTime = (dateValue, timeValue) => {
  const normalizedDate =
    typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? dateValue
      : null;

  if (!normalizedDate || !isTimeOnly(timeValue)) return null;

  return `${normalizedDate}T${String(timeValue).trim()}`;
};

const toIsoString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && isIsoDateLike(value)) {
    return value.length === 10 ? `${value}T00:00:00` : value;
  }
  return null;
};

const pad = (value) => String(value).padStart(2, "0");

const formatDisplayDate = (value) => {
  const iso = toIsoString(value);
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDisplayTime = (value) => {
  if (isTimeOnly(value)) {
    const [hourValue = "0", minuteValue = "0"] = String(value).split(":");
    const hours = Number(hourValue);
    const minutes = Number(minuteValue);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return "—";

    const ampm = hours >= 12 ? "PM" : "AM";
    const hh = hours % 12 || 12;
    return `${pad(hh)}:${pad(minutes)} ${ampm}`;
  }

  const iso = toIsoString(value);
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hh = hours % 12 || 12;
  return `${pad(hh)}:${pad(minutes)} ${ampm}`;
};

const calcWorkingHours = (inISO, outISO) => {
  if (!inISO || !outISO) return "—";

  const diffSeconds = Math.floor(
    (new Date(outISO) - new Date(inISO)) / 1000
  );

  if (Number.isNaN(diffSeconds) || diffSeconds < 0) return "—";

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  return `${hours}h ${pad(minutes)}m`;
};

const formatWorkingHours = (value, inISO, outISO) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${hours}h ${pad(minutes)}m`;
  }

  if (typeof value === "string" && /^\d{2}:\d{2}:\d{2}$/.test(value)) {
    const [hours = "00", minutes = "00"] = value.split(":");
    return `${Number(hours)}h ${minutes}m`;
  }

  if (typeof value === "string" && /^\d+:\d{2}$/.test(value)) {
    const [hours = "0", minutes = "00"] = value.split(":");
    return `${Number(hours)}h ${minutes}m`;
  }

  return calcWorkingHours(inISO, outISO);
};

const getRequiredEmployeeId = () => {
  const { empId: employeeId } = getUserFromToken();
  const normalized = String(employeeId || "").trim();

  if (!normalized) {
    throw new Error("Employee ID missing. Please log out and log in again.");
  }

  return normalized;
};

const mapAttendanceRecord = (item = {}, index = 0) => {
  const sources = getResponseObjects(item);
  const rawInTime = firstFilled(
    ...sources.map((source) =>
      firstFilled(
        source.inTime,
        source.checkIn,
        source.checkInTime,
        source.check_in,
        source.check_in_time,
        source.punchInTime,
        source.punchIn,
        source.in_time
      )
    )
  );
  const rawOutTime = firstFilled(
    ...sources.map((source) =>
      firstFilled(
        source.outTime,
        source.checkOut,
        source.checkOutTime,
        source.check_out,
        source.check_out_time,
        source.punchOutTime,
        source.punchOut,
        source.out_time
      )
    )
  );
  const dateValue = firstFilled(
    ...sources.map((source) =>
      firstFilled(
        source.date,
        source.attendanceDate,
        source.attendance_date,
        source.workDate,
        source.work_date
      )
    )
  );
  const inISO = toIsoString(rawInTime) || combineDateAndTime(dateValue, rawInTime);
  const outISO = toIsoString(rawOutTime) || combineDateAndTime(dateValue, rawOutTime);
  const employeeName = firstFilled(
    ...sources.map((source) =>
      firstFilled(
        source.fullName,
        source.employeeName,
        source.empName,
        source.employee_name,
        source.emp_name,
        source.name,
        source.userName,
        source.username
      )
    )
  );
  const workingHourValue = firstFilled(
    ...sources.map((source) =>
      firstFilled(
        source.workingHours,
        source.workingHour,
        source.working_hours,
        source.working_hour
      )
    )
  );
  const statusValue = firstFilled(
    ...sources.map((source) =>
      firstFilled(
        source.status,
        source.attendanceStatus,
        source.attendance_status
      )
    )
  );
  const remarksValue = firstFilled(
    ...sources.map((source) =>
      firstFilled(source.remarks, source.remark, source.note, source.notes)
    )
  );
  const normalizedDateISO =
    (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? dateValue
      : inISO?.slice(0, 10) || outISO?.slice(0, 10) || "");

  return {
    id: firstFilled(
      ...sources.map((source) =>
        firstFilled(
          source.id,
          source.attendanceId,
          source.attendance_id,
          source.uuid,
          source.recordId
        )
      )
    ) || firstFilled(
      ...sources.map((source) =>
        firstFilled(source.empId, source.employeeId, source.emp_id, source.employee_id)
      )
    ) || `attendance-${index + 1}`,
    employeeId: firstFilled(
      ...sources.map((source) =>
        firstFilled(
          source.employeeId,
          source.empId,
          source.employee_id,
          source.emp_id,
          source.userId,
          source.user_id
        )
      )
    ) || "",
    employeeName: employeeName || "",
    dateISO: normalizedDateISO,
    date: formatDisplayDate(dateValue),
    inTime: formatDisplayTime(rawInTime || inISO),
    outTime: formatDisplayTime(rawOutTime || outISO),
    workingHours: formatWorkingHours(workingHourValue, inISO, outISO),
    status: String(statusValue || "").trim().toUpperCase(),
    remarks: remarksValue || "",
    inISO,
    outISO,
  };
};

const normalizeAttendanceResponse = (response) =>
  toArray(response)
    .map(mapAttendanceRecord)
    .filter((record) => record.id)
    .sort((a, b) => {
      const aTime = new Date(a.inISO || `${a.dateISO || "1970-01-01"}T00:00:00`).getTime();
      const bTime = new Date(b.inISO || `${b.dateISO || "1970-01-01"}T00:00:00`).getTime();
      return bTime - aTime;
    });

const postAttendanceToggle = async () => {
  const response = await axios.post(
    buildApiUrl("/attendance"),
    { empId: getRequiredEmployeeId() },
    authHeaders()
  );
  const normalized = mapAttendanceRecord(response.data);

  return {
    ...normalized,
    raw: response.data,
  };
};

// ── POST /attendance ──────────────────────────
// Backend toggles between check-in and check-out
// based on the employee's current attendance state.
export const punchIn = async () => postAttendanceToggle();

// ── POST /attendance ──────────────────────────
// Same endpoint used for check-out after check-in.
export const punchOut = async () => postAttendanceToggle();

// ── GET /attendance/employee/:id ──────────────
// Returns attendance history for the logged-in employee.
export const getAttendanceByEmployeeId = async (employeeId) => {
  const normalizedEmployeeId = String(employeeId || "").trim();

  if (!normalizedEmployeeId) {
    throw new Error("Employee ID is required to load attendance history.");
  }

  const response = await axios.get(
    buildApiUrl(`/attendance/employee/${normalizedEmployeeId}`),
    authHeaders()
  );
  return normalizeAttendanceResponse(response.data);
};

export const getAttendance = async () => {
  const employeeId = getRequiredEmployeeId();
  return getAttendanceByEmployeeId(employeeId);
};

// ── GET /attendance/all?date=YYYY-MM-DD ───────
// HR / ADMIN: returns all visible records for a specific date.
export const getAllAttendance = async (date) => {
  const response = await axios.get(buildApiUrl("/attendance/all"), {
    ...authHeaders(),
    params: date ? { date } : {},
  });
  return normalizeAttendanceResponse(response.data);
};
