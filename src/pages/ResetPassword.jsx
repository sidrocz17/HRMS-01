import { useNavigate } from "react-router-dom";
import ResetPasswordForm from "../components/auth/ResetPasswordForm";
import { shouldForcePasswordReset } from "../utils/authStorage";

export default function ResetPassword() {
  const navigate = useNavigate();
  const mustResetPassword = shouldForcePasswordReset();

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-lg font-bold text-gray-900">Reset Password</h1>
            <p className="text-sm text-gray-500 mt-1">
            {mustResetPassword
              ? "You must change your default password before using the application."
              : "This page is now connected to the change-password API."}
          </p>
        </div>

          <ResetPasswordForm
            mustResetPassword={mustResetPassword}
            onSuccess={() => navigate("/", { replace: true })}
            onCancel={() => navigate(-1)}
          />
        </div>
      </div>
    </div>
  );
}
