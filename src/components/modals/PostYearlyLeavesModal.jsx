import { useState } from "react";

export default function PostYearlyLeavesModal({
  isOpen,
  onClose,
  onConfirm,
}) {
  const currentYear = new Date().getFullYear();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [year, setYear] = useState(String(currentYear));

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!year.trim()) {
      setError("Year is required");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await onConfirm?.(year);
      const nextMessage =
        response?.message ||
        response?.data?.message ||
        "Yearly leaves posted successfully";
      setMessage(nextMessage);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to post yearly leaves"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200 px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Post Yearly Leaves
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            This will allocate yearly leaves for all employees.
          </p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Year
            </label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none transition-all placeholder:text-gray-300 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
              placeholder="Enter year"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900">
              Use this only once per year. If the backend supports idempotency,
              it will ignore duplicates; otherwise it may double-allocate.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">{message}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Close
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
              loading
                ? "bg-[#1a2240]/60"
                : "bg-[#1a2240] hover:bg-[#243055]"
            }`}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
