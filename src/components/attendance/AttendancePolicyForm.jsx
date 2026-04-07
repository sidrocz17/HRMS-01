// src/components/attendance/AttendancePolicyForm.jsx
// ─────────────────────────────────────────────
//  Modal form for editing the Attendance Policy.
//  Follows the same pattern as DepartmentForm.jsx
//  Props:
//    initial     → current policy object (pre-fills form)
//    submitting  → loading state from parent
//    apiError    → error message from API
//    onSubmit    → (formData) => void
//    onClose     → () => void
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";

const EMPTY_FORM = {
  min_in_time:      "",
  min_out_time:     "",
  min_working_hour: "",
  half_day_hour:    "",
};

export default function AttendancePolicyForm({
  initial = null,
  submitting = false,
  apiError = "",
  onSubmit,
  onClose,
}) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // ── Pre-fill form with current policy ────────
  useEffect(() => {
    if (initial) {
      setForm({
        min_in_time:      initial.minInTime      || "",
        min_out_time:     initial.minOutTime     || "",
        min_working_hour: String(initial.minWorkingHour ?? ""),
        half_day_hour:    String(initial.halfDayHour    ?? ""),
      });
    }
  }, [initial]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ── Validation ────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!form.min_in_time)
      newErrors.min_in_time = "Minimum In Time is required.";

    if (!form.min_out_time)
      newErrors.min_out_time = "Minimum Out Time is required.";
    else if (form.min_in_time && form.min_out_time <= form.min_in_time)
      newErrors.min_out_time = "Out Time must be later than In Time.";

    if (!form.min_working_hour)
      newErrors.min_working_hour = "Minimum Working Hours is required.";
    else if (Number(form.min_working_hour) <= 0)
      newErrors.min_working_hour = "Must be a positive number.";

    if (!form.half_day_hour)
      newErrors.half_day_hour = "Half Day Hours is required.";
    else if (Number(form.half_day_hour) <= 0)
      newErrors.half_day_hour = "Must be a positive number.";
    else if (
      form.min_working_hour &&
      Number(form.half_day_hour) >= Number(form.min_working_hour)
    )
      newErrors.half_day_hour = "Half Day Hours must be less than Working Hours.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      min_in_time:      form.min_in_time,
      min_out_time:     form.min_out_time,
      min_working_hour: Number(form.min_working_hour),
      half_day_hour:    Number(form.half_day_hour),
    });
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  // ── Shared input class ────────────────────────
  const inputCls = (field) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed
    ${errors[field]
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
    }`;

  const ErrMsg = ({ field }) =>
    errors[field] ? (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    ) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Edit Attendance Policy</h2>
            <p className="text-xs text-gray-400 mt-0.5">Update working hours and time rules</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-4">

          {/* Min In Time + Min Out Time — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Min In Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.min_in_time}
                onChange={(e) => handleChange("min_in_time", e.target.value)}
                disabled={submitting}
                className={inputCls("min_in_time")}
              />
              <ErrMsg field="min_in_time" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Min Out Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.min_out_time}
                onChange={(e) => handleChange("min_out_time", e.target.value)}
                disabled={submitting}
                className={inputCls("min_out_time")}
              />
              <ErrMsg field="min_out_time" />
            </div>
          </div>

          {/* Min Working Hours + Half Day Hours — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Min Working Hours <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  placeholder="e.g. 8"
                  value={form.min_working_hour}
                  onChange={(e) => handleChange("min_working_hour", e.target.value)}
                  disabled={submitting}
                  className={inputCls("min_working_hour")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  hrs
                </span>
              </div>
              <ErrMsg field="min_working_hour" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Half Day Hours <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  placeholder="e.g. 4"
                  value={form.half_day_hour}
                  onChange={(e) => handleChange("half_day_hour", e.target.value)}
                  disabled={submitting}
                  className={inputCls("half_day_hour")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  hrs
                </span>
              </div>
              <ErrMsg field="half_day_hour" />
            </div>
          </div>

          {/* Validation hint */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700">
              Out Time must be later than In Time. Half Day Hours must be less than Working Hours.
            </p>
          </div>

        </div>

        {/* ── API Error ── */}
        {apiError && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {apiError}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm ${
              submitting
                ? "bg-[#1a2240]/60 cursor-not-allowed"
                : "bg-[#1a2240] hover:bg-[#243055] active:scale-95"
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Policy"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
