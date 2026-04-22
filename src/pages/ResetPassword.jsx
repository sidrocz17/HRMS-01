import { useNavigate } from "react-router-dom";
import ResetPasswordForm from "../components/auth/ResetPasswordForm";

export default function ResetPassword() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-1">
            This page is now connected to the change-password API.
          </p>
        </div>

        <ResetPasswordForm
          onSuccess={() => navigate("/", { replace: true })}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
