// src/pages/LeaveTypes.jsx
// ─────────────────────────────────────────────
//  Leave Type Management — full CRUD
//  RBAC: admin only
//  UI matches Designation page exactly
// ─────────────────────────────────────────────

import { useState, useMemo, useEffect } from "react";
import StatusBadge   from "../components/employee/StatusBadge";
import LeaveTypeForm from "../components/leavetype/LeaveTypeForm";
import DeleteConfirm from "../components/leavetype/DeleteConfirm";
import { createLeaveType, fetchLeaveTypes } from "../api/leaveTypeApi";

const PAGE_SIZE = 8;

// ── Boolean badge ─────────────────────────────
const BoolBadge = ({ value }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
    value
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : "bg-gray-50 text-gray-500 ring-1 ring-gray-200"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${value ? "bg-emerald-400" : "bg-gray-400"}`} />
    {value ? "Yes" : "No"}
  </span>
);

// ── Tooltip wrapper ────────────────────────────
const Tooltip = ({ text, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-10">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
    </div>
  </div>
);

export default function LeaveTypes() {
  // ── RBAC check ────────────────────────────────
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = localStorage.getItem("role") || user?.role || "";

  // ── Data state ────────────────────────────────
  const [leaveTypes, setLeaveTypes]   = useState([]);
  const [search, setSearch]           = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal state ───────────────────────────────
  const [showForm, setShowForm]         = useState(false);
  const [formMode, setFormMode]         = useState("add");
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── API state ─────────────────────────────────
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState("");

  // ── Load on mount ─────────────────────────────
  useEffect(() => {
    if (role === "admin") loadLeaveTypes();
  }, []);

  const loadLeaveTypes = async () => {
    setLoading(true);
    try {
      const data = await fetchLeaveTypes();
      console.log("✅ Leave types fetched:", data);

      // Map API fields → local fields
      const mapped = data.map((d) => ({
        id:                      d.typeId        || d.id             || d.type_id,
        type:                    d.type          || d.leaveType      || "",
        max_consecutive_days:    d.maxConsecutiveDays || d.max_consecutive_days || 0,
        carry_forward_allowed:   d.carryForwardAllowed  ?? d.carry_forward_allowed  ?? false,
        post_application_allowed: d.postApplicationAllowed ?? d.post_application_allowed ?? false,
      }));

      setLeaveTypes(mapped);
    } catch (error) {
      console.error("❌ Failed to fetch leave types:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered + paginated ──────────────────────
  const filtered = useMemo(() =>
    leaveTypes.filter((d) =>
      (d.type || "").toLowerCase().includes(search.toLowerCase())
    ), [leaveTypes, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Bulk select ───────────────────────────────
  const allSelected = paginated.length > 0 && paginated.every((d) => selectedIds.includes(d.id));

  const toggleAll = () =>
    setSelectedIds(allSelected
      ? selectedIds.filter((id) => !paginated.find((d) => d.id === id))
      : [...new Set([...selectedIds, ...paginated.map((d) => d.id)])]
    );

  const toggleOne = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // ── CRUD handlers ─────────────────────────────
  const handleAdd = () => {
    setFormMode("add");
    setEditTarget(null);
    setApiError("");
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setFormMode("edit");
    setEditTarget(item);
    setApiError("");
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    setApiError("");

    try {
      if (formMode === "add") {
        const response = await createLeaveType(formData);
        console.log("✅ Leave type created:", response);
        await loadLeaveTypes();
      } else {
        // Edit — local update until PUT API ready
        setLeaveTypes((prev) =>
          prev.map((d) => d.id === editTarget.id ? { ...d, ...formData } : d)
        );
      }

      setShowForm(false);
      setCurrentPage(1);

    } catch (error) {
      console.error("❌ API Error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error   ||
        "Something went wrong. Please try again.";
      setApiError(message);

    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick   = (item) => setDeleteTarget(item);
  const handleDeleteConfirm = () => {
    setLeaveTypes((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleBulkDelete = () => {
    setLeaveTypes((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
    setSelectedIds([]);
  };

  // ── Pagination ────────────────────────────────
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const existingTypes = leaveTypes.map((d) => d.type);

  // ── Access Denied ─────────────────────────────
  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2M10 9h2M4 6h16M4 6l1 12a2 2 0 002 2h10a2 2 0 002-2L20 6" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Access Denied</h2>
          <p className="text-sm text-gray-500">You don't have permission to view this page.</p>
          <p className="text-xs text-gray-400 mt-1">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Leave Type Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure and manage leave types for your organization
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Leave Type
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search leave types..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none
              focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10 transition-all placeholder:text-gray-300"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Right toolbar */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-all border border-red-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete ({selectedIds.length})
            </button>
          )}

          <button className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl transition-all">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>

      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Selected bar */}
        {selectedIds.length > 0 && (
          <div className="px-6 py-2.5 bg-[#1a2240]/5 border-b border-[#1a2240]/10">
            <span className="text-sm font-medium text-[#1a2240]">
              {selectedIds.length} leave type{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">

            {/* Head */}
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="w-12 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 accent-[#1a2240] cursor-pointer"
                  />
                </th>
                {["Leave Type", "Max Days", "Carry Forward", "Post Application", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-50">

              {/* Loading */}
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Loading leave types...</span>
                    </div>
                  </td>
                </tr>

              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-medium">No leave types found</p>
                      <p className="text-xs">
                        {search ? "Try adjusting your search" : "Click 'Add Leave Type' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>

              ) : paginated.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`group transition-colors duration-100 ${
                      isSelected ? "bg-[#1a2240]/3" : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(item.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-[#1a2240] cursor-pointer"
                      />
                    </td>

                    {/* Leave Type */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1a2240]/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#1a2240]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{item.type}</span>
                      </div>
                    </td>

                    {/* Max Days */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                        {item.max_consecutive_days} days
                      </span>
                    </td>

                    {/* Carry Forward */}
                    <td className="px-4 py-4">
                      <BoolBadge value={item.carry_forward_allowed} />
                    </td>

                    {/* Post Application */}
                    <td className="px-4 py-4">
                      <BoolBadge value={item.post_application_allowed} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">

                        {/* Edit */}
                        <Tooltip text="Edit">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </Tooltip>

                        {/* Delete */}
                        <Tooltip text="Delete">
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </Tooltip>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-medium text-gray-700">{filtered.length}</span> leave types
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>

            {getPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span key={`e-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 text-sm font-medium rounded-lg transition-all ${
                    currentPage === page
                      ? "bg-[#1a2240] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {showForm && (
        <LeaveTypeForm
          mode={formMode}
          initial={editTarget}
          existingTypes={existingTypes}
          submitting={submitting}
          apiError={apiError}
          onSubmit={handleFormSubmit}
          onClose={() => {
            if (!submitting) {
              setShowForm(false);
              setApiError("");
            }
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          itemName={deleteTarget.type}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

    </div>
  );
}
