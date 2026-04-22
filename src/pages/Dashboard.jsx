import { useEffect, useState } from "react";
import DashboardCards from "../components/DashboardCards";
import { getAllAttendance, getAttendance } from "../api/attendanceApi";
import { getLoggedInEmpId, getProfile } from "../api/profileApi";
import {
  getTodayBirthdays,
  getTodayWorkAnniversaries,
  getUpcomingHolidays,
} from "../api/dashboardApi";
import { ROLES } from "../config/roles.jsx";
import { getUserFromToken } from "../utils/auth.js";

const HOLIDAY_STYLES = [
  "bg-pink-100 border-pink-300 text-pink-700",
  "bg-indigo-100 border-indigo-300 text-indigo-700",
  "bg-green-100 border-green-300 text-green-700",
];

const ATTENDANCE_STATUS_META = {
  PRESENT: {
    label: "Present",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dotClass: "bg-emerald-400",
  },
  LATE: {
    label: "Late",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-200",
    dotClass: "bg-amber-400",
  },
  ABSENT: {
    label: "Absent",
    badgeClass: "bg-rose-50 text-rose-700 ring-rose-200",
    dotClass: "bg-rose-400",
  },
};

const pad = (value) => String(value).padStart(2, "0");
const DASHBOARD_REFRESH_INTERVAL_MS = 30000;

const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

const deriveAttendanceStatus = (record = {}) => {
  const apiStatus = String(record.status || "").trim().toUpperCase();
  if (apiStatus) return apiStatus;

  if (!record.inTime || record.inTime === "—") return "ABSENT";

  const [timePart, meridiem] = String(record.inTime).trim().split(" ");
  if (!timePart || !meridiem) return "PRESENT";

  let [hours, minutes] = timePart.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const inAs24 = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return inAs24 > "09:30" ? "LATE" : "PRESENT";
};

const getDashboardFirstName = () => {
  const user = getUserFromToken();
  const firstName =
    user.claims?.firstName ||
    user.claims?.first_name ||
    "";
  const fullName =
    user.claims?.name ||
    user.claims?.fullName ||
    user.claims?.full_name ||
    "";

  if (String(firstName).trim()) return String(firstName).trim();
  if (String(fullName).trim()) return String(fullName).trim().split(" ")[0];

  return "User";
};

