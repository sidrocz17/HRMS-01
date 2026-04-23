import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllAttendance,
  getAttendance,
  punchIn,
  punchOut,
} from "../api/attendanceApi";
import { getLoggedInEmpId, getProfile } from "../api/profileApi";
import {
  getTodayBirthdays,
  getTodayWorkAnniversaries,
  getUpcomingHolidays,
} from "../api/dashboardApi";
import { fetchLeaveBalance } from "../api/leaveApi";
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

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
];

const getDailyQuote = () => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
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
  const firstName = user.claims?.firstName || user.claims?.first_name || "";
  const fullName = user.claims?.name || user.claims?.fullName || user.claims?.full_name || "";

  if (String(firstName).trim()) return String(firstName).trim();
  if (String(fullName).trim()) return String(fullName).trim().split(" ")[0];
  return "User";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const quote = getDailyQuote();
  const loggedInEmployeeId = getLoggedInEmpId();

  // ── Existing state (bottom section) ──────────
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [workAnniversaries, setWorkAnniversaries] = useState([]);
  const [anniversariesLoading, setAnniversariesLoading] = useState(true);
  const [birthdays, setBirthdays] = useState([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(true);
  const [dashboardFirstName, setDashboardFirstName] = useState(() => getDashboardFirstName());

  // ── New state (top section — employee cards) ──
  const [myAttendance, setMyAttendance] = useState(null); // { status, inTime, workingHours }
  const [myAttendanceLoading, setMyAttendanceLoading] = useState(
    () => Boolean(loggedInEmployeeId)
  );
  const [previousAttendance, setPreviousAttendance] = useState([]);

  // Leave balance summary
  // Shape: { remaining: 0, used: 0, pending: 0 }
  const [myLeave, setMyLeave] = useState({ remaining: null, used: null, pending: null });
  const [myLeaveLoading, setMyLeaveLoading] = useState(
    () => Boolean(loggedInEmployeeId)
  );
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [attendanceActionError, setAttendanceActionError] = useState("");

  const syncAttendanceState = (records = []) => {
    const attendanceRecords = Array.isArray(records) ? records : [];
    const todayDate = getTodayDate();
    const todayRecord = attendanceRecords.find((record) => {
      const recordDate =
        record.dateISO || record.inISO?.slice(0, 10) || record.outISO?.slice(0, 10) || "";
      return recordDate === todayDate;
    });

    if (todayRecord) {
      setMyAttendance({
        status: deriveAttendanceStatus(todayRecord),
        inTime: todayRecord.inTime || "—",
        workingHours: todayRecord.workingHours || "—",
      });
    } else {
      setMyAttendance({ status: "ABSENT", inTime: "—", workingHours: "—" });
    }

    const recentPreviousAttendance = attendanceRecords
      .filter((record) => {
        const recordDate =
          record.dateISO || record.inISO?.slice(0, 10) || record.outISO?.slice(0, 10) || "";
        const hasAttendanceData =
          Boolean(record.inTime && record.inTime !== "—") ||
          Boolean(record.outTime && record.outTime !== "—");

        return recordDate && recordDate !== todayDate && hasAttendanceData;
      })
      .map((record) => ({
        id: record.id,
        date: record.date || "—",
        inTime: record.inTime || "—",
        outTime: record.outTime || "—",
        workingHours: record.workingHours || "—",
      }))
      .slice(0, 3);

    setPreviousAttendance(recentPreviousAttendance);

    const normalizedTodayAttendance = attendanceRecords
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

    setTodayAttendance(normalizedTodayAttendance);
  };

  const reloadEmployeeAttendance = async () => {
    const records = await getAttendance();
    syncAttendanceState(records);
  };

  // ── Load profile name ─────────────────────────
  useEffect(() => {
    let isMounted = true;
    if (!loggedInEmployeeId) return undefined;

    getProfile(loggedInEmployeeId)
      .then((profile) => {
        if (!isMounted) return;
        const employeeFirstName = profile?.firstName || profile?.first_name || "";
        if (String(employeeFirstName).trim()) {
          setDashboardFirstName(String(employeeFirstName).trim());
        }
      })
      .catch((error) => {
        console.error("❌ Failed to load employee profile for dashboard greeting:", error);
      });

    return () => { isMounted = false; };
  }, [loggedInEmployeeId]);

  // ── Load employee's own attendance & leave ────
  useEffect(() => {
    let isMounted = true;
    if (!loggedInEmployeeId) return undefined;

    // Own attendance
    getAttendance()
      .then((records) => {
        if (!isMounted) return;
        syncAttendanceState(records);
      })
      .catch(() => {
        if (isMounted) setMyAttendance(null);
      })
      .finally(() => { if (isMounted) setMyAttendanceLoading(false); });

    // Leave balance
    // TODO: Replace `employeeId` with actual empId once API is confirmed
    fetchLeaveBalance(loggedInEmployeeId)
      .then((data) => {
        if (!isMounted) return;
        const items = Array.isArray(data) ? data
          : Array.isArray(data?.data) ? data.data : [];

        const totalRemaining = items.reduce((sum, item) => sum + (item.remainingLeaves ?? item.remaining ?? 0), 0);
        const totalUsed = items.reduce((sum, item) => sum + (item.usedLeaves ?? item.used ?? 0), 0);
        // `pending` is not typically in balance API — wire to leaves/summary if available
        // TODO: replace with actual pending count from leaves/summary endpoint
        setMyLeave({ remaining: totalRemaining, used: totalUsed, pending: null });
      })
      .catch(() => {
        if (isMounted) setMyLeave({ remaining: null, used: null, pending: null });
      })
      .finally(() => { if (isMounted) setMyLeaveLoading(false); });

    return () => { isMounted = false; };
  }, [loggedInEmployeeId]);

  // ── Load data for bottom section (unchanged) ──
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
            const parsedDate = holidayDate ? new Date(`${holidayDate}T00:00:00`) : null;

            return {
              id:
                holiday.holidayId ||
                holiday.id ||
                `${holiday.holidayName || "holiday"}-${holidayDate}-${index}`,
              name: holiday.holidayName || holiday.name || "Holiday",
              date:
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : holidayDate || "-",
              day:
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString("en-US", { weekday: "long" })
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
            const parsedDate = dateValue ? new Date(`${String(dateValue).slice(0, 10)}T00:00:00`) : null;
            const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
            return {
              id: anniversary?.empId || anniversary?.id || `${name}-${index}`,
              name,
              date:
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
            const parsedDate = dateValue ? new Date(`${String(dateValue).slice(0, 10)}T00:00:00`) : null;
            const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
            return {
              id: birthday?.empId || birthday?.id || `${name}-${index}`,
              name,
              date:
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
    const intervalId = window.setInterval(() => { refreshDashboard(); }, DASHBOARD_REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  // ── Derived values ────────────────────────────
  const { role } = getUserFromToken();
  const isEmployee = role === ROLES.EMPLOYEE;
  const hasCheckedIn =
    myAttendance?.status === "PRESENT" || myAttendance?.status === "LATE";

  const handleAttendanceAction = async () => {
    if (attendanceSubmitting) return;

    setAttendanceSubmitting(true);
    setAttendanceActionError("");

    try {
      if (hasCheckedIn) {
        await punchOut();
      } else {
        await punchIn();
      }

      await reloadEmployeeAttendance();
      window.location.reload();
    } catch (error) {
      console.error("❌ Dashboard attendance action failed:", error);
      setAttendanceActionError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          `Failed to ${hasCheckedIn ? "punch out" : "punch in"}. Please try again.`
      );
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6">

        {/* ── Page Title ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {/* {getGreeting()}, {dashboardFirstName}. Here&apos;s your summary for today. */}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            TOP SECTION — Employee summary cards
            Only rendered for EMPLOYEE role
        ════════════════════════════════════════════ */}
        {isEmployee && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-5">

            {/* ── Left: Greeting + Today's Attendance ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Top colour strip */}
              <div className="h-1.5 bg-[#1a2240]" />

              <div className="px-6 py-5">
                {/* Greeting */}
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                    {getGreeting()}
                  </p>
                  <h2 className="text-xl font-bold text-gray-900">{dashboardFirstName} 👋</h2>
                  {/* Daily quote */}
                  <p className="mt-2 text-sm text-gray-500 italic leading-relaxed">
                    &ldquo;{quote.text}&rdquo;
                    <span className="not-italic font-medium text-gray-400"> — {quote.author}</span>
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 mb-4" />

                {/* Attendance snapshot */}
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Today&apos;s Attendance
                </p>

                {myAttendanceLoading ? (
                  <div className="animate-pulse flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 bg-gray-100 rounded w-24" />
                      <div className="h-3 bg-gray-100 rounded w-40" />
                    </div>
                  </div>
                ) : myAttendance ? (
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ${
                      myAttendance.status === "ABSENT"
                        ? "bg-rose-50 ring-rose-200"
                        : myAttendance.status === "LATE"
                        ? "bg-amber-50 ring-amber-200"
                        : "bg-emerald-50 ring-emerald-200"
                    }`}>
                      {myAttendance.status === "ABSENT" ? (
                        <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-0.5">
                        <span>
                          <span className="text-xs text-gray-400 mr-1">In</span>
                          <span className="font-medium text-gray-800">{myAttendance.inTime}</span>
                        </span>
                        <span className="text-gray-200">|</span>
                        <span>
                          <span className="text-xs text-gray-400 mr-1">Hours</span>
                          <span className="font-medium text-gray-800">{myAttendance.workingHours}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No attendance data for today.</p>
                )}
              </div>
            </div>

            {/* ── Right: 2 stacked small cards ── */}
            <div className="flex flex-col gap-4">

              {/* My Leaves */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    My Leaves
                  </p>
                  <button
                    onClick={() => navigate("/leave-management")}
                    className="text-xs font-medium text-[#1a2240] hover:underline"
                  >
                    View all
                  </button>
                </div>

                {myLeaveLoading ? (
                  <div className="animate-pulse grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="rounded-xl bg-gray-100 h-14" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {/* Remaining */}
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-center">
                      <p className="text-2xl font-bold text-emerald-700 leading-none">
                        {myLeave.remaining ?? "—"}
                      </p>
                      <p className="text-xs font-medium text-emerald-600 mt-1">Remaining</p>
                    </div>
                    {/* Used */}
                    <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-center">
                      <p className="text-2xl font-bold text-amber-700 leading-none">
                        {myLeave.used ?? "—"}
                      </p>
                      <p className="text-xs font-medium text-amber-600 mt-1">Used</p>
                    </div>
                    {/* Pending — TODO: wire to leaves/summary pending count */}
                    <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-center">
                      <p className="text-2xl font-bold text-blue-700 leading-none">
                        {myLeave.pending ?? "—"}
                      </p>
                      <p className="text-xs font-medium text-blue-600 mt-1">Pending</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Quick Actions
                </p>
                <div className="flex flex-col gap-2.5">
                  {/* Apply Leave */}
                  <button
                    onClick={() => navigate("/leave-management")}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#1a2240] hover:bg-[#243055] active:scale-95 rounded-xl transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12v4m0 0h4m-4 0H8" />
                    </svg>
                    Apply Leave
                  </button>

                  {/* Punch In / Out */}
                  <button
                    onClick={handleAttendanceAction}
                    disabled={attendanceSubmitting || myAttendanceLoading}
                    className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold rounded-xl transition-all border ${
                      hasCheckedIn
                        ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100 active:scale-95"
                        : "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 active:scale-95"
                    } ${(attendanceSubmitting || myAttendanceLoading) ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {hasCheckedIn ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      )}
                    </svg>
                    {attendanceSubmitting
                      ? hasCheckedIn
                        ? "Punching Out..."
                        : "Punching In..."
                      : hasCheckedIn
                      ? "Punch Out"
                      : "Punch In"}
                  </button>
                  {attendanceActionError && (
                    <p className="text-xs text-red-600 px-1">
                      {attendanceActionError}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            BOTTOM SECTION — unchanged
        ════════════════════════════════════════════ */}

        {/* Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4 mt-5">
          {/* Today's Attendance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">
                {isEmployee ? "Previous Attendance Details" : "Today's Attendance"}
              </h2>
            </div>
            {attendanceLoading ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                Loading attendance...
              </div>
            ) : isEmployee ? (
              previousAttendance.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  No previous attendance details available.
                </div>
              ) : (
                <ul className="space-y-3">
                  {previousAttendance.map((record) => (
                    <li
                      key={record.id}
                      className="rounded-xl border border-gray-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {record.date}
                        </p>
                        <span className="text-xs text-gray-400">
                          {record.workingHours}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        In: {record.inTime} • Out: {record.outTime}
                      </p>
                    </li>
                  ))}
                </ul>
              )
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
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta.badgeClass}`}>
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
                      <li key={employee.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                          {employee.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-800">{employee.name}</p>
                          <p className="text-xs text-gray-500">Anniversary date: {employee.date}</p>
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
                      <li key={employee.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-semibold text-pink-700">
                          {employee.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-800">{employee.name}</p>
                          <p className="text-xs text-gray-500">Birthday: {employee.date}</p>
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
