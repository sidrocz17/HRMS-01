// src/pages/MyProfile.jsx
// ─────────────────────────────────────────────
//  My Profile — accessible by all roles
//  Loads employee profile from API using stored empId
//  Sub-components: ProfileHeader, PersonalInfo,
//                  JobInfo, IdentityInfo
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import ProfileHeader  from "../components/profile/ProfileHeader";
import PersonalInfo   from "../components/profile/PersonalInfo";
import JobInfo        from "../components/profile/JobInfo";
import IdentityInfo   from "../components/profile/IdentityInfo";
import { getProfile, updateProfile, getLoggedInEmpId } from "../api/profileApi";
import { applyResignation } from "../api/offboardingApi";

const EMPTY_APPLY_FORM = {
  resignationDate: "",
  proposedLastWorkingDate: "",
  reason: "",
};

export default function MyProfile() {
  // ── State ─────────────────────────────────────
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [apiError, setApiError]       = useState("");
  const [saving, setSaving]           = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState(EMPTY_APPLY_FORM);
  const [applyErrors, setApplyErrors] = useState({});
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyApiError, setApplyApiError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);

  // ── Load profile on mount ──────────────────────
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setApiError("");
    try {
      const empId = getLoggedInEmpId();
      // TODO: getProfile(empId) — uses token-derived empId
      const data = await getProfile(empId);
      setProfileData(data);
    } catch (err) {
      console.error("❌ Failed to load profile:", err);
      setApiError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Save personal info edits ───────────────────
  const handleSave = async (updates) => {
    if (!profileData?.empId) return;
    setSaving(true);
    setApiError("");
    setSaveSuccess(false);
    try {
      const updated = await updateProfile(profileData.empId, updates);
      setProfileData((prev) => ({ ...prev, ...updated }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("❌ Failed to save profile:", err);
      setApiError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Apply resignation modal ────────────────────
  const validateApply = () => {
    const errors = {};

    if (!applyForm.resignationDate) {
      errors.resignationDate = "Resignation date is required.";
    }

    if (!applyForm.proposedLastWorkingDate) {
      errors.proposedLastWorkingDate = "Proposed last working date is required.";
    }

    if (
      applyForm.resignationDate &&
      applyForm.proposedLastWorkingDate &&
      applyForm.proposedLastWorkingDate < applyForm.resignationDate
    ) {
      errors.proposedLastWorkingDate =
        "Proposed last day must be after resignation date.";
    }

    if (!applyForm.reason.trim()) {
      errors.reason = "Reason is required.";
    }

    setApplyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyChange = (field, value) => {
    setApplyForm((prev) => ({ ...prev, [field]: value }));
    if (applyErrors[field]) {
      setApplyErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const openApplyModal = () => {
    setApplyForm(EMPTY_APPLY_FORM);
    setApplyErrors({});
    setApplyApiError("");
    setApplySuccess(false);
    setShowApplyModal(true);
  };

  const closeApplyModal = () => {
    if (applySubmitting) return;
    setShowApplyModal(false);
  };

  const handleApplyResignation = () => {
    openApplyModal();
  };

  const handleApplySubmit = async () => {
    if (!validateApply()) return;

    const empId = profileData?.empId || getLoggedInEmpId();
    if (!empId) {
      setApplyApiError("Employee ID missing. Please log out and log in again.");
      return;
    }

    setApplySubmitting(true);
    setApplyApiError("");
    try {
      await applyResignation({
        empId,
        resignationDate: applyForm.resignationDate,
        proposedLastWorkingDate: applyForm.proposedLastWorkingDate,
        reason: applyForm.reason.trim(),
      });
      setShowApplyModal(false);
      setApplyForm(EMPTY_APPLY_FORM);
      setApplyErrors({});
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 3000);
    } catch (err) {
      console.error("❌ Failed to apply resignation:", err);
      setApplyApiError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit resignation. Please try again."
      );
    } finally {
      setApplySubmitting(false);
    }
  };

  const inputCls = (field) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed
    ${
      applyErrors[field]
        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
    }`;

  const ErrMsg = ({ field }) =>
    applyErrors[field] ? (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {applyErrors[field]}
      </p>
    ) : null;

  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View and manage your personal and employment information
        </p>
      </div>

      {/* ── Global error ── */}
      {apiError && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd" />
          </svg>
          {apiError}
        </div>
      )}

      {/* ── Save success toast ── */}
      {saveSuccess && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd" />
          </svg>
          Profile updated successfully.
        </div>
      )}

      {applySuccess && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Resignation request submitted successfully.
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading ? (
        <div className="space-y-5 animate-pulse">
          {/* Header skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-3 bg-gray-200" />
            <div className="px-6 py-6 flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="flex gap-2 mt-2">
                  <div className="h-7 bg-gray-100 rounded-xl w-28" />
                  <div className="h-7 bg-gray-100 rounded-xl w-32" />
                </div>
              </div>
            </div>
          </div>
          {/* Card skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-40" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-20" />
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : profileData ? (
        <div className="space-y-5">

          {/* ── Profile Header ── */}
          <ProfileHeader data={profileData} />

          {/* ── Two-column grid for cards ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div id="personal-info-section">
              <PersonalInfo
                data={profileData}
                onSave={handleSave}
                saving={saving}
              />
            </div>
            <JobInfo data={profileData} />
          </div>

          {/* ── Identity Details (full width) ── */}
          <IdentityInfo data={profileData} />

          {/* ── Action buttons ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Actions</h2>
            <div className="flex items-center gap-3 flex-wrap">

              {/* Edit Profile — opens PersonalInfo edit inline */}
              <button
                onClick={() => {
                  // Scroll to personal info section
                  document.getElementById("personal-info-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#1a2240] bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>

              {/* Apply Resignation */}
              <button
                onClick={handleApplyResignation}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Apply Resignation
              </button>

            </div>
          </div>

        </div>
      ) : (
        /* ── Empty / error state ── */
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100">
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-gray-600 font-medium">Profile not found</p>
          <p className="text-sm text-gray-400 mt-1">Unable to load your profile data.</p>
          <button
            onClick={loadProfile}
            className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-[#1a2240] hover:bg-[#243055] rounded-xl transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {showApplyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeApplyModal();
          }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Apply Resignation</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Submit your resignation request
                </p>
              </div>
              <button
                onClick={closeApplyModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Resignation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={applyForm.resignationDate}
                  onChange={(e) => handleApplyChange("resignationDate", e.target.value)}
                  disabled={applySubmitting}
                  className={inputCls("resignationDate")}
                />
                <ErrMsg field="resignationDate" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Proposed Last Working Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={applyForm.proposedLastWorkingDate}
                  onChange={(e) =>
                    handleApplyChange("proposedLastWorkingDate", e.target.value)
                  }
                  disabled={applySubmitting}
                  className={inputCls("proposedLastWorkingDate")}
                />
                <ErrMsg field="proposedLastWorkingDate" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter your reason for resignation..."
                  value={applyForm.reason}
                  onChange={(e) => handleApplyChange("reason", e.target.value)}
                  disabled={applySubmitting}
                  className={`${inputCls("reason")} resize-none`}
                />
                <ErrMsg field="reason" />
              </div>
            </div>

            {applyApiError && (
              <div className="px-6 pb-2">
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {applyApiError}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={closeApplyModal}
                disabled={applySubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleApplySubmit}
                disabled={applySubmitting}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm ${
                  applySubmitting
                    ? "bg-[#1a2240]/60 cursor-not-allowed"
                    : "bg-[#1a2240] hover:bg-[#243055] active:scale-95"
                }`}
              >
                {applySubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Resignation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
