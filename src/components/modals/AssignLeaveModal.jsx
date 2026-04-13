import { useState } from "react";

export default function AssignLeaveModal({
  isOpen,
  onClose,
  employeeId,
  leaveTypes,
  onSubmit,
}) {
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [totalLeaves, setTotalLeaves] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!leaveTypeId) {
      newErrors.leaveTypeId = "Leave type is required";
    }

    if (!totalLeaves || totalLeaves <= 0) {
      newErrors.totalLeaves = "Number of leaves must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        employeeId,
        leaveTypeId,
        totalLeaves: parseInt(totalLeaves),
      });

      // Reset form
      setLeaveTypeId("");
      setTotalLeaves("");
      setErrors({});
    } catch (error) {
      console.error("Error submitting leave:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setLeaveTypeId("");
    setTotalLeaves("");
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Assign Leave to Employee
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Employee ID: <span className="font-mono font-medium">{employeeId}</span>
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              value={leaveTypeId}
              onChange={(e) => {
                setLeaveTypeId(e.target.value);
                if (e.target.value) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.leaveTypeId;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
                placeholder:text-gray-300
                ${
                  errors.leaveTypeId
                    ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
                }`}
            >
              <option value="">Select leave type</option>
              {leaveTypes &&
                leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
            </select>
            {errors.leaveTypeId && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.leaveTypeId}
              </p>
            )}
          </div>

          {/* Number of Leaves */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Number of Leaves <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="Enter number of leaves"
              value={totalLeaves}
              onChange={(e) => {
                setTotalLeaves(e.target.value);
                if (e.target.value && parseInt(e.target.value) > 0) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.totalLeaves;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
                placeholder:text-gray-300
                ${
                  errors.totalLeaves
                    ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
                }`}
            />
            {errors.totalLeaves && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.totalLeaves}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
              loading
                ? "bg-[#1a2240]/60"
                : "bg-[#1a2240] hover:bg-[#243055]"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Assigning...
              </span>
            ) : (
              "Assign"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
