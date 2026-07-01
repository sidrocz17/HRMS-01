import DashboardCards from "../components/DashboardCards";
import {
  getTodayDateKey,
  useAttendanceStats,
  useDashboardStats,
  useEmployeeDashboard,
  useRecentActivities,
} from "../hooks/query/useDashboard";
import { getLoggedInEmpId } from "../api/profileApi";
import { ROLES } from "../config/roles.jsx";
import { getUserFromToken } from "../utils/auth.js";
import DashboardEmp from "./DashboardEmp";

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

const getDashboardFirstName = (profile) => {
  const user = getUserFromToken();
  const profileFirstName = profile?.firstName || profile?.first_name || "";
  const tokenFirstName = user.claims?.firstName || user.claims?.first_name || "";
  const fullName =
    user.claims?.name || user.claims?.fullName || user.claims?.full_name || "";

  if (String(profileFirstName).trim()) return String(profileFirstName).trim();
  if (String(tokenFirstName).trim()) return String(tokenFirstName).trim();
  if (String(fullName).trim()) return String(fullName).trim().split(" ")[0];

  return "User";
};

const formatDashboardDate = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

function ErrorState({ children }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
      {children}
    </div>
  );
}

function LoadingState({ children }) {
  return (
    <div className="animate-pulse rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

function AdminDashboard() {
  const { role } = getUserFromToken();
  const employeeId = getLoggedInEmpId();
  const isAdminOrHR = role === ROLES.ADMIN || role === ROLES.HR;
  const todayDate = getTodayDateKey();

  const dashboardStatsQuery = useDashboardStats();
  const employeeDashboardQuery = useEmployeeDashboard(employeeId);
  const attendanceQuery = useAttendanceStats({
    date: todayDate,
    isAdminOrHR,
  });
  const activitiesQuery = useRecentActivities();

  const dashboardFirstName = getDashboardFirstName(
    employeeDashboardQuery.data?.profile
  );
  const todayAttendance = attendanceQuery.data?.todayAttendance || [];
  const upcomingHolidays = activitiesQuery.data?.upcomingHolidays || [];
  const workAnniversaries = activitiesQuery.data?.workAnniversaries || [];
  const birthdays = activitiesQuery.data?.birthdays || [];

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6">
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
            {formatDashboardDate()}
          </div>
        </div>

        <DashboardCards
          employeeSummary={dashboardStatsQuery.data?.employeeSummary}
          leaveSummary={dashboardStatsQuery.data?.leaveSummary}
          attendanceStats={attendanceQuery.data}
          loading={dashboardStatsQuery.isLoading}
          attendanceLoading={attendanceQuery.isLoading}
          error={dashboardStatsQuery.error}
        />

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4 mt-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Today&apos;s Attendance</h2>
            </div>
            {attendanceQuery.isLoading ? (
              <LoadingState>Loading attendance...</LoadingState>
            ) : attendanceQuery.isError ? (
              <ErrorState>Unable to load attendance records.</ErrorState>
            ) : todayAttendance.length === 0 ? (
              <EmptyState>No attendance records for today.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {todayAttendance.map((item) => {
                  const statusMeta =
                    item.status === "ABSENT"
                      ? null
                      : ATTENDANCE_STATUS_META[item.status] ||
                        ATTENDANCE_STATUS_META.PRESENT;

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

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-800">Upcoming Holidays</h2>
                <button className="text-xs text-[#1a2240] font-medium hover:underline">View all</button>
              </div>
              {activitiesQuery.isLoading ? (
                <LoadingState>Loading holidays...</LoadingState>
              ) : activitiesQuery.isError ? (
                <ErrorState>Unable to load holidays.</ErrorState>
              ) : upcomingHolidays.length === 0 ? (
                <EmptyState>No upcoming holidays found.</EmptyState>
              ) : (
                <ul className="space-y-2.5">
                  {upcomingHolidays.map((holiday) => (
                    <li
                      key={holiday.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${holiday.color}`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">{holiday.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium opacity-90">{holiday.date}</p>
                        <p className="text-xs opacity-60">{holiday.day}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Work Anniversaries
                  </h2>
                </div>
                {activitiesQuery.isLoading ? (
                  <LoadingState>Loading anniversaries...</LoadingState>
                ) : activitiesQuery.isError ? (
                  <ErrorState>Unable to load anniversaries.</ErrorState>
                ) : workAnniversaries.length === 0 ? (
                  <EmptyState>No work anniversaries today.</EmptyState>
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

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Birthdays
                  </h2>
                </div>
                {activitiesQuery.isLoading ? (
                  <LoadingState>Loading birthdays...</LoadingState>
                ) : activitiesQuery.isError ? (
                  <ErrorState>Unable to load birthdays.</ErrorState>
                ) : birthdays.length === 0 ? (
                  <EmptyState>No birthdays today.</EmptyState>
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

export default function Dashboard() {
  const { role } = getUserFromToken();

  return role === ROLES.EMPLOYEE ? <DashboardEmp /> : <AdminDashboard />;
}
