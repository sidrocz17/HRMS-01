// src/components/profile/PersonalInfo.jsx
// ─────────────────────────────────────────────
//  Personal Information card with inline edit support
//  Editable fields: phone, address
//  Read-only: name, email (managed by system)
// ─────────────────────────────────────────────

import { useState } from "react";

const getDateOfBirth = (data) =>
  data?.dateOfBirth || data?.date_of_birth || data?.dob || "";

const formatDisplayDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PersonalInfo({ data, onSave, saving = false }) {
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({});
  const [errors, setErrors]     = useState({});

  const fullName = [data?.firstName, data?.lastName].filter(Boolean).join(" ") || "—";
  const dateOfBirth = formatDisplayDate(getDateOfBirth(data));

  const handleEdit = () => {
    setForm({
      phone:   data?.phone   || "",
      address: data?.address || "",
    });
    setErrors({});
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.phone?.trim()) {
      errs.phone = "Phone is required.";
    } else if (!/^\d{10}$/.test(form.phone.trim().replace(/\s/g, ""))) {
      errs.phone = "Enter a valid 10-digit phone number.";
    }
    if (!form.address?.trim()) errs.address = "Address is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await onSave?.({ phone: form.phone.trim(), address: form.address.trim() });
    setEditing(false);
  };

  const inputCls = (field) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-300 disabled:opacity-60
    ${errors[field]
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
    }`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1a2240]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#1a2240]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-gray-900">Personal Information</h2>
        </div>

        {!editing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1a2240] hover:text-[#243055] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="px-6 py-5">
        {editing ? (
          /* ── Edit mode ── */
          <div className="space-y-4">
            {/* Read-only fields shown as static */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadField label="Full Name" value={fullName} />
              <ReadField label="Email"     value={data?.email} />
              <ReadField label="Date of Birth" value={dateOfBirth} />
            </div>

            {/* Editable: Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="10-digit phone number"
                value={form.phone}
                onChange={(e) => {
                  setForm((p) => ({ ...p, phone: e.target.value }));
                  if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
                }}
                disabled={saving}
                className={inputCls("phone")}
              />
              {errors.phone && <ErrMsg msg={errors.phone} />}
            </div>

            {/* Editable: Address */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter your address..."
                value={form.address}
                onChange={(e) => {
                  setForm((p) => ({ ...p, address: e.target.value }));
                  if (errors.address) setErrors((p) => ({ ...p, address: "" }));
                }}
                disabled={saving}
                className={`${inputCls("address")} resize-none`}
              />
              {errors.address && <ErrMsg msg={errors.address} />}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm ${
                  saving
                    ? "bg-[#1a2240]/60 cursor-not-allowed"
                    : "bg-[#1a2240] hover:bg-[#243055] active:scale-95"
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <ReadField label="Full Name" value={fullName}      />
            <ReadField label="Email"     value={data?.email}   />
            <ReadField label="Date of Birth" value={dateOfBirth} />
            <ReadField label="Phone"     value={data?.phone}   />
            <ReadField label="Address"   value={data?.address} fullWidth />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────
function ReadField({ label, value, fullWidth }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">{value || "—"}</p>
    </div>
  );
}

function ErrMsg({ msg }) {
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  );
}
