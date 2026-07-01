import { create } from "zustand";

const initialFilters = {
  status: "active",
};

const useEmployeeStore = create((set) => ({
  employees: [],
  selectedEmployee: null,
  filters: initialFilters,
  search: "",
  isDeactivateModalOpen: false,

  setEmployees: (employees) =>
    set((state) => ({
      employees:
        typeof employees === "function" ? employees(state.employees) : employees,
    })),
  setSelectedEmployee: (selectedEmployee) => set({ selectedEmployee }),
  setSearch: (search) => set({ search }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...(typeof filters === "function" ? filters(state.filters) : filters),
      },
    })),

  openDeactivateModal: (employee) =>
    set({
      selectedEmployee: employee || null,
      isDeactivateModalOpen: true,
    }),
  closeDeactivateModal: () =>
    set({
      selectedEmployee: null,
      isDeactivateModalOpen: false,
    }),

  resetFilters: () =>
    set({
      filters: initialFilters,
      search: "",
    }),
  resetEmployeeState: () =>
    set({
      employees: [],
      selectedEmployee: null,
      filters: initialFilters,
      search: "",
      isDeactivateModalOpen: false,
    }),
}));

export default useEmployeeStore;
