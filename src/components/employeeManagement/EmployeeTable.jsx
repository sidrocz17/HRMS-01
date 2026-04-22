import ActionButtons from "../employee/ActionButtons";

// src/components/employee/EmployeeTable.jsx
export default function EmployeeTable({
  employees,
  onViewAttendance,
  onViewLeaves,
  onEdit,
  onDeactivate,
  canManage,
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Employee Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Designation
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Joining Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Status
              </th>
              {canManage && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((employee) => (
              <tr
                key={employee.emp_id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Employee Name */}
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  <div>
                    <p className="font-medium text-gray-900">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{employee.email}</p>
                  </div>
                </td>

                {/* Department */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {employee.department?.deptName || "-"}
                </td>

                {/* Designation */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {employee.designation?.title || "-"}
                </td>

                {/* Joining Date */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDate(employee.join_date)}
                </td>

                {/* Status */}
                <td className="px-6 py-4 text-sm">
                  {employee.is_active ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-green-700 font-medium">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-red-700 font-medium">Inactive</span>
                    </div>
                  )}
                </td>

                {/* Actions */}
                {canManage && (
                  <td className="px-6 py-4 text-sm">
                    <ActionButtons
                      onAttendance={() => onViewAttendance(employee)}
                      onLeave={() => onViewLeaves(employee)}
                      onEdit={() => onEdit(employee)}
                      onDelete={() => onDeactivate(employee)}
                      deleteLabel="Deactivate"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
