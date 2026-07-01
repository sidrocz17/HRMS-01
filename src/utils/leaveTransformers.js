import { formatDisplayDate } from "./date";

export const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

export const getApiErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const toTitleCaseStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Pending";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const mapLeaveBalanceItem = (item = {}, index = 0) => ({
  id:
    item.empLeaveId ||
    item.emp_leave_id ||
    item.id ||
    item.uuid ||
    String(index + 1),
  leave_type_id:
    item.leaveTypeId ||
    item.leave_type_id ||
    item.typeId ||
    item.type_id ||
    null,
  leave_type:
    item.leaveTypeName ||
    item.leaveType ||
    item.leave_type ||
    item.typeName ||
    item.name ||
    "Leave",
  year: item.year ?? item.calendarYear ?? item.calendar_year ?? null,
  total: item.totalLeaves ?? item.total ?? 0,
  used: item.usedLeaves ?? item.used ?? 0,
  remaining: item.remainingLeaves ?? item.remaining ?? 0,
});

export const normalizeLeaveBalance = (response) =>
  toArray(response)
    .map(mapLeaveBalanceItem)
    .filter((item) => item.id && item.leave_type)
    .sort((a, b) => {
      const yearDiff = Number(b.year || 0) - Number(a.year || 0);
      if (yearDiff !== 0) return yearDiff;
      return String(a.leave_type).localeCompare(String(b.leave_type));
    });

const mapLeaveHistoryItem = (item = {}, index = 0) => ({
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
  from_date: formatDisplayDate(item.startDate || item.fromDate || item.from_date) || "-",
  to_date: formatDisplayDate(item.endDate || item.toDate || item.to_date) || "-",
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
  remarks: item.remarks || "",
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
});

export const normalizeLeaveHistory = (response) =>
  toArray(response)
    .map(mapLeaveHistoryItem)
    .filter((item) => item.id)
    .sort(
      (a, b) =>
        new Date(b.sort_date || 0).getTime() - new Date(a.sort_date || 0).getTime()
    );

const mapTeamLeaveItem = (item = {}, index = 0, currentEmployeeId = "") => {
  const employeeId = String(
    item.empId ||
      item.emp_id ||
      item.employeeId ||
      item.employee_id ||
      ""
  ).trim();
  const normalizedCurrentEmployeeId = String(currentEmployeeId || "").trim();

  return {
    id:
      item.leaveApplicationId ||
      item.leaveId ||
      item.id ||
      item.uuid ||
      String(index + 1),
    employee_name:
      item.employeeName ||
      item.employee_name ||
      item.empName ||
      item.emp_name ||
      item.fullName ||
      item.name ||
      "Employee",
    employee_id: employeeId,
    is_own_leave:
      Boolean(normalizedCurrentEmployeeId) &&
      Boolean(employeeId) &&
      normalizedCurrentEmployeeId === employeeId,
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
    remarks: item.remarks || "",
    sort_date:
      item.appliedOn ||
      item.appliedDate ||
      item.createdOn ||
      item.createdAt ||
      item.created_on ||
      item.created_at ||
      item.startDate ||
      item.fromDate ||
      item.from_date ||
      "",
  };
};

export const normalizeTeamLeaves = (response, currentEmployeeId = "") =>
  toArray(response)
    .map((item, index) => mapTeamLeaveItem(item, index, currentEmployeeId))
    .filter((item) => item.id)
    .sort(
      (a, b) =>
        new Date(b.sort_date || 0).getTime() - new Date(a.sort_date || 0).getTime()
    );

export const normalizeLeaveTypes = (response) =>
  toArray(response)
    .map((type) => ({
      id: type.typeId ?? type.id ?? type.type_id,
      name: type.type ?? type.leaveType ?? type.name ?? type.label ?? "",
    }))
    .filter((type) => type.id && type.name);
