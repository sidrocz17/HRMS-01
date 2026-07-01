// Query keys are centralized so every query and mutation invalidates the same
// cache families. Keep keys hierarchical: broad prefixes allow precise
// invalidateQueries calls after mutations.
export const leaveQueryKeys = {
  all: ["leave"],
  leaves: () => [...leaveQueryKeys.all, "leaves"],
  leavesByEmployee: (employeeId) => [
    ...leaveQueryKeys.leaves(),
    { employeeId: String(employeeId || "") },
  ],
  teamLeaves: () => [...leaveQueryKeys.all, "teamLeaves"],
  teamLeavesView: (currentEmployeeId) => [
    ...leaveQueryKeys.teamLeaves(),
    { currentEmployeeId: String(currentEmployeeId || "") },
  ],
  balance: () => [...leaveQueryKeys.all, "balance"],
  balanceByEmployee: (employeeId) => [
    ...leaveQueryKeys.balance(),
    { employeeId: String(employeeId || "") },
  ],
  summary: () => [...leaveQueryKeys.all, "summary"],
  types: () => [...leaveQueryKeys.all, "types"],
};
