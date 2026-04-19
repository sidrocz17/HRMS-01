// src/components/employee/DeactivateModal.jsx
import { useState, useEffect } from "react";

export default function DeactivateModal({
  employee,
  onConfirm,
  onCancel,
  loading,
}) {
  // Initial state: both OFF (employee stays active, user stays active)
  const [employeeActive, setEmployeeActive] = useState(true); // Inverted: true = keep active
  const [userActive, setUserActive] = useState(true); // Inverted: true = keep active

  /**
   * Business Logic:
   * 1. If "Deactivate Employee" (employeeActive = false) is selected:
   *    - Automatically set "Deactivate User Login" (userActive = false)
   *    - Disable user toggle (can't have employee inactive + user active)
   *
   * 2. If only "Deactivate User Login" (userActive = false) is selected:
   *    - Employee stays active (employeeActive = true)
   *    - This is allowed
   *
   * 3. Invalid case: employeeActive = false + userActive = true
   *    - NOT allowed, auto-correct by setting userActive = false
   */

  useEffect(() => {
    // If employee is deactivated, force user to be deactivated
    if (!employeeActive && userActive) {
      setUserActive(false);
    }
  }, [employeeActive, userActive]);

  const handleEmployeeToggle = () => {
    const newEmployeeActive = !employeeActive;
    setEmployeeActive(newEmployeeActive);

    // If deactivating employee, also deactivate user
    if (!newEmployeeActive) {
      setUserActive(false);
    }
  };

  const handleUserToggle = () => {
    // Don't allow toggling user if employee is inactive
    if (!employeeActive) return;
    setUserActive(!userActive);
  };

  const handleConfirm = () => {
    // Validate: can't have employee active + user inactive is allowed
    // But can't have employee inactive + user active
    if (!employeeActive && userActive) {
      alert("Invalid state: Cannot deactivate employee while keeping user active");
      setUserActive(false);
      return;
    }

    // Convert inverted logic back to API payload
    onConfirm({
      employeeActive, // true = keep active, false = deactivate
      userActive, // true = keep active, false = deactivate
    });
  };

  // Check if both are active (no changes)
  const noChanges = employeeActive && userActive;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-red-900">
            Deactivate Employee
          </h2>
          <p className="text-sm text-red-700 mt-1">
            {employee.first_name} {employee.last_name}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <p className="text-sm text-gray-600">
            Select what you want to deactivate:
          </p>

          {/* Deactivate Employee Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Deactivate Employee</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {employeeActive
                  ? "Employee will remain active"
                  : "Employee will be deactivated"}
              </p>
            </div>
            <button
              onClick={handleEmployeeToggle}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                employeeActive ? "bg-gray-300" : "bg-red-500"
              }`}
              role="switch"
              aria-checked={!employeeActive}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                  employeeActive ? "translate-x-1" : "translate-x-7"
                }`}
              />
            </button>
          </div>

          {/* Deactivate User Login Toggle */}
          <div
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              !employeeActive
                ? "bg-red-50 border-red-200 cursor-not-allowed opacity-60"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div>
              <p className="font-medium text-gray-900">Deactivate User Login</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {userActive
                  ? "User login will remain active"
                  : "User login will be deactivated"}
              </p>
              {!employeeActive && (
                <p className="text-xs text-red-600 mt-1">
                  Auto-disabled (deactivated employee)
                </p>
              )}
            </div>
            <button
              onClick={handleUserToggle}
              disabled={!employeeActive}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                userActive
                  ? "bg-gray-300"
                  : !employeeActive
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-red-500"
              }`}
              role="switch"
              aria-checked={!userActive}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                  userActive ? "translate-x-1" : "translate-x-7"
                }`}
              />
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <p className="font-medium mb-1">💡 Business Rules:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Deactivating employee auto-deactivates user login</li>
              <li>• You can deactivate user while keeping employee active</li>
              <li>• Cannot keep user active if employee is deactivated</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading || noChanges}
            className={`px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
              noChanges
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
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
                Updating...
              </span>
            ) : noChanges ? (
              "No Changes"
            ) : (
              "Confirm Deactivation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
