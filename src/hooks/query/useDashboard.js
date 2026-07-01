import { useQuery } from "@tanstack/react-query";
import { getAllAttendance, getAttendance } from "../../api/attendanceApi";
import {
  fetchLeaveBalance,
  getEmployeeSummary,
  getLeaveSummary,
  getTodayBirthdays,
  getTodayWorkAnniversaries,
  getUpcomingHolidays,
} from "../../api/dashboardApi";
import { getProfile } from "../../api/profileApi";

const DASHBOARD_STALE_TIME = 2 * 60 * 1000;
const ATTENDANCE_STALE_TIME = 30 * 1000;
const REFERENCE_STALE_TIME = 10 * 60 * 1000;

const HOLIDAY_STYLES = [
  "bg-pink-100 border-pink-300 text-pink-700",
  "bg-indigo-100 border-indigo-300 text-indigo-700",
  "bg-green-100 border-green-300 text-green-700",
];

const pad = (value) => String(value).padStart(2, "0");

export const dashboardQueryKeys = {
  all: ["dashboard"],
  stats: () => [...dashboardQueryKeys.all, "stats"],
  employeeDashboard: (employeeId) => [
    ...dashboardQueryKeys.all,
    "employee",
    { employeeId: String(employeeId || "") },
  ],
  attendanceStats: ({ date, isAdminOrHR } = {}) => [
    ...dashboardQueryKeys.all,
    "attendance",
    { date: String(date || ""), scope: isAdminOrHR ? "all" : "employee" },
  ],
  leaveStats: (employeeId) => [
    ...dashboardQueryKeys.all,
    "leave",
    { employeeId: String(employeeId || "") },
  ],
  recentActivities: () => [...dashboardQueryKeys.all, "recentActivities"],
};

export const getTodayDateKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "NA";

const deriveAttendanceStatus = (record = {}) => {
  const apiStatus = String(record.status || "").trim().toUpperCase();
  if (apiStatus) return apiStatus;

  if (!record.inTime || record.inTime === "—") return "ABSENT";

  const [timePart, meridiem] = String(record.inTime).trim().split(" ");
  if (!timePart || !meridiem) return "PRESENT";

  let [hours, minutes] = timePart.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const inAs24 = `${pad(hours)}:${pad(minutes)}`;
  return inAs24 > "09:30" ? "LATE" : "PRESENT";
};

const normalizeTodayAttendance = (records = [], date = getTodayDateKey()) =>
  (Array.isArray(records) ? records : [])
    .filter((record) => {
      const recordDate =
        record.dateISO ||
        record.inISO?.slice(0, 10) ||
        record.outISO?.slice(0, 10) ||
        "";
      const hasInTime = Boolean(record.inTime && record.inTime !== "—");
      return recordDate === date && hasInTime;
    })
    .map((record, index) => {
      const name = record.employeeName || "Employee";

      return {
        id: record.id || `${name}-${index}`,
        name,
        initials: getInitials(name),
        inTime: record.inTime || "—",
        outTime: record.outTime || "—",
        workingHours: record.workingHours || "—",
        status: deriveAttendanceStatus(record),
      };
    })
    .slice(0, 5);

