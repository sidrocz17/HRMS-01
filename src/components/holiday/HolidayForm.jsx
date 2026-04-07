// src/components/holiday/HolidayForm.jsx
// ─────────────────────────────────────────────
//  Reusable Add / Edit modal for holidays.
//  - Auto-fills calendarYear from selected date
//  - Validates required fields + duplicate dates
//  - Consistent styling with Department/Designation modals
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import { HOLIDAY_TYPE_OPTIONS } from "../../api/holidayApi";

const EMPTY_FORM = {
  holidayName:  "",
  holidayDate:  "",
  holidayType:  "",
  calendarYear: "",
};

export default function HolidayForm({
  mode = "add",
  initial = null,
  isDuplicateDate,
  submitting = false,
  apiError = "",
  onSubmit,
  onClose,
}) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const isEdit = mode === "edit";

  // ── Pre-fill in edit mode ─────────────────────
  useEffect(() => {
    if (isEdit && initial) {
      setForm({
        holidayName:  initial.holidayName,
        holidayDate:  initial.holidayDate,
        holidayType:  String(initial.holidayType),
        calendarYear: String(initial.calendarYear),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isEdit, initial]);

  // ── Field change — auto-derive year from date ─
  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };

    if (field === "holidayDate" && value) {
      updated.calendarYear = String(new Date(value).getFullYear());
    }

    setForm(updated);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ── Validation ────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!form.holidayName.trim())
      newErrors.holidayName = "Holiday name is required.";

    if (!form.holidayDate)
      newErrors.holidayDate = "Holiday date is required.";
    else if (isDuplicateDate(form.holidayDate, isEdit ? initial?.id : null))
      newErrors.holidayDate = "A holiday on this date already exists.";

    if (!form.holidayType)
      newErrors.holidayType = "Holiday type is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────
  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      holidayName:  form.holidayName.trim(),
      holidayDate:  form.holidayDate,
      holidayType:  Number(form.holidayType),
      calendarYear: Number(form.calendarYear),
    });
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  // ── Shared input class helper ─────────────────
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
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? "Edit Holiday" : "Add Holiday"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? "Update holiday details" : "Fill in the details to add a new holiday"}
            </p>
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

          {/* Holiday Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Holiday Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Diwali"
              value={form.holidayName}
              onChange={(e) => handleChange("holidayName", e.target.value)}
              disabled={submitting}
              className={inputCls("holidayName")}
            />
            <ErrMsg field="holidayName" />
          </div>

          {/* Holiday Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Holiday Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.holidayDate}
              onChange={(e) => handleChange("holidayDate", e.target.value)}
              disabled={submitting}
              className={inputCls("holidayDate")}
            />
            <ErrMsg field="holidayDate" />
          </div>

          {/* Holiday Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Holiday Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.holidayType}
              onChange={(e) => handleChange("holidayType", e.target.value)}
              disabled={submitting}
              className={inputCls("holidayType")}
            >
              <option value="">Select holiday type...</option>
              {HOLIDAY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ErrMsg field="holidayType" />
          </div>

          {/* Calendar Year — auto-filled, read-only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Calendar Year
              <span className="ml-1.5 text-xs font-normal text-gray-400">(auto-filled from date)</span>
            </label>
            <input
              type="text"
              value={form.calendarYear || "—"}
              readOnly
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
            />
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
              isEdit ? "Save Changes" : "Add Holiday"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
