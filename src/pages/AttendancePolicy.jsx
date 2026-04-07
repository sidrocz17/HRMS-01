// src/pages/AttendancePolicy.jsx
// ─────────────────────────────────────────────
//  Attendance Policy Page
//  - View current policy (all roles)
//  - Edit policy (admin only)
//  - Policy change history table
//  Follows same patterns as Departments.jsx
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import AttendancePolicyForm from "../components/attendance/AttendancePolicyForm";
import {
  fetchAttendancePolicy,
  fetchAttendancePolicyHistory,
  updateAttendancePolicy,
} from "../api/attendancePolicyApi";

// ── Format 24hr time → 12hr display ──────────
const formatTime = (time24) => {
  if (!time24) return "—";
  const [h, m] = time24.split(":").map(Number);
  const ampm  = h >= 12 ? "PM" : "AM";
  const hour  = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
};

// ── Format date string ────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// ── Policy field card ─────────────────────────
const PolicyField = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-gray-400">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
  </div>
);

// ── SVG Icons ─────────────────────────────────
const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// ── Table header cell ─────────────────────────
const TH = ({ icon, label }) => (
  <th className="px-4 py-3 text-left">
    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {icon}
      {label}
    </div>
  </th>
);

export default function AttendancePolicy() {
  // ── RBAC ──────────────────────────────────────
  const role    = localStorage.getItem("role") || "";
  const isAdmin = role === "admin";

  // ── State ─────────────────────────────────────
  const [policy, setPolicy]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState("");

  // ── Load data on mount ────────────────────────
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [policyData, historyData] = await Promise.all([
        fetchAttendancePolicy(),
        fetchAttendancePolicyHistory(),
      ]);
      console.log("✅ Policy:", policyData);
      console.log("✅ History:", historyData);
      setPolicy(policyData);
      setHistory(historyData);
    } catch (err) {
      console.error("❌ Failed to load attendance policy:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Edit submit handler ───────────────────────
  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    setApiError("");
    try {
      await updateAttendancePolicy(formData);
      console.log("✅ Policy updated");
      await loadAll();   // refresh both policy + history
      setShowForm(false);
    } catch (err) {
      console.error("❌ Update error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error   ||
        "Failed to update policy. Please try again.";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading skeleton ──────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-7 bg-gray-200 rounded-lg w-48" />
                <div className="h-4 bg-gray-100 rounded w-72" />
              </div>
              <div className="h-10 bg-gray-200 rounded-xl w-32" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="grid grid-cols-2 gap-8">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-32" />
                    <div className="h-8 bg-gray-200 rounded w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Attendance Policy
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage company attendance rules and working hours
            </p>
          </div>

          {/* Edit Policy button — admin only */}
          {isAdmin && (
            <button
              onClick={() => { setApiError(""); setShowForm(true); }}
              className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Policy
            </button>
          )}
        </div>

        {/* ── Current Policy section ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
            Current Policy
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {policy ? (
              <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                <PolicyField
                  icon={<ClockIcon />}
                  label="Minimum In Time"
                  value={formatTime(policy.minInTime)}
                />
                <PolicyField
                  icon={<ClockIcon />}
                  label="Minimum Out Time"
                  value={formatTime(policy.minOutTime)}
                />
                <PolicyField
                  icon={<CalIcon />}
                  label="Minimum Working Hours"
                  value={`${policy.minWorkingHour} hrs`}
                />
                <PolicyField
                  icon={<CalIcon />}
                  label="Half Day Hours"
                  value={`${policy.halfDayHour} hrs`}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No policy configured yet.</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-2 text-xs font-semibold text-[#1a2240] hover:underline"
                  >
                    + Set up policy
                  </button>
                )}
              </div>
            )}

            {/* Last updated info */}
            {policy?.updatedBy && (
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                <UserIcon />
                <span>
                  Last updated by <span className="font-medium text-gray-600">{policy.updatedBy}</span>
                  {policy.updatedOn && (
                    <> · {new Date(policy.updatedOn).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric"
                    })}</>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Policy History section ── */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Policy Change History</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Track updates made to attendance rules over time
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">

                {/* Head */}
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <TH icon={<CalIcon />}  label="Date" />
                    <TH icon={<UserIcon />} label="Updated By" />
                    <TH icon={<ClockIcon />} label="Min In Time" />
                    <TH icon={<ClockIcon />} label="Min Out Time" />
                    <TH icon={<CalIcon />}  label="Working Hours" />
                    <TH icon={<CalIcon />}  label="Half Day Hours" />
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y divide-gray-50">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-medium">No policy changes yet</p>
                          <p className="text-xs">Policy updates will appear here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    history.map((row, idx) => {
                      const isLatest = idx === 0;
                      return (
                        <tr
                          key={row.id}
                          className={`transition-colors duration-100 ${
                            isLatest
                              ? "bg-[#1a2240]/3 hover:bg-[#1a2240]/5"
                              : "hover:bg-gray-50/80"
                          }`}
                        >
                          {/* Date — bold for latest */}
                          <td className="px-4 py-4">
                            <span className={`text-sm ${isLatest ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                              {formatDate(row.date)}
                            </span>
                            {isLatest && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                Latest
                              </span>
                            )}
                          </td>

                          {/* Updated By */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#1a2240]/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-[#1a2240]">
                                  {row.updatedBy?.charAt(0) || "?"}
                                </span>
                              </div>
                              <span className="text-sm text-gray-700">{row.updatedBy || "—"}</span>
                            </div>
                          </td>

                          {/* Min In Time */}
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-700 font-medium">
                              {formatTime(row.minInTime)}
                            </span>
                          </td>

                          {/* Min Out Time */}
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-700 font-medium">
                              {formatTime(row.minOutTime)}
                            </span>
                          </td>

                          {/* Working Hours */}
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                              {row.workingHours} hrs
                            </span>
                          </td>

                          {/* Half Day Hours */}
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                              {row.halfDayHours} hrs
                            </span>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>{/* end max-w container */}

      {/* ── Edit Modal ── */}
      {showForm && (
        <AttendancePolicyForm
          initial={policy}
          submitting={submitting}
          apiError={apiError}
          onSubmit={handleFormSubmit}
          onClose={() => {
            if (!submitting) {
              setShowForm(false);
              setApiError("");
            }
          }}
        />
      )}

    </div>
  );
}
