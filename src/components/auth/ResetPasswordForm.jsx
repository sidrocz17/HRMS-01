import { useState } from "react";
import { changePassword } from "../../api/authApi";
import { setForcePasswordReset } from "../../utils/authStorage";
import { logoutAndRedirect } from "../../utils/auth";

const EyeIcon = ({ open }) => open ? (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
) : (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const PasswordField = ({
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggleVisibility,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
    </label>
    <div className="flex items-center rounded-xl border border-gray-200 px-4 py-3 focus-within:border-[#1a2240] focus-within:ring-2 focus-within:ring-[#1a2240]/10">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="flex-1 bg-transparent text-sm text-gray-800 outline-none"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  </div>
);

export default function ResetPasswordForm({
  mustResetPassword = false,
  onSuccess,
  onCancel,
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setResetError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("New password and confirm password must match.");
      return;
    }

    if (oldPassword === newPassword) {
      setResetError("New password must be different from the old password.");
      return;
    }

    setIsResettingPassword(true);

    try {
      const data = await changePassword({ oldPassword, newPassword });
      setForcePasswordReset(false);
      setResetSuccess(
        "Password changed successfully. Please use the new password next time you sign in."
      );
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        onSuccess?.(data);
        logoutAndRedirect();
      }, 1200);
    } catch (error) {
      setResetError(
        error.response?.data?.message ||
          error.message ||
          "Unable to change password right now."
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCancel = () => {
    if (mustResetPassword) return;

    setResetError("");
    setResetSuccess("");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onCancel?.();
  };

  return (
    <form onSubmit={handlePasswordReset} className="px-6 py-5 space-y-4">
      <PasswordField
        label="Old Password"
        value={oldPassword}
        onChange={(event) => setOldPassword(event.target.value)}
        placeholder="Enter current password"
        visible={showOldPassword}
        onToggleVisibility={() => setShowOldPassword((prev) => !prev)}
      />

      <PasswordField
        label="New Password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        placeholder="Enter new password"
        visible={showNewPassword}
        onToggleVisibility={() => setShowNewPassword((prev) => !prev)}
      />

      <PasswordField
        label="Confirm Password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Re-enter new password"
        visible={showConfirmPassword}
        onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
      />

      {resetError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {resetError}
        </div>
      ) : null}

      {resetSuccess ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {resetSuccess}
        </div>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        {!mustResetPassword ? (
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        ) : null}

        <button
          type="submit"
          disabled={isResettingPassword}
          className="px-4 py-2 text-sm font-semibold text-white bg-[#1a2240] rounded-xl hover:bg-[#243055] transition-colors disabled:opacity-60"
        >
          {isResettingPassword ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  );
}
