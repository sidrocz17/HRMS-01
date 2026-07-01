// src/components/leave/ApplyLeaveModal.jsx
// ─────────────────────────────────────────────
//  Apply Leave Form Modal
//  Form state: React Hook Form + Zod
//  Server state: TanStack Query mutation
//  Modal state: Zustand
// ─────────────────────────────────────────────

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useLeaveStore from "../../store/useLeaveStore";
import { useApplyLeave } from "../../hooks/mutations/useApplyLeave";
import {
  useLeaveBalance,
  useLeaveTypes,
} from "../../hooks/queries/useLeaveBalance";
import { getApiErrorMessage } from "../../utils/leaveTransformers";
import { getUserFromToken } from "../../utils/auth";
import {
  applyLeaveDefaultValues,
  applyLeaveSchema,
  LEAVE_REASON_MAX_LENGTH,
} from "../../schemas/leaveSchema";

const calculateLeaveDays = ({ fromDate, toDate, typeOfDay }) => {
  if (!fromDate || !toDate) return 0;

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    return 0;
  }

  const diffTime = Math.abs(to - from);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return typeOfDay === "half" ? 0.5 : diffDays;
};

export default function ApplyLeaveModal() {
  const { empId } = getUserFromToken();
  const closeApplyModal = useLeaveStore((state) => state.closeApplyModal);
  const { data: leaveBalance = [] } = useLeaveBalance(empId);
  const { data: leaveTypesReference = [] } = useLeaveTypes();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(applyLeaveSchema),
    defaultValues: applyLeaveDefaultValues,
    mode: "onTouched",
  });

  const [fromDate, toDate, typeOfDay, halfSelection, reason] = useWatch({
    control,
    name: ["fromDate", "toDate", "typeOfDay", "halfSelection", "reason"],
  });

  const applyLeaveMutation = useApplyLeave({
    onSuccess: () => {
      reset(applyLeaveDefaultValues);
      closeApplyModal();
    },
  });

  const leaveTypes = useMemo(() => {
    const resolveLeaveTypeName = (balanceItem) => {
      if (balanceItem.leave_type_id) {
        const matchedById = leaveTypesReference.find(
          (type) => String(type.id) === String(balanceItem.leave_type_id)
        );
        if (matchedById) return matchedById.name;
      }

      const normalizedName = String(balanceItem.leave_type || "")
        .trim()
        .toLowerCase();
      const matchedByName = leaveTypesReference.find(
        (type) => String(type.name).trim().toLowerCase() === normalizedName
      );

      return matchedByName?.name || balanceItem.leave_type;
    };

    return leaveBalance.map((item) => ({
      id: item.id,
      name: resolveLeaveTypeName(item),
    }));
  }, [leaveBalance, leaveTypesReference]);

  const days = calculateLeaveDays({ fromDate, toDate, typeOfDay });
  const isMutating = applyLeaveMutation.isPending || isSubmitting;

  const onSubmit = (values) => {
    applyLeaveMutation.mutate({
      empLeaveId: values.leaveType,
      leaveDay: values.typeOfDay === "half" ? "HALF" : "FULL",
      description: values.reason,
      noOfDays: calculateLeaveDays(values),
      startDate: values.fromDate,
      endDate: values.toDate,
    });
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !isMutating) {
      closeApplyModal();
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-300 disabled:opacity-60 disabled:cursor-not-allowed
    ${errors[field]
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-base font-bold text-gray-900">Apply Leave</h2>
            <p className="text-xs text-gray-400 mt-0.5">Submit a new leave request</p>
          </div>
          <button
            type="button"
            onClick={closeApplyModal}
            disabled={isMutating}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("leaveType")}
              className={inputClass("leaveType")}
              disabled={isMutating}
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.leaveType && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.leaveType.message}
              </p>
            )}
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Duration</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("fromDate")}
                disabled={isMutating}
                className={inputClass("fromDate")}
              />
              {errors.fromDate && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.fromDate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("toDate")}
                disabled={isMutating}
                className={inputClass("toDate")}
              />
              {errors.toDate && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.toDate.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              No. of Days
            </label>
            <input
              type="text"
              value={days}
              disabled
              readOnly
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              Type of Day <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="full"
                  {...register("typeOfDay")}
                  disabled={isMutating}
                  className="w-4 h-4 text-[#1a2240] border-gray-300 focus:ring-2 focus:ring-[#1a2240]"
                />
                <span className="text-sm text-gray-700">Full Day</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="half"
                  {...register("typeOfDay")}
                  disabled={isMutating}
                  className="w-4 h-4 text-[#1a2240] border-gray-300 focus:ring-2 focus:ring-[#1a2240]"
                />
                <span className="text-sm text-gray-700">Half Day</span>
              </label>
            </div>
          </div>

          {typeOfDay === "half" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2.5">
                Half Selection <span className="text-red-500">*</span>
              </label>
              <div className="inline-flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() =>
                    setValue("halfSelection", "first", { shouldDirty: true })
                  }
                  disabled={isMutating}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-60 ${
                    halfSelection === "first"
                      ? "bg-[#5b4ce8] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  First Half
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setValue("halfSelection", "second", { shouldDirty: true })
                  }
                  disabled={isMutating}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-60 ${
                    halfSelection === "second"
                      ? "bg-[#5b4ce8] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Second Half
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              maxLength={LEAVE_REASON_MAX_LENGTH}
              placeholder="Enter reason for leave..."
              {...register("reason")}
              disabled={isMutating}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none
                focus:ring-2 transition-all resize-none placeholder:text-gray-300 disabled:opacity-60
                ${errors.reason
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-200 focus:border-[#1a2240] focus:ring-[#1a2240]/10"
                }`}
            />
            <div className="mt-1.5 flex items-center justify-between gap-3">
              {errors.reason ? (
                <p className="text-xs text-red-500">{errors.reason.message}</p>
              ) : (
                <p className="text-xs text-gray-400">Minimum 10 characters.</p>
              )}
              <p className="text-xs text-gray-400">
                {String(reason || "").length}/{LEAVE_REASON_MAX_LENGTH}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 sticky bottom-0">
          {applyLeaveMutation.isError && (
            <p className="mr-auto text-xs font-medium text-red-600">
              {getApiErrorMessage(applyLeaveMutation.error, "Failed to apply leave")}
            </p>
          )}
          <button
            type="button"
            onClick={closeApplyModal}
            disabled={isMutating}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isMutating}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#1a2240] hover:bg-[#243055] active:scale-95 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applyLeaveMutation.isPending ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
