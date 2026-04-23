import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeeSummary, getLeaveSummary } from "../api/dashboardApi";
import { getAttendance, punchIn, punchOut } from "../api/attendanceApi";
import { getUserFromToken } from "../utils/auth";

const STATUS = {
  NOT_STARTED: "NOT_STARTED",
  WORKING: "WORKING",
  COMPLETED: "COMPLETED",
};

const pad = (value) => String(value).padStart(2, "0");

const getLocalDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

const getTodayKey = () => getLocalDateKey();

const deriveTodayState = (records = []) => {
  const todayKey = getTodayKey();

  const todayCandidates = records.filter((record) => {
    const candidateDate =
      getLocalDateKey(record.inISO) ||
      getLocalDateKey(record.outISO) ||
      record.dateISO ||
      "";

    return candidateDate === todayKey;
  });

  if (!todayCandidates.length) {
    return {
      status: STATUS.NOT_STARTED,
      hasCheckedInToday: false,
      todayRecord: null,
    };
  }

  const sortedRecords = [...todayCandidates].sort((a, b) => {
    const aTime = new Date(a.outISO || a.inISO || 0).getTime();
    const bTime = new Date(b.outISO || b.inISO || 0).getTime();
    return bTime - aTime;
  });

  const latestInRecord = sortedRecords.find((record) => record.inISO);
  const latestOutRecord = sortedRecords.find((record) => record.outISO);
  const hasCheckedInToday = todayCandidates.some(
    (record) => record.inISO || record.outISO
  );

  return {
    status:
      latestInRecord?.inISO && latestOutRecord?.outISO
        ? STATUS.COMPLETED
        : hasCheckedInToday
        ? STATUS.WORKING
        : STATUS.NOT_STARTED,
    hasCheckedInToday,
    todayRecord: hasCheckedInToday
      ? {
          inISO: latestInRecord?.inISO || latestOutRecord?.inISO || null,
          outISO: latestOutRecord?.outISO || null,
          inTime: latestInRecord?.inTime || latestOutRecord?.inTime || "—",
          outTime: latestOutRecord?.outTime || "—",
        }
      : null,
  };
};

