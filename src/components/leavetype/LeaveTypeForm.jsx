// src/components/leavetype/LeaveTypeForm.jsx

import { useState, useEffect } from "react";

const EMPTY_FORM = {
  type:                    "",
  max_consecutive_days:    "",
  carry_forward_allowed:   false,
  post_application_allowed: false,
};

export default function LeaveTypeForm({
  mode = "add",
  initial = null,
  existingTypes = [],
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
        type:                    initial.type,
        max_consecutive_days:    initial.max_consecutive_days,
        carry_forward_allowed:   initial.carry_forward_allowed,
        post_application_allowed: initial.post_application_allowed,
      });
    }
  }, [isEdit, initial]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.type.trim()) {
      newErrors.type = "Leave type name is required.";
    } else {
      const duplicate = existingTypes
        .filter((t) => isEdit ? t !== initial?.type : true)
        .some((t) => t.toLowerCase() === form.type.trim().toLowerCase());
      if (duplicate) newErrors.type = "This leave type already exists.";
    }

    if (!form.max_consecutive_days) {
      newErrors.max_consecutive_days = "Max consecutive days is required.";
    } else if (Number(form.max_consecutive_days) <= 0) {
      newErrors.max_consecutive_days = "Must be a positive number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...form, type: form.type.trim() });
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

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
              {isEdit ? "Edit Leave Type" : "Add Leave Type"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? "Update leave type details" : "Fill in the details to create a new leave type"}
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

          {/* Leave Type Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Leave Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Annual Leave"
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              disabled={submitting}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
                placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed
                ${errors.type
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
                }`}
            />
            {errors.type && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.type}
              </p>
            )}
          </div>

          {/* Max Consecutive Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Max Consecutive Days <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={form.max_consecutive_days}
              onChange={(e) => handleChange("max_consecutive_days", e.target.value)}
              disabled={submitting}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
                placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed
                ${errors.max_consecutive_days
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
                }`}
            />
            {errors.max_consecutive_days && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.max_consecutive_days}
              </p>
            )}
          </div>

          {/* Carry Forward Allowed */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-700">Carry Forward Allowed</p>
              <p className="text-xs text-gray-400">
                {form.carry_forward_allowed
                  ? "Unused leaves can be carried to next year"
                  : "Unused leaves will lapse at year end"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange("carry_forward_allowed", !form.carry_forward_allowed)}
              disabled={submitting}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                form.carry_forward_allowed ? "bg-emerald-500" : "bg-gray-200"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                form.carry_forward_allowed ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          {/* Post Application Allowed */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-700">Post Application Allowed</p>
              <p className="text-xs text-gray-400">
                {form.post_application_allowed
                  ? "Leave can be applied after the date"
                  : "Leave must be applied before the date"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange("post_application_allowed", !form.post_application_allowed)}
              disabled={submitting}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                form.post_application_allowed ? "bg-emerald-500" : "bg-gray-200"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                form.post_application_allowed ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
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
              isEdit ? "Save Changes" : "Add Leave Type"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
