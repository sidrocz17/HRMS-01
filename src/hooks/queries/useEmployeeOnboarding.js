import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEmployee } from "../../api/employeeApi";
import { getEmployeeById, updateEmployee } from "../../api/employeeManagementApi";
import { employeeQueryKeys } from "../query/useEmployees";
import { getApiErrorMessage } from "../../utils/leaveTransformers";

export const employeeOnboardingQueryKeys = {
  all: ["employeeOnboarding"],
  details: () => [...employeeOnboardingQueryKeys.all, "detail"],
  detail: (employeeId) => [
    ...employeeOnboardingQueryKeys.details(),
    { employeeId: String(employeeId || "") },
  ],
};

const invalidateOnboardingQueries = async (queryClient, employeeId) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: employeeOnboardingQueryKeys.all }),
    employeeId
      ? queryClient.invalidateQueries({
          queryKey: employeeOnboardingQueryKeys.detail(employeeId),
        })
      : Promise.resolve(),
  ]);
};

const useOnboardingMutation = (mutationFn, fallbackMessage, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, context) => {
      await invalidateOnboardingQueries(queryClient, variables?.employeeId);
      options.onSuccess?.(
        {
          data,
          message: data?.message || "Employee onboarding saved successfully.",
        },
        variables,
        context
      );
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

export const useGetOnboarding = (employeeId, options = {}) =>
  useQuery({
    queryKey: employeeOnboardingQueryKeys.detail(employeeId),
    queryFn: () => getEmployeeById(employeeId),
    enabled: Boolean(employeeId) && options.enabled !== false,
    staleTime: options.staleTime ?? 2 * 60 * 1000,
  });

export const useSubmitOnboarding = (options = {}) =>
  useOnboardingMutation(
    ({ payload }) => createEmployee(payload),
    "Failed to create employee",
    options
  );

export const useUpdateOnboarding = (options = {}) =>
  useOnboardingMutation(
    ({ employeeId, payload }) => updateEmployee(employeeId, payload),
    "Failed to update employee",
    options
  );
