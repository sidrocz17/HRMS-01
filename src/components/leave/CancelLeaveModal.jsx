import { useEffect, useState } from "react";

const EMPTY_FORM = {
  remarks: "",
};

export default function CancelLeaveModal({
  leave,
  submitting = false,
  apiError = "",
  onConfirm,
  onClose,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(EMPTY_FORM);
    setError("");
  }, [leave]);

  if (!leave) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  const handleConfirm = () => {
    const remarks = String(form.remarks || "").trim();

    if (!remarks) {
      setError("Cancellation remarks are required.");
      return;
    }

    setError("");
    onConfirm(remarks);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Cancel Leave Request</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Add a remark before cancelling this leave.
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

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-2">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Leave Type</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{leave.leave_type}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">From</p>
                <p className="text-sm text-gray-700 mt-1">{leave.from_date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">To</p>
                <p className="text-sm text-gray-700 mt-1">{leave.to_date}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Example: Emergency plan changed, cancelling leave"
              value={form.remarks}
              onChange={(e) => {
                setForm({ remarks: e.target.value });
                if (error) setError("");
              }}
              disabled={submitting}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all resize-none placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed ${
                error
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
              }`}
            />
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
          </div>
        </div>

        {apiError && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {apiError}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Keep Leave
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all disabled:opacity-50"
          >
            {submitting ? "Cancelling..." : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