export default function DashboardCards() {
  const navigate = useNavigate();
  const [employeeSummary, setEmployeeSummary] = useState(null);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(STATUS.NOT_STARTED);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const { role } = getUserFromToken();

  const loadTodayAttendance = async () => {
    try {
      const records = await getAttendance();
      const nextRecords = Array.isArray(records) ? records : [];
      const {
        status: derivedStatus,
        hasCheckedInToday: derivedHasCheckedInToday,
        todayRecord,
      } = deriveTodayState(nextRecords);

      setAttendanceStatus(derivedStatus);
      setHasCheckedInToday(derivedHasCheckedInToday);
      setTodayAttendance(todayRecord);
    } catch (error) {
      console.error("❌ Failed to load dashboard quick-action attendance:", error);
      setAttendanceStatus(STATUS.NOT_STARTED);
      setHasCheckedInToday(false);
      setTodayAttendance(null);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getEmployeeSummary()
      .then((data) => {
        if (!isMounted) return;
        setEmployeeSummary(data || null);
      })
      .catch((error) => {
        console.error("❌ Failed to load dashboard employee summary:", error);
        if (isMounted) setEmployeeSummary(null);
      });

    getLeaveSummary()
      .then((data) => {
        if (!isMounted) return;
        setLeaveSummary(data || null);
      })
      .catch((error) => {
        console.error("❌ Failed to load dashboard leave summary:", error);
        if (isMounted) setLeaveSummary(null);
      });

    loadTodayAttendance().catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const employeeCardSubtext = (() => {
    const inactiveEmployees = employeeSummary?.inactiveEmployees ?? 0;
    const todayOnboardings = employeeSummary?.todayOnboardings ?? 0;

    if (todayOnboardings > 0) {
      return `${inactiveEmployees} inactive, ${todayOnboardings} onboarded today`;
    }

    return `${inactiveEmployees} inactive employees`;
  })();

  const canPunchIn = !hasCheckedInToday;
  const canPunchOut = hasCheckedInToday;

  const handleAttendanceAction = async () => {
    if (attendanceSubmitting) return;

    setAttendanceSubmitting(true);
    setAttendanceError("");

    try {
      if (canPunchOut) {
        await punchOut();
      } else {
        await punchIn();
      }

      await loadTodayAttendance();
      window.location.reload();
    } catch (error) {
      console.error("❌ Dashboard quick-action attendance failed:", error);
      setAttendanceError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          `Failed to ${canPunchOut ? "punch out" : "punch in"}. Please try again.`
      );
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const cards = [
    {
      label: "Employees",
      value: employeeSummary?.totalEmployees ?? 0,
      bg: "bg-[#f5a623]",
      textColor: "text-[#7a4f00]",
      valueColor: "text-[#3d2700]",
      icon: (
        <svg className="w-12 h-12 opacity-80" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ),
      trend: `${employeeSummary?.activeEmployees ?? 0} active`,
      sub: employeeCardSubtext,
    },
    {
      label: "Leaves",
      value: leaveSummary?.totalRequests ?? 0,
      bg: "bg-[#1a2240]",
      textColor: "text-blue-300",
      valueColor: "text-white",
      icon: (
        <svg className="w-12 h-12 opacity-80" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      ),
      trend: `${leaveSummary?.approvedRequests ?? 0} approved`,
      sub: `${leaveSummary?.pendingRequests ?? 0} pending requests`,
    },
    {
      label: "Quick Actions",
      kind: "quick-actions",
      bg: "bg-[#2d7d3a]",
      textColor: "text-green-100",
      valueColor: "text-white",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {cards.map((card) => (
        card.kind === "quick-actions" ? (
          <div
            key={card.label}
            className={`${card.bg} rounded-2xl shadow-lg overflow-hidden`}
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-5xl font-bold text-white leading-none">
                  3
                </span>
                <span className="text-base font-semibold text-green-100 mt-1">
                  Quick Actions
                </span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    Ready
                  </span>
                  <span className="text-xs text-green-100 opacity-80 truncate">
                    Punch in, punch out, apply leave
                  </span>
                </div>
              </div>
              <div className="text-white/80">
                <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            <div className="w-full bg-black/10 px-4 py-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleAttendanceAction}
                  disabled={attendanceSubmitting || attendanceLoading}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/12 px-2 py-2 text-white hover:bg-white/18 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {canPunchOut ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l-4 4m0 0l4 4m-4-4h14" />
                    )}
                  </svg>
                  <span className="text-[11px] font-semibold text-center leading-tight">
                    {attendanceSubmitting
                      ? canPunchOut
                        ? "Out..."
                        : "In..."
                      : canPunchOut
                      ? "Punch Out"
                      : "Punch In"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/attendance")}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/12 px-2 py-2 text-white hover:bg-white/18 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M4 11h16M6 21h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[11px] font-semibold text-center leading-tight">
                    Attendance
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/leave-management?tab=my-leaves")}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#f5a623] px-2 py-2 text-[#3d2700] hover:brightness-95 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[11px] font-semibold text-center leading-tight">
                    Apply Leave
                  </span>
                </button>
              </div>

              <div className="mt-2 min-h-4">
                {attendanceError ? (
                  <p className="text-[11px] text-red-100">{attendanceError}</p>
                ) : (
                  <p className="text-[11px] text-green-100/80">
                    {attendanceLoading
                      ? "Checking status..."
                      : attendanceStatus === STATUS.COMPLETED || canPunchOut
                      ? `Checked in at ${todayAttendance?.inTime || "—"}`
                      : "Actions ready"}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            key={card.label}
            className={`${card.bg} rounded-2xl shadow-lg overflow-hidden cursor-pointer group hover:scale-[1.02] hover:shadow-xl transition-all duration-200`}
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className={`text-5xl font-bold ${card.valueColor} leading-none`}>
                  {card.value}
                </span>
                <span className={`text-base font-semibold ${card.textColor} mt-1`}>
                  {card.label}
                </span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white"
                  >
                    {card.trend}
                  </span>
                  <span className={`text-xs ${card.textColor} opacity-80`}>{card.sub}</span>
                </div>
              </div>

              <div className={`${card.valueColor} opacity-70 group-hover:opacity-90 group-hover:scale-110 transition-all duration-200`}>
                {card.icon}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (card.label === "Leaves") {
                  navigate(
                    role === "hr"
                      ? "/leave-management?tab=team-leaves"
                      : "/leave-management?tab=my-leaves"
                  );
                  return;
                }

                if (card.label === "Employees") {
                  navigate("/employee-management");
                }
              }}
              className="w-full bg-black/10 px-6 py-2.5 flex items-center justify-between"
            >
              <span className={`text-xs font-medium ${card.textColor} opacity-80`}>View Details</span>
              <svg className={`w-4 h-4 ${card.textColor} opacity-80`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )
      ))}
    </div>
  );
}
