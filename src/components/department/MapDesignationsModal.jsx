// src/components/department/MapDesignationsModal.jsx
// ─────────────────────────────────────────────
//  Maps designations to a department
//  POST /api/dept-desig
//  Payload: { deptId, desigIds: [], userId }
//
//  Props:
//    department   — { id, dept_name }
//    allDesignations — full list from fetchDesignations()
//    submitting   — boolean
//    apiError     — string
//    onSubmit     — (desigIds) => void
//    onClose      — () => void
// ─────────────────────────────────────────────

import { useState, useEffect, useMemo } from "react";

export default function MapDesignationsModal({
  department,
  allDesignations = [],
  initialSelectedIds = [],
  submitting      = false,
  apiError        = "",
  onSubmit,
  onClose,
}) {
  const [selected, setSelected] = useState([]); // array of desig IDs
  const [search, setSearch]     = useState("");
  const [error, setError]       = useState("");

  // Reset state whenever modal opens for a new dept
  useEffect(() => {
    setSelected(initialSelectedIds);
    setSearch("");
    setError("");
  }, [department?.id, initialSelectedIds]);

  if (!department) return null;

  // ── Filtered list based on search ─────────────
  const filtered = useMemo(() =>
    allDesignations.filter((d) =>
      (d.title || d.name || "").toLowerCase().includes(search.toLowerCase())
    ), [allDesignations, search]
  );

  // ── Toggle one designation ─────────────────────
  const toggle = (id) => {
    setError("");
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Toggle all visible ─────────────────────────
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((d) => selected.includes(d.id));

  const toggleAll = () => {
    const visibleIds = filtered.map((d) => d.id);
    if (allVisibleSelected) {
      setSelected((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  // ── Submit ─────────────────────────────────────
  const handleSubmit = () => {
    if (selected.length === 0) {
      setError("Select at least one designation.");
      return;
    }
    onSubmit(selected);
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Map Designations</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Assign designations to{" "}
              <span className="font-semibold text-gray-600">{department.dept_name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Search ── */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search designations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none
                focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all
                placeholder:text-gray-300"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Select all row */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-2 px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 accent-[#1a2240] cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-medium">
                  Select all {search ? "matching" : ""}
                </span>
              </label>
              {selected.length > 0 && (
                <span className="text-xs font-semibold text-[#1a2240] bg-[#1a2240]/10 px-2 py-0.5 rounded-full">
                  {selected.length} selected
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Designation list (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {allDesignations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
              <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-sm">No designations available</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 italic">
              No designations match your search
            </p>
          ) : (
            <ul className="space-y-1.5 py-2">
              {filtered.map((desig) => {
                const isChecked = selected.includes(desig.id);
                return (
                  <li key={desig.id}>
                    <label
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        isChecked
                          ? "bg-[#1a2240]/8 border border-[#1a2240]/20"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(desig.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-[#1a2240] cursor-pointer flex-shrink-0"
                      />
                      {/* Icon */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isChecked ? "bg-[#1a2240]/15 text-[#1a2240]" : "bg-gray-100 text-gray-400"
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isChecked ? "text-[#1a2240]" : "text-gray-800"}`}>
                          {desig.title || desig.name || "Untitled"}
                        </p>
                        {desig.description && (
                          <p className="text-xs text-gray-400 truncate">{desig.description}</p>
                        )}
                      </div>
                      {isChecked && (
                        <svg className="w-4 h-4 text-[#1a2240] ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Validation error ── */}
        {(error || apiError) && (
          <div className="px-6 pt-1 flex-shrink-0">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd" />
              </svg>
              {error || apiError}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selected.length === 0}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm ${
              submitting || selected.length === 0
                ? "bg-[#1a2240]/50 cursor-not-allowed"
                : "bg-[#1a2240] hover:bg-[#243055] active:scale-95"
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              `Map ${selected.length > 0 ? `(${selected.length})` : ""} Designation${selected.length !== 1 ? "s" : ""}`
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
