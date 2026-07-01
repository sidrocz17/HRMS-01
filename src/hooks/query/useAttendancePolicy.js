import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAttendancePolicy,
  deleteAttendancePolicy,
  fetchAttendancePolicy,
  fetchAttendancePolicyHistory,
  updateAttendancePolicy,
} from "../../api/attendancePolicyApi";

const RESOURCE_STALE_TIME = 60 * 1000;

export const attendancePolicyQueryKeys = {
  all: ["attendancePolicy"],
  current: () => [...attendancePolicyQueryKeys.all, "current"],
  history: () => [...attendancePolicyQueryKeys.all, "history"],
};

export const useAttendancePolicy = (options = {}) =>
  useQuery({
    queryKey: attendancePolicyQueryKeys.current(),
    queryFn: fetchAttendancePolicy,
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? RESOURCE_STALE_TIME,
  });

export const useAttendancePolicyHistory = (options = {}) =>
  useQuery({
    queryKey: attendancePolicyQueryKeys.history(),
    queryFn: fetchAttendancePolicyHistory,
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? RESOURCE_STALE_TIME,
  });

export const useCreateAttendancePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttendancePolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendancePolicyQueryKeys.all }),
  });
};

export const useUpdateAttendancePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAttendancePolicy(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendancePolicyQueryKeys.all }),
  });
};

export const useDeleteAttendancePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAttendancePolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendancePolicyQueryKeys.all }),
  });
};
