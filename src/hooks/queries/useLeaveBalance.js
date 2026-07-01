import { useQuery } from "@tanstack/react-query";
import { fetchLeaveBalance, fetchLeaveSummary } from "../../api/leaveApi";
import { fetchLeaveTypes } from "../../api/leaveTypeApi";
import {
  normalizeLeaveBalance,
  normalizeLeaveTypes,
} from "../../utils/leaveTransformers";
import { leaveQueryKeys } from "./leaveQueryKeys";

const BALANCE_STALE_TIME = 2 * 60 * 1000;
const REFERENCE_STALE_TIME = 10 * 60 * 1000;

export const useLeaveBalance = (employeeId, options = {}) =>
  useQuery({
    queryKey: leaveQueryKeys.balanceByEmployee(employeeId),
    queryFn: () => fetchLeaveBalance(employeeId),
    enabled: Boolean(employeeId) && options.enabled !== false,
    staleTime: options.staleTime ?? BALANCE_STALE_TIME,
    select: normalizeLeaveBalance,
  });

export const useLeaveSummary = (options = {}) =>
  useQuery({
    queryKey: leaveQueryKeys.summary(),
    queryFn: fetchLeaveSummary,
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? BALANCE_STALE_TIME,
  });

export const useLeaveTypes = (options = {}) =>
  useQuery({
    queryKey: leaveQueryKeys.types(),
    queryFn: fetchLeaveTypes,
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? REFERENCE_STALE_TIME,
    select: normalizeLeaveTypes,
  });
