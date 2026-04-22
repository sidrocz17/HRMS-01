import { useContext } from "react";
import { EmployeeContext } from "../context/EmployeeContext";
import { getEmployeeNameById } from "../utils/employeeUtils";

export default function useEmployee() {
  const context = useContext(EmployeeContext);

  if (!context) {
    throw new Error("useEmployee must be used within an EmployeeProvider");
  }

  const { employees, employeeMap } = context;

  const getEmployeeName = (id) => {
    const normalizedId = String(id || "").trim();
    if (!normalizedId) return "N/A";
    return employeeMap[normalizedId] || getEmployeeNameById(normalizedId, employees);
  };

  return {
    ...context,
    employees,
    getEmployeeName,
  };
}
