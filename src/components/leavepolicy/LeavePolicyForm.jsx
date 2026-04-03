// src/components/leavepolicy/LeavePolicyForm.jsx

import { useState, useEffect } from "react";

// ── Financial year options ────────────────────
const FINANCIAL_YEARS = [
  "2022-23",
  "2023-24",
  "2024-25",
  "2025-26",
  "2026-27",
];

// ── Derive start/end dates from financial year ─
export const deriveYearDates = (fy) => {
  if (!fy) return { start_date: "", end_date: "" };
  const [startYear, endSuffix = ""] = fy.split("-");
  const endYear =
    endSuffix.length === 2 ? `${startYear.slice(0, 2)}${endSuffix}` : endSuffix;

  return {
    start_date: `${startYear}-04-01`,
    end_date:   `${endYear || Number(startYear) + 1}-03-31`,
  };
};

const EMPTY_FORM = {
  type_id:          "",
  employee_type_id: "",
  financial_year:   "",
  no_of_days:       "",
};

export default function LeavePolicyForm({
  mode = "add",
  initial = null,
  leaveTypes = [],
  employeeTypes = [],
  existingKeys = [],   // ["typeId_empTypeId_FY"] for duplicate check
  submitting = false,
  apiError = "",
  onSubmit,
  onClose,
}) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const isEdit = mode === "edit";

  useEffect(() => {
    if (isEdit && initial) {
      setForm({
        type_id:          initial.type_id,
        employee_type_id: initial.employee_type_id,
        financial_year:   initial.financial_year,
        no_of_days:       initial.no_of_days,
      });
    }
  }, [isEdit, initial]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.type_id)          newErrors.type_id          = "Leave type is required.";
    if (!form.employee_type_id) newErrors.employee_type_id = "Employee type is required.";
    if (!form.financial_year)   newErrors.financial_year   = "Financial year is required.";

    if (!form.no_of_days) {
      newErrors.no_of_days = "Number of days is required.";
    } else if (Number(form.no_of_days) <= 0) {
      newErrors.no_of_days = "Must be a positive number.";
    }

    // Duplicate check
    const key = `${form.type_id}_${form.employee_type_id}_${form.financial_year}`;
    const isDuplicate = existingKeys
      .filter((k) => isEdit
        ? k !== `${initial?.type_id}_${initial?.employee_type_id}_${initial?.financial_year}`
        : true
      )
      .includes(key);

    if (isDuplicate) {
      newErrors.financial_year = "A policy for this Leave Type + Employee Type + Financial Year already exists.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const { start_date, end_date } = deriveYearDates(form.financial_year);
    onSubmit({
      type_id:          form.type_id,
      employee_type_id: form.employee_type_id,
      financial_year:   form.financial_year,
      no_of_days:       Number(form.no_of_days),
      start_date,
      end_date,
    });
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  // ── Error helper ──────────────────────────────
  const ErrMsg = ({ field }) => errors[field] ? (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {errors[field]}
    </p>
  ) : null;

  // ── Shared input classes ──────────────────────
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? "Edit Leave Policy" : "Add Leave Policy"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? "Update leave policy details" : "Configure a new leave policy"}
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

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type_id}
              onChange={(e) => handleChange("type_id", e.target.value)}
              disabled={submitting}
              className={inputClass("type_id")}
            >
              <option value="">Select leave type...</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.label || lt.name || lt.title || lt.type || lt.leaveType}
                </option>
              ))}
            </select>
            <ErrMsg field="type_id" />
          </div>

          {/* Employee Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Employee Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.employee_type_id}
              onChange={(e) => handleChange("employee_type_id", e.target.value)}
              disabled={submitting}
              className={inputClass("employee_type_id")}
            >
              <option value="">Select employee type...</option>
              {employeeTypes.map((et) => (
                <option key={et.id} value={et.id}>
                  {et.label || et.name || et.title || et.type || et.employeeType}
                </option>
              ))}
            </select>
            <ErrMsg field="employee_type_id" />
          </div>

          {/* Financial Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Financial Year <span className="text-red-500">*</span>
            </label>
            <select
              value={form.financial_year}
              onChange={(e) => handleChange("financial_year", e.target.value)}
              disabled={submitting}
              className={inputClass("financial_year")}
            >
              <option value="">Select financial year...</option>
              {FINANCIAL_YEARS.map((fy) => (
                <option key={fy} value={fy}>{fy}</option>
              ))}
            </select>
            {/* Show derived dates as hint */}
            {form.financial_year && (
              <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Period: {deriveYearDates(form.financial_year).start_date} → {deriveYearDates(form.financial_year).end_date}
              </p>
            )}
            <ErrMsg field="financial_year" />
          </div>

          {/* Number of Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Number of Days <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 12"
              value={form.no_of_days}
              onChange={(e) => handleChange("no_of_days", e.target.value)}
              disabled={submitting}
              className={inputClass("no_of_days")}
            />
            <ErrMsg field="no_of_days" />
          </div>

        </div>

        {/* API Error */}
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

        {/* Footer */}
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
              isEdit ? "Save Changes" : "Add Policy"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
