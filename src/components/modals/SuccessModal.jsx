import { useState } from "react";

export default function SuccessModal({
  isOpen,
  onClose,
  credentials,
  onAssignLeave,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 px-6 py-6">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900">
            {credentials?.message || "Employee Added Successfully"}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Security Message */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">⚠️ Important:</span> Please save
              these credentials securely. They will not be shown again.
            </p>
          </div>

          {/* Login ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Login ID
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-900 select-all">
                {credentials?.userId || "-"}
              </div>
              <button
                onClick={() =>
                  handleCopy(credentials?.userId || "", "userId")
                }
                className={`p-2.5 rounded-lg transition-all ${
                  copiedField === "userId"
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Copy"
              >
                {copiedField === "userId" ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs font-medium text-[#1a2240] hover:underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-900 select-all">
                {showPassword ? credentials?.password || "-" : "••••••••"}
              </div>
              <button
                onClick={() =>
                  handleCopy(credentials?.password || "", "password")
                }
                className={`p-2.5 rounded-lg transition-all ${
                  copiedField === "password"
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Copy"
              >
                {copiedField === "password" ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
          >
            Go to Employee Status
          </button>
          <button
            onClick={onAssignLeave}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#1a2240] hover:bg-[#243055] active:scale-95 rounded-xl transition-all shadow-sm"
          >
            Assign Leave
          </button>
        </div>
      </div>
    </div>
  );
}
