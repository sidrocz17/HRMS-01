import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEmployee as createEmployeeApi } from "../../api/employeeApi";
import {
  deactivateEmployee,
  getAllEmployees,
  updateEmployee,
  updateEmployeeStatus,
} from "../../api/employeeManagementApi";
import { getApiErrorMessage } from "../../utils/leaveTransformers";

export const employeeQueryKeys = {
  all: ["employees"],
  lists: () => [...employeeQueryKeys.all, "list"],
  list: (params = {}) => [...employeeQueryKeys.lists(), params],
};

const EMPLOYEES_STALE_TIME = 2 * 60 * 1000;

const pickEmployeeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.employees)) return payload.employees;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

export const normalizeEmployee = (employee = {}) => {
  const department = employee.department || employee.department_details || {};
  const designation =
    employee.designation || employee.designation_details || {};
  const employeeType =
    employee.employeeType ||
    employee.employee_type ||
    employee.employmentType ||
    employee.employment_type ||
    employee.employeeTypeDetails ||
    {};

  const empId =
    employee.empId ||
    employee.emp_id ||
    employee.employeeId ||
    employee.employee_id ||
    employee.id ||
    "";
  const firstName =
    employee.firstName || employee.first_name || employee.firstname || "";
  const lastName =
    employee.lastName || employee.last_name || employee.lastname || "";
  const email =
    employee.email || employee.email_id || employee.work_email || "";

  return {
    ...employee,
    empId,
    emp_id: empId,
    firstName,
    first_name: firstName,
    lastName,
    last_name: lastName,
    email,
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
    employeeType: {
      ...employeeType,
      id:
        employeeType.id ||
        employeeType.employeeTypeId ||
        employeeType.employee_type_id ||
        employeeType.employmentTypeId ||
        employeeType.employment_type_id ||
        employee.employeeTypeId ||
        employee.employee_type_id ||
        employee.employmentTypeId ||
        employee.employment_type_id ||
        employee.empTypeId ||
        employee.emp_type_id ||
        "",
      name:
        employeeType.name ||
        employeeType.typeName ||
        employeeType.title ||
        employeeType.employeeType ||
        employee.employeeTypeName ||
        employee.employee_type_name ||
        employee.employmentTypeName ||
        employee.employment_type_name ||
        "-",
    },
    employee_type_id:
      employee.employee_type_id ||
      employee.employeeTypeId ||
      employee.employmentTypeId ||
      employee.employment_type_id ||
      employee.empTypeId ||
      employee.emp_type_id ||
      employeeType.id ||
      employeeType.employeeTypeId ||
      employeeType.employee_type_id ||
      employeeType.employmentTypeId ||
      employeeType.employment_type_id ||
      "",
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

export const normalizeEmployees = (payload) =>
  pickEmployeeList(payload).map(normalizeEmployee);

const invalidateEmployeeQueries = (queryClient) =>
  queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });

const useEmployeeMutation = (mutationFn, fallbackMessage, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, context) => {
      await invalidateEmployeeQueries(queryClient);
      options.onSuccess?.({ data }, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(
        {
          error,
          message: getApiErrorMessage(error, fallbackMessage),
        },
        variables,
        context
      );
    },
  });
};

export const useEmployees = (params = {}, options = {}) =>
  useQuery({
    queryKey: employeeQueryKeys.list(params),
    queryFn: () => getAllEmployees(params),
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? EMPLOYEES_STALE_TIME,
    select: normalizeEmployees,
  });

export const useCreateEmployee = (options = {}) =>
  useEmployeeMutation(
    createEmployeeApi,
    "Failed to create employee",
    options
  );

export const useUpdateEmployee = (options = {}) =>
  useEmployeeMutation(
    ({ empId, data }) => updateEmployee(empId, data),
    "Failed to update employee",
    options
  );

export const useDeleteEmployee = (options = {}) =>
  useEmployeeMutation(
    ({ empId, statusData } = {}) =>
      statusData ? updateEmployeeStatus(empId, statusData) : deactivateEmployee(empId),
    "Failed to update employee status",
    options
  );
