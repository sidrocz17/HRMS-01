// pages/Designations.jsx
// ─────────────────────────────────────────────
//  Designation Management — full CRUD
//  RBAC: admin only
//  UI matches Department page exactly
// ─────────────────────────────────────────────

import { useEffect, useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import StatusBadge      from "../components/employee/StatusBadge";
import DesignationForm  from "../components/designation/DesignationForm";
import DeleteConfirm    from "../components/designation/DeleteConfirm";
import {
  createDesignation,
  fetchDesignations,
  updateDesignation,
} from "../api/designationApi";

const PAGE_SIZE = 8;

const normalizeBoolean = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
};

const normalizeDesignation = (designation, index = 0) => ({
  id:
    designation?.id ||
    designation?.designationId ||
    designation?.designation_id ||
    `designation-${index}`,
  title:
    designation?.title ||
    designation?.designationName ||
    designation?.name ||
    "Untitled Designation",
  description: designation?.description || "",
  is_active: normalizeBoolean(
    designation?.isActive ?? designation?.is_active,
    true
  ),
  created_at: designation?.createdAt || designation?.created_at || "",
  updated_at: designation?.updatedAt || designation?.updated_at || "",
});

// ── Icon for designation rows ─────────────────
const DesignationIcon = () => (
  <svg className="w-4 h-4 text-[#1a2240]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function Designations() {
  const [designations, setDesignations] = useState([]);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"
  const [selectedIds, setSelectedIds]   = useState([]);
  const [currentPage, setCurrentPage]   = useState(1);

  // ── Modal state ───────────────────────────────
  const [showForm, setShowForm]         = useState(false);
  const [formMode, setFormMode]         = useState("add");
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [apiError, setApiError]         = useState("");

  useEffect(() => {
    loadDesignations();
  }, []);

  const loadDesignations = async () => {
    setLoading(true);

    try {
      const data = await fetchDesignations();
      console.log("✅ Designations fetched:", data);

      const designationList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const mapped = designationList.map((designation, index) =>
        normalizeDesignation(designation, index)
      );

      setDesignations((prev) => {
        const fetchedIds = new Set(mapped.map((designation) => designation.id));
        const missingLocalRows = prev.filter(
          (designation) => !fetchedIds.has(designation.id)
        );

        return [...mapped, ...missingLocalRows];
      });
    } catch (error) {
      console.error("❌ Failed to fetch designations:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered + paginated ──────────────────────
  const filtered = useMemo(() =>
    designations.filter((d) => {
      const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ? true :
        statusFilter === "active" ? d.is_active :
        !d.is_active;
      return matchSearch && matchStatus;
    }), [designations, search, statusFilter]
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

  // ── CRUD ──────────────────────────────────────
  const handleAdd = () => {
    setFormMode("add");
    setEditTarget(null);
    setApiError("");
    setShowForm(true);
  };

  const handleEdit = (d) => {
    setFormMode("edit");
    setEditTarget(d);
    setApiError("");
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    setApiError("");

    const now = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });

    try {
      if (formMode === "add") {
        const response = await createDesignation(formData);
        const createdDesignation = response?.data || response;

        setDesignations((prev) => [{
          id: createdDesignation?.id || createdDesignation?.designationId || uuidv4(),
          title: createdDesignation?.title || createdDesignation?.designationName || formData.title,
          description: createdDesignation?.description || formData.description,
          is_active:
            createdDesignation?.isActive ??
            createdDesignation?.is_active ??
            formData.is_active,
          created_at: createdDesignation?.createdAt || createdDesignation?.created_at || now,
          updated_at: createdDesignation?.updatedAt || createdDesignation?.updated_at || now,
        }, ...prev]);
      } else {
        const response = await updateDesignation(editTarget.id, formData);
        const updatedDesignation = response?.data || response;

        setDesignations((prev) =>
          prev.map((d) =>
            d.id === editTarget.id
              ? {
                  ...d,
                  title:
                    updatedDesignation?.title ||
                    updatedDesignation?.designationName ||
                    formData.title,
                  description:
                    updatedDesignation?.description ?? formData.description,
                  is_active:
                    updatedDesignation?.isActive ??
                    updatedDesignation?.is_active ??
                    formData.is_active,
                  updated_at:
                    updatedDesignation?.updatedAt ||
                    updatedDesignation?.updated_at ||
                    now,
                }
              : d
          )
        );
      }

      setShowForm(false);
      setCurrentPage(1);
    } catch (error) {
      console.error("❌ Failed to save designation:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to save designation. Please try again.";
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick   = (d) => setDeleteTarget(d);
  const handleDeleteConfirm = () => {
    setDesignations((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleBulkDelete = () => {
    setDesignations((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
    setSelectedIds([]);
  };

  const handleToggleStatus = (id) =>
    setDesignations((prev) =>
      prev.map((d) => d.id === id ? { ...d, is_active: !d.is_active } : d)
    );

  // ── Pagination ────────────────────────────────
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const existingTitles = designations.map((d) => d.title);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Designation Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage job titles and designations across your organization
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Designation
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">

        {/* Left — search + status filter */}
        <div className="flex items-center gap-3 flex-1">

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search designations..."
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

          {/* Status filter pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { value: "all",      label: "All" },
              { value: "active",   label: "Active" },
              { value: "inactive", label: "Inactive" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === f.value
                    ? "bg-white text-[#1a2240] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>

        {/* Right — bulk delete */}
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
        </div>

      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Selected bar */}
        {selectedIds.length > 0 && (
          <div className="px-6 py-2.5 bg-[#1a2240]/5 border-b border-[#1a2240]/10">
            <span className="text-sm font-medium text-[#1a2240]">
              {selectedIds.length} designation{selectedIds.length > 1 ? "s" : ""} selected
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
                {["Title", "Description", "Status", "Created At", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Loading designations...</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-sm font-medium">No designations found</p>
                      <p className="text-xs">
                        {search ? "Try adjusting your search" : "Click 'Add Designation' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((d) => {
                const isSelected = selectedIds.includes(d.id);
                return (
                  <tr
                    key={d.id}
                    className={`group transition-colors duration-100 ${
                      isSelected ? "bg-[#1a2240]/3" : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(d.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-[#1a2240] cursor-pointer"
                      />
                    </td>

                    {/* Title */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1a2240]/10 flex items-center justify-center flex-shrink-0">
                          <DesignationIcon />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                          {d.title}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4 max-w-xs">
                      <p className="text-sm text-gray-500 truncate">
                        {d.description || <span className="text-gray-300 italic">No description</span>}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(d.id)}
                        title="Click to toggle status"
                        className="focus:outline-none"
                      >
                        <StatusBadge status={d.is_active ? "Active" : "Inactive"} />
                      </button>
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {d.created_at}
                      </div>
                    </td>

                    {/* Updated At */}
                    {/* <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {d.updated_at}
                      </div>
                    </td> */}

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">

                        {/* Edit */}
                        <div className="relative group">
                          <button
                            onClick={() => handleEdit(d)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-10">
                            Edit
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                          </div>
                        </div>

                        {/* Delete */}
                        <div className="relative group">
                          <button
                            onClick={() => handleDeleteClick(d)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-10">
                            Delete
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                          </div>
                        </div>

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
            of <span className="font-medium text-gray-700">{filtered.length}</span> designations
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
        <DesignationForm
          mode={formMode}
          initial={editTarget}
          existingTitles={existingTitles}
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
          itemName={deleteTarget.title}
          itemType="Designation"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

    </div>
  );
}