export default function Dashboard() {
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [workAnniversaries, setWorkAnniversaries] = useState([]);
  const [anniversariesLoading, setAnniversariesLoading] = useState(true);
  const [birthdays, setBirthdays] = useState([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(true);
  const [dashboardFirstName, setDashboardFirstName] = useState(() =>
    getDashboardFirstName()
  );

  useEffect(() => {
    let isMounted = true;
    const employeeId = getLoggedInEmpId();

    if (!employeeId) return undefined;

    getProfile(employeeId)
      .then((profile) => {
        if (!isMounted) return;

        const employeeFirstName =
          profile?.firstName ||
          profile?.first_name ||
          "";

        if (String(employeeFirstName).trim()) {
          setDashboardFirstName(String(employeeFirstName).trim());
        }
      })
      .catch((error) => {
        console.error("❌ Failed to load employee profile for dashboard greeting:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const refreshDashboard = async ({ showLoading = false } = {}) => {
      if (showLoading) {
        setAttendanceLoading(true);
        setAnniversariesLoading(true);
        setBirthdaysLoading(true);
      }

      const { role } = getUserFromToken();
      const todayDate = getTodayDate();
      const attendanceRequest =
        role === ROLES.ADMIN || role === ROLES.HR
          ? getAllAttendance(todayDate)
          : getAttendance();

      const [
        attendanceResult,
        holidaysResult,
        anniversariesResult,
        birthdaysResult,
      ] = await Promise.allSettled([
        attendanceRequest,
        getUpcomingHolidays(),
        getTodayWorkAnniversaries(),
        getTodayBirthdays(),
      ]);

      if (!isMounted) return;

      if (attendanceResult.status === "fulfilled") {
        const normalized = (Array.isArray(attendanceResult.value) ? attendanceResult.value : [])
          .filter((record) => {
            const recordDate =
              record.dateISO || record.inISO?.slice(0, 10) || record.outISO?.slice(0, 10) || "";
            const hasInTime = Boolean(record.inTime && record.inTime !== "—");
            return recordDate === todayDate && hasInTime;
          })
          .map((record, index) => {
            const name = record.employeeName || "Employee";
            const initials = name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("");

            return {
              id: record.id || `${name}-${index}`,
              name,
              initials: initials || "NA",
              inTime: record.inTime || "—",
              outTime: record.outTime || "—",
              workingHours: record.workingHours || "—",
              status: deriveAttendanceStatus(record),
            };
          })
          .slice(0, 5);

        setTodayAttendance(normalized);
      } else {
        console.error("❌ Failed to load today's attendance:", attendanceResult.reason);
        setTodayAttendance([]);
      }

      if (holidaysResult.status === "fulfilled") {
        const normalized = (Array.isArray(holidaysResult.value) ? holidaysResult.value : []).map(
          (holiday, index) => {
            const holidayDate = holiday.holidayDate || holiday.date || "";
            const parsedDate = holidayDate
              ? new Date(`${holidayDate}T00:00:00`)
              : null;

            return {
              id:
                holiday.holidayId ||
                holiday.id ||
                `${holiday.holidayName || "holiday"}-${holidayDate}-${index}`,
              name: holiday.holidayName || holiday.name || "Holiday",
              date:
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : holidayDate || "-",
              day:
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                    })
                  : "-",
              color: HOLIDAY_STYLES[index % HOLIDAY_STYLES.length],
            };
          }
        );

        setUpcomingHolidays(normalized);
      } else {
        console.error("❌ Failed to load upcoming holidays:", holidaysResult.reason);
        setUpcomingHolidays([]);
      }

      if (anniversariesResult.status === "fulfilled") {
        const normalized = (Array.isArray(anniversariesResult.value) ? anniversariesResult.value : []).map(
          (anniversary, index) => {
            const name = anniversary?.name || anniversary?.employeeName || "Employee";
            const dateValue = anniversary?.date || anniversary?.joinDate || "";
            const parsedDate = dateValue
              ? new Date(`${String(dateValue).slice(0, 10)}T00:00:00`)
              : null;
            const initials = name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("");

            return {
              id: anniversary?.empId || anniversary?.id || `${name}-${index}`,
              name,
              date:
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : dateValue || "-",
              initials: initials || "NA",
            };
          }
        );

        setWorkAnniversaries(normalized);
      } else {
        console.error("❌ Failed to load today's work anniversaries:", anniversariesResult.reason);
        setWorkAnniversaries([]);
      }

      if (birthdaysResult.status === "fulfilled") {
        const normalized = (Array.isArray(birthdaysResult.value) ? birthdaysResult.value : []).map(
          (birthday, index) => {
            const name = birthday?.name || birthday?.employeeName || "Employee";
            const dateValue = birthday?.date || birthday?.dateOfBirth || "";
            const parsedDate = dateValue
              ? new Date(`${String(dateValue).slice(0, 10)}T00:00:00`)
              : null;
            const initials = name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("");

            return {
              id: birthday?.empId || birthday?.id || `${name}-${index}`,
              name,
              date:
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : dateValue || "-",
              initials: initials || "NA",
            };
          }
        );

        setBirthdays(normalized);
      } else {
        console.error("❌ Failed to load today's birthdays:", birthdaysResult.reason);
        setBirthdays([]);
      }

      setAttendanceLoading(false);
      setAnniversariesLoading(false);
      setBirthdaysLoading(false);
    };

    refreshDashboard({ showLoading: true });
    const intervalId = window.setInterval(() => {
      refreshDashboard();
    }, DASHBOARD_REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back, {dashboardFirstName}. Here&apos;s what&apos;s happening today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Mon, 16 March 2026
          </div>
        </div>

        {/* Summary Cards */}
        <DashboardCards />

        {/* Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4 mt-5">
          {/* Today's Attendance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Today's Attendance</h2>
            </div>
            {attendanceLoading ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                Loading attendance...
              </div>
            ) : todayAttendance.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                No attendance records for today.
              </div>
            ) : (
              <ul className="space-y-2">
                {todayAttendance.map((item) => {
                  const statusMeta =
                    item.status === "ABSENT"
                      ? null
                      : ATTENDANCE_STATUS_META[item.status] || ATTENDANCE_STATUS_META.PRESENT;

                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                        {item.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {item.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          In: {item.inTime} • Out: {item.outTime} • Hours: {item.workingHours}
                        </p>
                      </div>
                      {statusMeta ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                          {statusMeta.label}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Upcoming Holidays + Highlights */}
          <div className="flex flex-col gap-6">
            {/* Holidays */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-800">Upcoming Holidays</h2>
                <button className="text-xs text-[#1a2240] font-medium hover:underline">View all</button>
              </div>
              {upcomingHolidays.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  No upcoming holidays found.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {upcomingHolidays.map((h) => (
                    <li key={h.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${h.color}`}>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">{h.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium opacity-90">{h.date}</p>
                        <p className="text-xs opacity-60">{h.day}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Today's Work Anniversaries */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Work Anniversaries
                  </h2>
                </div>
                {anniversariesLoading ? (
                  <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                    Loading anniversaries...
                  </div>
                ) : workAnniversaries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                    No work anniversaries today.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {workAnniversaries.map((employee) => (
                      <li
                        key={employee.id}
                        className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                          {employee.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-800">
                            {employee.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Anniversary date: {employee.date}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Today's Birthdays */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Birthdays
                  </h2>
                </div>
                {birthdaysLoading ? (
                  <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                    Loading birthdays...
                  </div>
                ) : birthdays.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                    No birthdays today.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {birthdays.map((employee) => (
                      <li
                        key={employee.id}
                        className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-semibold text-pink-700">
                          {employee.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-800">
                            {employee.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Birthday: {employee.date}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
