// src/components/employeetype/EmployeeTypeForm.jsx

import { useState, useEffect } from "react";

const EMPTY_FORM = {
  type_name: "",
  is_active: true,
};

export default function EmployeeTypeForm({
  mode = "add",
  initial = null,
  existingNames = [],
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
        type_name: initial.type_name,
        is_active: initial.is_active,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isEdit, initial]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.type_name.trim()) {
      newErrors.type_name = "Employee type name is required.";
    } else {
      const duplicate = existingNames
        .filter((n) => isEdit ? n !== initial?.type_name : true)
        .some((n) => n.toLowerCase() === form.type_name.trim().toLowerCase());
      if (duplicate) newErrors.type_name = "This employee type already exists.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...form, type_name: form.type_name.trim() });
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
              {isEdit ? "Edit Employee Type" : "Add Employee Type"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit
                ? "Update employee type details"
                : "Fill in the details to create a new employee type"}
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

          {/* Type Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Employee Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Full Time"
              value={form.type_name}
              onChange={(e) => handleChange("type_name", e.target.value)}
              disabled={submitting}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
                placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed
                ${errors.type_name
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
                }`}
            />
            {errors.type_name && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.type_name}
              </p>
            )}
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              <p className="text-xs text-gray-400">
                {form.is_active
                  ? "Employee type is currently active"
                  : "Employee type is currently inactive"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange("is_active", !form.is_active)}
              disabled={submitting}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                form.is_active ? "bg-emerald-500" : "bg-gray-200"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                form.is_active ? "translate-x-6" : "translate-x-1"
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
              isEdit ? "Save Changes" : "Add Employee Type"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
