import {
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { getAllEmployees } from "../api/employeeManagementApi";
import {
  getEmployeeDisplayName,
  getEmployeeIdentityValues,
} from "../utils/employeeUtils";

export const EmployeeContext = createContext(null);

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

let employeeCache = null;
let employeeRequest = null;

const clearEmployeeCache = () => {
  employeeCache = null;
  employeeRequest = null;
};

const loadEmployees = async () => {
  if (employeeCache) return employeeCache;

  if (!employeeRequest) {
    employeeRequest = getAllEmployees()
      .then((response) => {
        const normalizedEmployees = pickEmployeeList(response).map(
          normalizeEmployee
        );
        employeeCache = normalizedEmployees;
        return normalizedEmployees;
      })
      .finally(() => {
        employeeRequest = null;
      });
  }

  return employeeRequest;
};

const fetchFreshEmployees = async () => {
  const response = await getAllEmployees();
  const normalizedEmployees = pickEmployeeList(response).map(normalizeEmployee);
  employeeCache = normalizedEmployees;
  return normalizedEmployees;
};

export function EmployeeProvider({ children }) {
  const { pathname } = useLocation();
  const [employees, setEmployees] = useState(() => employeeCache || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshEmployees = async () => {
    setLoading(true);
    setError("");
    clearEmployeeCache();

    try {
      const employeeList = await fetchFreshEmployees();
      setEmployees(employeeList);
      return employeeList;
    } catch (fetchError) {
      setEmployees([]);
      setError(
        fetchError?.response?.data?.message ||
          fetchError?.message ||
          "Failed to load employees"
      );
      throw fetchError;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      clearEmployeeCache();
      setEmployees([]);
      setLoading(false);
      setError("");
      return;
    }

    if (employeeCache?.length) {
      setEmployees(employeeCache);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    loadEmployees()
      .then((employeeList) => {
        if (!isMounted) return;
        setEmployees(employeeList);
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setEmployees([]);
        setError(
          fetchError?.response?.data?.message ||
            fetchError?.message ||
            "Failed to load employees"
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const employeeMap = useMemo(() => {
    return employees.reduce((acc, employee) => {
      const fullName = getEmployeeDisplayName(employee);
      getEmployeeIdentityValues(employee).forEach((identityValue) => {
        acc[identityValue] = fullName;
      });
      return acc;
    }, {});
  }, [employees]);

  const value = useMemo(
    () => ({
      employees,
      setEmployees,
      refreshEmployees,
      employeeMap,
      loading,
      error,
    }),
    [employees, employeeMap, loading, error]
  );

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
}
