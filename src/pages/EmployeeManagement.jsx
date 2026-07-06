// src/pages/EmployeeManagement.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeTable from "../components/employeeManagement/EmployeeTable";
import DeactivateModal from "../components/employeeManagement/DeactivateModal";
import { normalizeRole, ROLES } from "../config/roles.jsx";
import { getRoleFromToken } from "../utils/auth.js";
import { useDeleteEmployee, useEmployees } from "../hooks/query/useEmployees";
import useEmployeeStore from "../store/useEmployeeStore";
import { getApiErrorMessage } from "../utils/leaveTransformers";

const EMPTY_EMPLOYEES = [];

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const {
    data: queriedEmployees = EMPTY_EMPLOYEES,
    isLoading: employeeLoading,
    isError: isEmployeeError,
    error: employeeError,
  } = useEmployees();

  const [error, setError] = useState("");
  const employees = useEmployeeStore((state) => state.employees);
  const searchTerm = useEmployeeStore((state) => state.search);
  const filters = useEmployeeStore((state) => state.filters);
  const selectedEmployee = useEmployeeStore((state) => state.selectedEmployee);
  const showDeactivateModal = useEmployeeStore(
    (state) => state.isDeactivateModalOpen
  );
  const setEmployees = useEmployeeStore((state) => state.setEmployees);
  const setSearchTerm = useEmployeeStore((state) => state.setSearch);
  const setFilters = useEmployeeStore((state) => state.setFilters);
  const openDeactivateModal = useEmployeeStore(
    (state) => state.openDeactivateModal
  );
  const closeDeactivateModal = useEmployeeStore(
    (state) => state.closeDeactivateModal
  );

  const currentUserRole = normalizeRole(getRoleFromToken());
  const deleteEmployeeMutation = useDeleteEmployee({
    onSuccess: () => {
      console.log("✅ Employee status updated");
      closeDeactivateModal();
    },
    onError: ({ message }) => setError(message),
  });

  useEffect(() => {
    setEmployees(queriedEmployees);
  }, [queriedEmployees, setEmployees]);

  // Filtered employees based on search and status
  const filteredEmployees = useMemo(() => {
    const normalizedSearch = String(searchTerm || "").toLowerCase();
    const statusFilter = filters.status;

    return employees.filter((emp) => {
      const matchesSearch =
        String(emp.first_name || "").toLowerCase().includes(normalizedSearch) ||
        String(emp.last_name || "").toLowerCase().includes(normalizedSearch) ||
        String(emp.email || "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && emp.is_active) ||
        (statusFilter === "inactive" && !emp.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [employees, filters.status, searchTerm]);

  const handleEdit = (employee) => {
    console.log("✏️ Edit employee:", employee);
    navigate(`/employee-onboarding?mode=edit&id=${employee.empId}`, {
      state: { employee },
    });
  };

  const handleDeactivate = (employee) => {
    setError("");
    openDeactivateModal(employee);
  };

  const handleDeactivateConfirm = async (deactivateData) => {
    if (!selectedEmployee) return;

    setError("");

    try {
      await deleteEmployeeMutation.mutateAsync({
        empId: selectedEmployee.empId,
        statusData: deactivateData.employeeActive ? deactivateData : null,
      });
    } catch (err) {
      console.error("❌ Error deactivating employee:", err);
      setError(getApiErrorMessage(err, "Failed to update employee status"));
    }
  };

  // Check if user has permission to edit/deactivate
  const canManageEmployees = [ROLES.ADMIN, ROLES.HR].includes(currentUserRole);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View and manage employee information
        </p>
      </div>

      {/* Error Message */}
      {(error || isEmployeeError) && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error || getApiErrorMessage(employeeError, "Failed to load employees")}
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all"
              >
                <option value="all">All Employees</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredEmployees.length}</span> of{" "}
              <span className="font-semibold">{employees.length}</span> employees
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-sm text-[#1a2240] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {employeeLoading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-[#1a2240] mx-auto mb-2"
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
            <p className="text-sm text-gray-500">Loading employees...</p>
          </div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <svg
            className="w-12 h-12 text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a7 7 0 1114 0"
            />
          </svg>
          <p className="text-gray-600 font-medium">No employees found</p>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <EmployeeTable
          employees={filteredEmployees}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
          canManage={canManageEmployees}
        />
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && selectedEmployee && (
        <DeactivateModal
          employee={selectedEmployee}
          onConfirm={handleDeactivateConfirm}
          onCancel={closeDeactivateModal}
          loading={deleteEmployeeMutation.isPending}
        />
      )}
    </div>
  );
}
