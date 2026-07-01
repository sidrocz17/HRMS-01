import { create } from "zustand";

const initialFilters = {
  teamSearch: "",
};

// Zustand is used here only for client/UI state that is shared across the Leave
// Management page and its feature components: filters, selected leave, selected
// approval action, and modal coordination.
//
// Server/API state such as leaves, teamLeaves, leaveBalance, loading, retries,
// stale times, and refetching belongs in TanStack Query.
const useLeaveStore = create((set) => ({
  selectedLeave: null,
  selectedAction: null,
  filters: initialFilters,
  isApplyModalOpen: false,
  isApproveModalOpen: false,
  isCancelModalOpen: false,

  setSelectedLeave: (selectedLeave) => set({ selectedLeave }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...(typeof filters === "function" ? filters(state.filters) : filters),
      },
    })),

  openApplyModal: () => set({ isApplyModalOpen: true }),
  closeApplyModal: () => set({ isApplyModalOpen: false }),

  openApproveModal: (leave, action = "approve") =>
    set({
      selectedLeave: leave || null,
      selectedAction: action,
      isApproveModalOpen: true,
    }),
  closeApproveModal: () =>
    set({
      selectedLeave: null,
      selectedAction: null,
      isApproveModalOpen: false,
    }),

  openCancelModal: (leave) =>
    set({
      selectedLeave: leave || null,
      isCancelModalOpen: true,
    }),
  closeCancelModal: () =>
    set({
      selectedLeave: null,
      isCancelModalOpen: false,
    }),

  resetFilters: () => set({ filters: initialFilters }),
}));

// Components should subscribe with selectors, for example:
// const isApplyModalOpen = useLeaveStore((state) => state.isApplyModalOpen);
// Selector-based reads keep unrelated store updates from re-rendering every
// leave component.
export default useLeaveStore;
