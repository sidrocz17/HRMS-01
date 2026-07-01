import { create } from "zustand";

const getTodayDate = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
};

const initialFilters = {
  search: "",
  status: "",
};

const useAttendanceStore = create((set) => ({
  selectedDate: getTodayDate(),
  filters: initialFilters,

  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...(typeof filters === "function" ? filters(state.filters) : filters),
      },
    })),
  resetFilters: () =>
    set({
      selectedDate: getTodayDate(),
      filters: initialFilters,
    }),
}));

export default useAttendanceStore;
