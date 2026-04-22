export const getEmployeeIdentityValues = (employee = {}) => {
  const sources = [
    employee,
    employee?.user || {},
    employee?.employee || {},
    employee?.data || {},
  ];

  return [
    ...new Set(
      sources
        .flatMap((source) => [
          source?.empId,
          source?.emp_id,
          source?.employeeId,
          source?.employee_id,
          source?.userId,
          source?.user_id,
          source?.id,
          source?.uuid,
        ])
        .filter(
          (value) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        )
        .map((value) => String(value).trim())
    ),
  ];
};

export const getEmployeeDisplayName = (employee = {}) => {
  const sources = [
    employee,
    employee?.employee || {},
    employee?.user || {},
    employee?.data || {},
  ];

  const firstName = sources
    .map(
      (source) =>
        source?.firstName || source?.first_name || source?.firstname || ""
    )
    .find((value) => String(value || "").trim());

  const lastName = sources
    .map(
      (source) =>
        source?.lastName || source?.last_name || source?.lastname || ""
    )
    .find((value) => String(value || "").trim());

  const fullName = [firstName, lastName]
    .filter((value) => String(value || "").trim())
    .join(" ")
    .trim();

  return fullName || "N/A";
};

export const getEmployeeNameById = (id, employees = []) => {
  const normalizedId = String(id || "").trim();
  if (!normalizedId || !Array.isArray(employees)) return "N/A";

  const matchedEmployee = employees.find((employee) =>
    getEmployeeIdentityValues(employee).includes(normalizedId)
  );

  if (!matchedEmployee) return "N/A";

  return getEmployeeDisplayName(matchedEmployee);
};
