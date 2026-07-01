import { useMemo } from "react";
import { useEmployees } from "./query/useEmployees";
import {
  getEmployeeDisplayName,
  getEmployeeIdentityValues,
  getEmployeeNameById,
} from "../utils/employeeUtils";

export default function useEmployee() {
  const {
    data: employees = [],
    isLoading: loading,
    isError,
    error,
  } = useEmployees();
  const employeeMap = useMemo(
    () =>
      employees.reduce((acc, employee) => {
        const fullName = getEmployeeDisplayName(employee);
        getEmployeeIdentityValues(employee).forEach((identityValue) => {
          acc[identityValue] = fullName;
        });
        return acc;
      }, {}),
    [employees]
  );

  const getEmployeeName = (id) => {
    const normalizedId = String(id || "").trim();
    if (!normalizedId) return "N/A";
    return employeeMap[normalizedId] || getEmployeeNameById(normalizedId, employees);
  };

  return {
    employees,
    employeeMap,
    loading,
    error: isError
      ? error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load employees"
      : "",
    getEmployeeName,
  };
}
