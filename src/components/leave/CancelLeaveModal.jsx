import useLeaveStore from "../../store/useLeaveStore";
import { useCancelLeave } from "../../hooks/mutations/useCancelLeave";
import { getApiErrorMessage } from "../../utils/leaveTransformers";

export default function CancelLeaveModal() {
  const leave = useLeaveStore((state) => state.selectedLeave);
  const closeCancelModal = useLeaveStore((state) => state.closeCancelModal);
  const cancelMutation = useCancelLeave({
    onSuccess: () => closeCancelModal(),
  });

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !cancelMutation.isPending) {
      closeCancelModal();
    }
  };

  if (!leave) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Cancel Leave Request</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              This will remove the pending request from approval.
            </p>
          </div>
          <button
            onClick={closeCancelModal}
            disabled={cancelMutation.isPending}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Leave Type</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{leave.leave_type}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">From</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{leave.from_date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">To</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{leave.to_date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Days</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{leave.days}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          {cancelMutation.isError && (
            <p className="mr-auto text-xs font-medium text-red-600">
              {getApiErrorMessage(cancelMutation.error, "Failed to cancel leave")}
            </p>
          )}
          <button
            onClick={closeCancelModal}
            disabled={cancelMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Keep Request
          </button>
          <button
            onClick={() => cancelMutation.mutate(leave.id)}
            disabled={cancelMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelMutation.isPending ? "Cancelling..." : "Cancel Leave"}
          </button>
        </div>
      </div>
    </div>
  );
}
