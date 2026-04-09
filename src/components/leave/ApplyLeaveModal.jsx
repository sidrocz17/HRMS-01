// src/components/leave/ApplyLeaveModal.jsx
// ─────────────────────────────────────────────
//  Apply Leave Form Modal
//  Features: Date picker, Type of Day (Full/Half), Half Selection toggle
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";

const EMPTY_FORM = {
  leave_type: "",
  from_date: "",
  to_date: "",
  days: 0,
  type_of_day: "full", // "full" or "half"
  half_selection: "first", // "first" or "second"
  reason: "",
};

export default function ApplyLeaveModal({
  onSubmit,
  onClose,
  leaveTypes = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // ── Calculate days ────────────────────────────
  useEffect(() => {
    if (form.from_date && form.to_date) {
      const from = new Date(form.from_date);
      const to = new Date(form.to_date);
      const diffTime = Math.abs(to - from);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      let finalDays = diffDays;
      if (form.type_of_day === "half") {
        finalDays = 0.5;
      }

      setForm((prev) => ({ ...prev, days: finalDays }));
    }
  }, [form.from_date, form.to_date, form.type_of_day]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.leave_type.trim()) newErrors.leave_type = "Leave type is required.";
    if (!form.from_date) newErrors.from_date = "Start date is required.";
    if (!form.to_date) newErrors.to_date = "End date is required.";
    if (form.from_date && form.to_date && new Date(form.from_date) > new Date(form.to_date)) {
      newErrors.to_date = "End date must be after start date.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      leave_type: form.leave_type,
      from_date: form.from_date,
      to_date: form.to_date,
      days: form.days,
      type_of_day: form.type_of_day,
      half_selection: form.type_of_day === "half" ? form.half_selection : null,
      reason: form.reason,
    });
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const inputClass = (field) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed
    ${errors[field]
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-base font-bold text-gray-900">Apply Leave</h2>
            <p className="text-xs text-gray-400 mt-0.5">Submit a new leave request</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.leave_type}
              onChange={(e) => handleChange("leave_type", e.target.value)}
              className={inputClass("leave_type")}
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.leave_type && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.leave_type}
              </p>
            )}
          </div>

          {/* Leave Duration Header */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Duration</p>
          </div>

          {/* Dates: From & To */}
          <div className="grid grid-cols-2 gap-3">
            {/* From Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.from_date}
                onChange={(e) => handleChange("from_date", e.target.value)}
                className={inputClass("from_date")}
              />
              {errors.from_date && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.from_date}
                </p>
              )}
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.to_date}
                onChange={(e) => handleChange("to_date", e.target.value)}
                className={inputClass("to_date")}
              />
              {errors.to_date && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.to_date}
                </p>
              )}
            </div>
          </div>

          {/* No. of Days (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              No. of Days
            </label>
            <input
              type="text"
              value={form.days}
              disabled
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-semibold cursor-not-allowed"
            />
          </div>

          {/* Type of Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              Type of Day <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type_of_day"
                  value="full"
                  checked={form.type_of_day === "full"}
                  onChange={(e) => handleChange("type_of_day", e.target.value)}
                  className="w-4 h-4 text-[#1a2240] border-gray-300 focus:ring-2 focus:ring-[#1a2240]"
                />
                <span className="text-sm text-gray-700">Full Day</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type_of_day"
                  value="half"
                  checked={form.type_of_day === "half"}
                  onChange={(e) => handleChange("type_of_day", e.target.value)}
                  className="w-4 h-4 text-[#1a2240] border-gray-300 focus:ring-2 focus:ring-[#1a2240]"
                />
                <span className="text-sm text-gray-700">Half Day</span>
              </label>
            </div>
          </div>

          {/* Half Selection (only if Half Day selected) */}
          {form.type_of_day === "half" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2.5">
                Half Selection <span className="text-red-500">*</span>
              </label>
              <div className="inline-flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => handleChange("half_selection", "first")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    form.half_selection === "first"
                      ? "bg-[#5b4ce8] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  First Half
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("half_selection", "second")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    form.half_selection === "second"
                      ? "bg-[#5b4ce8] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Second Half
                </button>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Enter reason for leave..."
              value={form.reason}
              onChange={(e) => handleChange("reason", e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none
                focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all
                resize-none placeholder:text-gray-300"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#1a2240] hover:bg-[#243055] active:scale-95 rounded-xl transition-all shadow-sm"
          >
            Submit
          </button>
        </div>

      </div>
    </div>
  );
}