const formatEventDate = (value) => {
  const dateValue = value ? String(value).slice(0, 10) : "";
  const parsedDate = dateValue ? new Date(`${dateValue}T00:00:00`) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return value || "-";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeHolidays = (holidays = []) =>
  (Array.isArray(holidays) ? holidays : []).map((holiday, index) => {
    const holidayDate = holiday.holidayDate || holiday.date || "";
    const parsedDate = holidayDate ? new Date(`${holidayDate}T00:00:00`) : null;

    return {
      id:
        holiday.holidayId ||
        holiday.id ||
        `${holiday.holidayName || "holiday"}-${holidayDate}-${index}`,
      name: holiday.holidayName || holiday.name || "Holiday",
      date: formatEventDate(holidayDate),
      day:
        parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleDateString("en-US", { weekday: "long" })
          : "-",
      color: HOLIDAY_STYLES[index % HOLIDAY_STYLES.length],
    };
  });

const normalizePeopleEvents = (items = [], type = "event") =>
  (Array.isArray(items) ? items : []).map((item, index) => {
    const name = item?.name || item?.employeeName || "Employee";
    const dateValue =
      item?.date ||
      item?.joinDate ||
      item?.dateOfBirth ||
      item?.dob ||
      "";

    return {
      id: item?.empId || item?.id || `${type}-${name}-${index}`,
      name,
      date: formatEventDate(dateValue),
      initials: getInitials(name),
    };
  });

export const useDashboardStats = (options = {}) =>
  useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: async () => {
      const [employeeSummary, leaveSummary] = await Promise.all([
        getEmployeeSummary(),
        getLeaveSummary(),
      ]);

      return {
        employeeSummary: employeeSummary || null,
        leaveSummary: leaveSummary || null,
      };
    },
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? DASHBOARD_STALE_TIME,
  });

export const useEmployeeDashboard = (employeeId, options = {}) =>
  useQuery({
    queryKey: dashboardQueryKeys.employeeDashboard(employeeId),
    queryFn: async () => {
      const [profile, leaveSummary, leaveBalance, attendanceRecords] =
        await Promise.all([
          getProfile(employeeId),
          getLeaveSummary(employeeId),
          fetchLeaveBalance(employeeId),
          getAttendance(),
        ]);

      return {
        profile: profile || null,
        leaveSummary: leaveSummary || null,
        leaveBalance: leaveBalance || null,
        attendanceRecords: Array.isArray(attendanceRecords) ? attendanceRecords : [],
      };
    },
    enabled: Boolean(employeeId) && options.enabled !== false,
    staleTime: options.staleTime ?? DASHBOARD_STALE_TIME,
  });

export const useAttendanceStats = ({
  date = getTodayDateKey(),
  isAdminOrHR = false,
  enabled = true,
  staleTime,
} = {}) =>
  useQuery({
    queryKey: dashboardQueryKeys.attendanceStats({ date, isAdminOrHR }),
    queryFn: () => (isAdminOrHR ? getAllAttendance(date) : getAttendance()),
    enabled,
    staleTime: staleTime ?? ATTENDANCE_STALE_TIME,
    refetchInterval: ATTENDANCE_STALE_TIME,
    select: (records) => {
      const todayAttendance = normalizeTodayAttendance(records, date);

      return {
        records: Array.isArray(records) ? records : [],
        todayAttendance,
        totalToday: todayAttendance.length,
        present: todayAttendance.filter((record) => record.status === "PRESENT")
          .length,
        late: todayAttendance.filter((record) => record.status === "LATE").length,
        absent: todayAttendance.filter((record) => record.status === "ABSENT")
          .length,
      };
    },
  });

export const useLeaveStats = (employeeId, options = {}) =>
  useQuery({
    queryKey: dashboardQueryKeys.leaveStats(employeeId),
    queryFn: () => getLeaveSummary(employeeId),
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? DASHBOARD_STALE_TIME,
  });

export const useRecentActivities = (options = {}) =>
  useQuery({
    queryKey: dashboardQueryKeys.recentActivities(),
    queryFn: async () => {
      const [holidays, workAnniversaries, birthdays] = await Promise.all([
        getUpcomingHolidays(),
        getTodayWorkAnniversaries(),
        getTodayBirthdays(),
      ]);

      return {
        upcomingHolidays: normalizeHolidays(holidays),
        workAnniversaries: normalizePeopleEvents(
          workAnniversaries,
          "anniversary"
        ),
        birthdays: normalizePeopleEvents(birthdays, "birthday"),
      };
    },
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? REFERENCE_STALE_TIME,
  });
