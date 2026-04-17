// src/pages/EmployeeManagement.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeTable from "../components/employeeManagement/EmployeeTable";
import DeactivateModal from "../components/employeeManagement/DeactivateModal";
import { normalizeRole, ROLES } from "../config/roles.jsx";
import {
  deactivateEmployee,
  getEmployees,
  updateEmployeeStatus,
} from "../api/employeeManagementApi";

const pickEmployeeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.employees)) return payload.employees;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeEmployee = (employee = {}) => {
  const department = employee.department || employee.department_details || {};
  const designation =
    employee.designation || employee.designation_details || {};

  return {
    ...employee,
    emp_id:
      employee.emp_id ||
      employee.employee_id ||
      employee.empId ||
      employee.id ||
      "",
    first_name:
      employee.first_name || employee.firstName || employee.firstname || "",
    last_name:
      employee.last_name || employee.lastName || employee.lastname || "",
    email: employee.email || employee.email_id || employee.work_email || "",
    department: {
      ...department,
      deptName:
        department.deptName ||
        department.department_name ||
        department.name ||
        employee.department_name ||
        employee.departmentName ||
        "-",
    },
    designation: {
      ...designation,
      title:
        designation.title ||
        designation.designation_name ||
        designation.name ||
        employee.designation_name ||
        employee.designationTitle ||
        "-",
    },
    join_date:
      employee.join_date ||
      employee.joinDate ||
      employee.joining_date ||
      employee.date_of_joining ||
      employee.created_at ||
      null,
    is_active:
      typeof employee.is_active === "boolean"
        ? employee.is_active
        : typeof employee.isActive === "boolean"
        ? employee.isActive
        : typeof employee.status === "string"
        ? employee.status.toLowerCase() === "active"
        : Boolean(employee.user_active ?? employee.userActive ?? true),
    user_active:
      typeof employee.user_active === "boolean"
        ? employee.user_active
        : typeof employee.userActive === "boolean"
        ? employee.userActive
        : true,
  };
};

export default function EmployeeManagement() {
  const navigate = useNavigate();

  // State
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUserRole = normalizeRole(localStorage.getItem("role"));

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

  // Fetch employees (TODO: Integrate API)
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getEmployees();
        const employeeList = pickEmployeeList(response).map(normalizeEmployee);
        setEmployees(employeeList);
      } catch (err) {
        console.error("❌ Error fetching employees:", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load employees";
        setError(message);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleEdit = (employee) => {
    console.log("✏️ Edit employee:", employee);
    navigate(`/employee-onboarding?mode=edit&id=${employee.emp_id}`, {
      state: { employee },
    });
  };

  const handleDeactivate = (employee) => {
    setSelectedEmployee(employee);
    setShowDeactivateModal(true);
  };

  const handleDeactivateConfirm = async (deactivateData) => {
    if (!selectedEmployee) return;

    setLoading(true);
    setError("");

    try {
      if (!deactivateData.employeeActive) {
        await deactivateEmployee(selectedEmployee.emp_id);
      } else {
        await updateEmployeeStatus(selectedEmployee.emp_id, deactivateData);
      }

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.emp_id === selectedEmployee.emp_id
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
      {error && (
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
          {error}
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
      {loading ? (
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
          onCancel={() => {
            setShowDeactivateModal(false);
            setSelectedEmployee(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
}
