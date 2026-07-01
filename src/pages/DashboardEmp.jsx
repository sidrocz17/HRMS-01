import {
  getTodayDateKey,
  useAttendanceStats,
  useEmployeeDashboard,
  useLeaveStats,
  useRecentActivities,
} from "../hooks/query/useDashboard";
import { getLoggedInEmpId } from "../api/profileApi";
import { getUserFromToken } from "../utils/auth.js";

const getFirstName = (profile) => {
  const user = getUserFromToken();
  const profileFirstName = profile?.firstName || profile?.first_name || "";
  const tokenFirstName = user.claims?.firstName || user.claims?.first_name || "";
  const fullName =
    profile?.fullName ||
    profile?.name ||
    user.claims?.name ||
    user.claims?.fullName ||
    user.claims?.full_name ||
    "";

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

const getLeaveBalanceValue = (leaveBalance) => {
  if (!leaveBalance) return 0;

  if (Array.isArray(leaveBalance)) {
    return leaveBalance.reduce((total, item) => {
      const remaining =
        item.remainingLeaves ??
        item.totalRemaining ??
        item.remaining ??
        item.balance ??
        0;
      return total + Number(remaining || 0);
    }, 0);
  }

  return (
    leaveBalance.totalRemaining ??
    leaveBalance.remainingLeaves ??
    leaveBalance.remaining ??
    leaveBalance.balance ??
    0
  );
};

function MetricCard({ label, value, sub, loading, tone = "navy" }) {
  const toneClass = {
    navy: "bg-[#1a2240] text-white",
    amber: "bg-[#f5a623] text-[#3d2700]",
    green: "bg-[#2d7d3a] text-white",
  };

  return (
    <div className={`${toneClass[tone]} rounded-2xl shadow-lg p-6`}>
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 w-20 rounded bg-white/25" />
          <div className="h-4 w-28 rounded bg-white/20" />
          <div className="h-4 w-36 rounded bg-white/20" />
        </div>
      ) : (
        <>
          <p className="text-4xl font-bold leading-none">{value}</p>
          <p className="mt-2 text-sm font-semibold opacity-80">{label}</p>
          <p className="mt-3 text-xs opacity-75">{sub}</p>
        </>
      )}
    </div>
  );
}

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

export default function DashboardEmp() {
  const employeeId = getLoggedInEmpId();
  const employeeDashboardQuery = useEmployeeDashboard(employeeId);
  const leaveStatsQuery = useLeaveStats(employeeId, { enabled: Boolean(employeeId) });
  const attendanceQuery = useAttendanceStats({
    date: getTodayDateKey(),
    isAdminOrHR: false,
    enabled: Boolean(employeeId),
  });
  const activitiesQuery = useRecentActivities();

  const profile = employeeDashboardQuery.data?.profile;
  const leaveSummary =
    leaveStatsQuery.data || employeeDashboardQuery.data?.leaveSummary || {};
  const leaveBalance = employeeDashboardQuery.data?.leaveBalance;
  const todayAttendance = attendanceQuery.data?.todayAttendance || [];
  const holidays = activitiesQuery.data?.upcomingHolidays || [];
  const firstName = getFirstName(profile);
  const currentAttendance = todayAttendance[0];

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back, {firstName}. Here&apos;s your work snapshot for today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDashboardDate()}
          </div>
        </div>

        {employeeDashboardQuery.isError ? (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            Unable to load your dashboard details right now.
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <MetricCard
            label="Attendance"
            value={currentAttendance?.status || "Not marked"}
            sub={
              currentAttendance
                ? `In: ${currentAttendance.inTime} • Out: ${currentAttendance.outTime}`
                : "No check-in recorded today"
            }
            loading={attendanceQuery.isLoading}
            tone="amber"
          />
          <MetricCard
            label="Leave Requests"
            value={leaveSummary?.totalRequests ?? 0}
            sub={`${leaveSummary?.pendingRequests ?? 0} pending, ${leaveSummary?.approvedRequests ?? 0} approved`}
            loading={leaveStatsQuery.isLoading}
          />
          <MetricCard
            label="Leave Balance"
            value={getLeaveBalanceValue(leaveBalance)}
            sub="available leave balance"
            loading={employeeDashboardQuery.isLoading}
            tone="green"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4 mt-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Today&apos;s Attendance</h2>
            </div>
            {attendanceQuery.isLoading ? (
              <EmptyState>Loading attendance...</EmptyState>
            ) : attendanceQuery.isError ? (
              <ErrorState>Unable to load attendance.</ErrorState>
            ) : !currentAttendance ? (
              <EmptyState>No attendance record for today.</EmptyState>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Status</p>
                  <p className="mt-1 text-sm font-bold text-gray-800">{currentAttendance.status}</p>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">In / Out</p>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {currentAttendance.inTime} / {currentAttendance.outTime}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Hours</p>
                  <p className="mt-1 text-sm font-bold text-gray-800">{currentAttendance.workingHours}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Upcoming Holidays</h2>
            </div>
            {activitiesQuery.isLoading ? (
              <EmptyState>Loading holidays...</EmptyState>
            ) : activitiesQuery.isError ? (
              <ErrorState>Unable to load holidays.</ErrorState>
            ) : holidays.length === 0 ? (
              <EmptyState>No upcoming holidays found.</EmptyState>
            ) : (
              <ul className="space-y-2.5">
                {holidays.map((holiday) => (
                  <li
                    key={holiday.id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${holiday.color}`}
                  >
                    <span className="text-sm font-semibold">{holiday.name}</span>
                    <div className="text-right">
                      <p className="text-xs font-medium opacity-90">{holiday.date}</p>
                      <p className="text-xs opacity-60">{holiday.day}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
