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
import { normalizeRole } from "../config/roles.jsx";
import {
  createAttendancePolicy,
  fetchAttendancePolicy,
  fetchAttendancePolicyHistory,
  updateAttendancePolicy,
} from "../api/attendancePolicyApi";

const Tooltip = ({ text, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100">
      {text}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
    </div>
  </div>
);

// ── Format 24hr time → 12hr display ──────────
const normalizeTimeValue = (timeValue) => {
  if (!timeValue) return "";
  if (typeof timeValue === "string") return timeValue;
  if (timeValue instanceof Date) return timeValue.toTimeString().slice(0, 8);
  if (typeof timeValue === "object") {
    if (typeof timeValue.toString === "function") {
      const stringValue = timeValue.toString();
      if (stringValue && stringValue !== "[object Object]") return stringValue;
    }

    const hour = timeValue.hour ?? timeValue.hours;
    const minute = timeValue.minute ?? timeValue.minutes ?? 0;
    const second = timeValue.second ?? timeValue.seconds ?? 0;

    if (hour !== undefined) {
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
    }
  }

  return String(timeValue);
};

const formatTime = (time24) => {
  const normalized = normalizeTimeValue(time24);
  if (!normalized) return "—";
  const [h, m] = normalized.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return normalized;
  const ampm  = h >= 12 ? "PM" : "AM";
  const hour  = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
};

// ── Format date string ────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const normalized = typeof dateStr === "string" && dateStr.includes("T")
    ? dateStr
    : `${dateStr}T00:00:00`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return "—";
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
  const role    = normalizeRole(localStorage.getItem("role"));
  const isAdmin = role === "admin";
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  // ── State ─────────────────────────────────────
  const [policy, setPolicy]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState("");

  const toInputTime = (timeValue) => {
    const normalized = normalizeTimeValue(timeValue);
    return normalized ? normalized.slice(0, 5) : "";
  };

  const currentUserLabel = (() => {
    const fullName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ").trim();
    return fullName || currentUser.email || localStorage.getItem("role") || "Current Admin";
  })();

  const isUuidLike = (value) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());

  const resolveUpdatedBy = (...values) => {
    const resolved = values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
    if (!resolved) return currentUserLabel;
    return isUuidLike(resolved) ? currentUserLabel : resolved;
  };

  const hasPolicyValues = (item) => {
    if (!item) return false;

    return Boolean(
      item.minInTime ||
      item.min_in_time ||
      item.minOutTime ||
      item.min_out_time ||
      item.minWorkingHour ||
      item.min_working_hour ||
      item.halfDayHour ||
      item.half_day_hour
    );
  };

  const getPolicyRecords = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.rows)) return payload.rows;
    return payload ? [payload] : [];
  };

  const getPolicyRecord = (payload) => {
    const records = getPolicyRecords(payload);
    return [...records].reverse().find(hasPolicyValues) || records[records.length - 1] || null;
  };

  const normalizePolicy = (item) => {
    if (!item) return null;

    return {
      id: item.id || item.policyId || item.attPolicyId || item.uuid || "",
      minInTime: normalizeTimeValue(item.minInTime || item.min_in_time),
      minOutTime: normalizeTimeValue(item.minOutTime || item.min_out_time),
      minWorkingHour:
        item.minWorkingHour ??
        item.min_working_hour ??
        item.workingHours ??
        "",
      halfDayHour:
        item.halfDayHour ??
        item.half_day_hour ??
        item.halfDayHours ??
        "",
      updatedBy:
        resolveUpdatedBy(
          item.updatedBy,
          item.updated_by,
          item.createdBy,
          item.created_by
        ),
      updatedOn:
        item.updatedOn ||
        item.updated_on ||
        item.createdOn ||
        item.created_on ||
        "",
    };
  };

  const toHistoryRow = (item) => {
    const normalized = normalizePolicy(item);
    if (!normalized) return null;

    return {
      id: normalized.id || `policy-${Date.now()}`,
      date: (normalized.updatedOn || new Date().toISOString()).slice(0, 10),
      updatedBy: normalized.updatedBy || "—",
      minInTime: normalized.minInTime,
      minOutTime: normalized.minOutTime,
      workingHours: normalized.minWorkingHour,
      halfDayHours: normalized.halfDayHour,
    };
  };

  const normalizeHistoryRow = (item) => {
    if (!item) return null;

    return {
      id: item.id || item.policyId || item.attPolicyId || item.uuid || `history-${Date.now()}`,
      date:
        item.date ||
        item.updatedOn ||
        item.updated_on ||
        item.createdOn ||
        item.created_on ||
        "",
      updatedBy:
        resolveUpdatedBy(
          item.updatedBy,
          item.updated_by,
          item.createdBy,
          item.created_by
        ),
      minInTime: normalizeTimeValue(item.minInTime || item.min_in_time),
      minOutTime: normalizeTimeValue(item.minOutTime || item.min_out_time),
      workingHours:
        item.workingHours ??
        item.minWorkingHour ??
        item.min_working_hour ??
        "",
      halfDayHours:
        item.halfDayHours ??
        item.halfDayHour ??
        item.half_day_hour ??
        "",
    };
  };

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
      const liveRows = getPolicyRecords(policyData)
        .filter(hasPolicyValues)
        .reverse()
        .map(normalizeHistoryRow)
        .filter(Boolean);
      const currentPolicy = normalizePolicy(getPolicyRecord(policyData));
      const normalizedHistory = (Array.isArray(historyData) ? historyData : [])
        .map(normalizeHistoryRow)
        .filter(Boolean);
      const mergedHistory = liveRows.length > 0 ? liveRows : normalizedHistory;

      console.log("✅ Policy:", policyData);
      console.log("✅ History:", historyData);
      setPolicy(currentPolicy);
      setHistory(mergedHistory);
    } catch (err) {
      console.error("❌ Failed to load attendance policy:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Add / edit submit handler ─────────────────
  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    setApiError("");
    try {
      if (editTarget) {
        await updateAttendancePolicy(formData);
      } else {
        await createAttendancePolicy(formData);
      }
      await loadAll();
      console.log(editTarget ? "✅ Policy updated" : "✅ Policy created");
      setShowForm(false);
      setEditTarget(null);
    } catch (err) {
      console.error("❌ Save error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error   ||
        "Failed to save policy. Please try again.";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRow = (rowId) => {
    setHistory((prev) => {
      const next = prev.filter((row) => row.id !== rowId);

      if (policy?.id === rowId) {
        const nextLatest = next[0] || null;
        setPolicy(
          nextLatest
            ? {
                id: nextLatest.id,
                minInTime: nextLatest.minInTime,
                minOutTime: nextLatest.minOutTime,
                minWorkingHour: nextLatest.workingHours,
                halfDayHour: nextLatest.halfDayHours,
                updatedBy: nextLatest.updatedBy,
                updatedOn: nextLatest.date,
              }
            : null
        );
      }

      return next;
    });
  };

  const handleEditRow = (row) => {
    setApiError("");
    setEditTarget({
      id: row.id,
      minInTime: row.minInTime,
      minOutTime: row.minOutTime,
      minWorkingHour: row.workingHours,
      halfDayHour: row.halfDayHours,
      updatedBy: row.updatedBy,
      updatedOn: row.date,
    });
    setShowForm(true);
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

          {/* Add/Edit Policy button — admin only */}
          {isAdmin && (
            <button
              onClick={() => { setApiError(""); setShowForm(true); }}
              className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
            >
              {policy ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              {policy ? "Edit Policy" : "Add Policy"}
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
                    onClick={() => { setApiError(""); setShowForm(true); }}
                    className="mt-2 text-xs font-semibold text-[#1a2240] hover:underline"
                  >
                    + Add policy
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
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Policy Records</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Showing all attendance policy entries returned by the API
                </p>
              </div>
              {history.length > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  {history.length} records
                </div>
              )}
            </div>
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
                    {isAdmin && <TH icon={<UserIcon />} label="Actions" />}
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y divide-gray-50">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="px-6 py-16 text-center">
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

                          {isAdmin && (
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                <Tooltip text="Edit">
                                  <button
                                    onClick={() => handleEditRow(row)}
                                    className="rounded-lg p-1.5 text-gray-400 transition-all duration-150 hover:bg-amber-50 hover:text-amber-600"
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </Tooltip>

                                <Tooltip text="Delete">
                                  <button
                                    onClick={() => handleDeleteRow(row.id)}
                                    className="rounded-lg p-1.5 text-gray-400 transition-all duration-150 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          )}

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
          initial={(editTarget || policy) ? {
            ...(editTarget || policy),
            minInTime: toInputTime((editTarget || policy).minInTime),
            minOutTime: toInputTime((editTarget || policy).minOutTime),
          } : null}
          submitting={submitting}
          apiError={apiError}
          onSubmit={handleFormSubmit}
          onClose={() => {
            if (!submitting) {
              setShowForm(false);
              setEditTarget(null);
              setApiError("");
            }
          }}
        />
      )}

    </div>
  );
}
