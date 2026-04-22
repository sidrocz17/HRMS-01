// src/pages/EmployeeManagement.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeTable from "../components/employeeManagement/EmployeeTable";
import DeactivateModal from "../components/employeeManagement/DeactivateModal";
import EmployeeRecordsModal from "../components/employeeManagement/EmployeeRecordsModal";
import { normalizeRole, ROLES } from "../config/roles.jsx";
import { getRoleFromToken } from "../utils/auth.js";
import useEmployee from "../hooks/useEmployee";
import {
  deactivateEmployee,
  updateEmployeeStatus,
} from "../api/employeeManagementApi";
import { getAttendanceByEmployeeId } from "../api/attendanceApi";
import { fetchLeaveHistory } from "../api/leaveApi";
import { formatDisplayDate } from "../utils/date";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const toTitleCaseStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Pending";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const normalizeLeaveHistory = (response) =>
  toArray(response)
    .map((item, index) => ({
      id:
        item.leaveApplicationId ||
        item.leaveId ||
        item.id ||
        item.uuid ||
        String(index + 1),
      leave_type:
        item.leaveType ||
        item.leaveTypeName ||
        item.leave_type ||
        item.typeName ||
        "Leave",
      from_date:
        formatDisplayDate(item.startDate || item.fromDate || item.from_date) || "-",
      to_date:
        formatDisplayDate(item.endDate || item.toDate || item.to_date) || "-",
      days: item.noOfDays ?? item.days ?? 0,
      status: toTitleCaseStatus(item.status),
      applied_on:
        formatDisplayDate(
          item.appliedOn ||
            item.appliedDate ||
            item.createdOn ||
            item.createdAt ||
            item.created_on ||
            item.created_at
        ) || "-",
      sort_date:
        item.startDate ||
        item.fromDate ||
        item.from_date ||
        item.appliedOn ||
        item.appliedDate ||
        item.createdOn ||
        item.createdAt ||
        item.created_on ||
        item.created_at ||
        "",
    }))
    .filter((item) => item.id)
    .sort(
      (a, b) =>
        new Date(b.sort_date || 0).getTime() - new Date(a.sort_date || 0).getTime()
    );

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const {
    employees,
    setEmployees,
    loading: employeeLoading,
    error: employeeError,
  } = useEmployee();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recordsModalType, setRecordsModalType] = useState("");
  const [recordsEmployee, setRecordsEmployee] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  const currentUserRole = normalizeRole(getRoleFromToken());

  // Filtered employees based on search and status
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && emp.is_active) ||
      (statusFilter === "inactive" && !emp.is_active);

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (employee) => {
    console.log("✏️ Edit employee:", employee);
    navigate(`/employee-onboarding?mode=edit&id=${employee.empId}`, {
      state: { employee },
    });
  };

  const handleDeactivate = (employee) => {
    setSelectedEmployee(employee);
    setShowDeactivateModal(true);
  };

  const closeRecordsModal = () => {
    setRecordsModalType("");
    setRecordsEmployee(null);
    setRecords([]);
    setRecordsLoading(false);
    setRecordsError("");
  };

  const openRecordsModal = async (type, employee) => {
    const employeeId = String(employee?.empId || employee?.emp_id || "").trim();

    setRecordsModalType(type);
    setRecordsEmployee(employee);
    setRecords([]);
    setRecordsLoading(true);
    setRecordsError("");

    if (!employeeId) {
      setRecordsError("Employee ID is missing for this record.");
      setRecordsLoading(false);
      return;
    }

    try {
      if (type === "attendance") {
        const attendanceRecords = await getAttendanceByEmployeeId(employeeId);
        setRecords(attendanceRecords);
      } else {
        const leaveRecords = await fetchLeaveHistory(employeeId);
        setRecords(normalizeLeaveHistory(leaveRecords));
      }
    } catch (err) {
      console.error(`❌ Failed to fetch ${type} records:`, err);
      setRecordsError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          `Failed to load ${type} records`
      );
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleDeactivateConfirm = async (deactivateData) => {
    if (!selectedEmployee) return;

    setLoading(true);
    setError("");

    try {
      if (!deactivateData.employeeActive) {
        await deactivateEmployee(selectedEmployee.empId);
      } else {
        await updateEmployeeStatus(selectedEmployee.empId, deactivateData);
      }

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.empId === selectedEmployee.empId
            ? {
                ...emp,
                is_active: deactivateData.employeeActive,
                user_active: deactivateData.userActive,
              }
            : emp
        )
      );

      console.log("✅ Employee deactivated:", deactivateData);
      setShowDeactivateModal(false);
      setSelectedEmployee(null);
    } catch (err) {
      console.error("❌ Error deactivating employee:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update employee status";
      setError(message);
    } finally {
      setLoading(false);
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
      {(error || employeeError) && (
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
          {error || employeeError}
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
          onViewAttendance={(employee) => openRecordsModal("attendance", employee)}
          onViewLeaves={(employee) => openRecordsModal("leave", employee)}
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
          onCancel={() => {
            setShowDeactivateModal(false);
            setSelectedEmployee(null);
          }}
          loading={loading}
        />
      )}

      <EmployeeRecordsModal
        isOpen={Boolean(recordsModalType && recordsEmployee)}
        type={recordsModalType}
        employeeName={
          recordsEmployee
            ? `${recordsEmployee.first_name} ${recordsEmployee.last_name}`.trim()
            : ""
        }
        records={records}
        isLoading={recordsLoading}
        error={recordsError}
        onClose={closeRecordsModal}
      />
    </div>
  );
}
