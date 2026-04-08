// pages/Departments.jsx

import { useState, useMemo, useEffect } from "react";
import StatusBadge    from "../components/employee/StatusBadge";
import ActionButtons  from "../components/employee/ActionButtons";
import DepartmentForm from "../components/department/DepartmentForm";
import DeleteConfirm  from "../components/department/DeleteConfirm";
import {
  createDepartment,
  deactivateDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from "../api/departmentApi";

const PAGE_SIZE = 7;

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

const normalizeDepartment = (department, index = 0) => ({
  id:          department?.id || department?.departmentId || department?.dept_id || department?.deptId || `department-${index}`,
  dept_id:     department?.deptId || department?.dept_id || department?.id || department?.departmentId || "—",
  dept_name:   department?.title || department?.deptName || department?.dept_name || "Untitled Department",
  description: department?.description || "",
  is_active:   normalizeBoolean(department?.isActive ?? department?.is_active, true),
  created_at:  department?.createdAt || department?.created_at || "",
});

export default function Departments() {
  // ── Data state ────────────────────────────────
  const [departments, setDepartments] = useState([]); // empty — GET API fills this
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
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [apiError, setApiError]     = useState("");

  // ── Load departments on page open ─────────────
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await fetchDepartments();
      console.log("✅ Departments fetched:", data);

      const departmentList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const mapped = departmentList.map((department, index) =>
        normalizeDepartment(department, index)
      );

      setDepartments((prev) => {
        const fetchedIds = new Set(mapped.map((dept) => dept.id));
        const missingLocalRows = prev.filter(
          (dept) => !fetchedIds.has(dept.id)
        );

        return [...mapped, ...missingLocalRows];
      });
    } catch (error) {
      console.error("❌ Failed to fetch departments:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered + paginated ──────────────────────
  const filtered = useMemo(() =>
    departments.filter((d) =>
      (d.dept_name  || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.description|| "").toLowerCase().includes(search.toLowerCase()) ||
      (d.dept_id    || "").toLowerCase().includes(search.toLowerCase())
    ), [departments, search]
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

  // ── Open Add modal ────────────────────────────
  const handleAdd = () => {
    setFormMode("add");
    setEditTarget(null);
    setApiError("");
    setShowForm(true);
  };

  // ── Open Edit modal ───────────────────────────
  const handleEdit = (dept) => {
    setFormMode("edit");
    setEditTarget(dept);
    setApiError("");
    setShowForm(true);
  };

  // ── Form submit ───────────────────────────────
  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    setApiError("");

    try {
      if (formMode === "add") {

        // ── 1. POST to API ─────────────────────
        const response = await createDepartment(formData);
        console.log("✅ Department created:", response);
        // response = "Department added successfully"

        // ── 2. Refresh table from GET API ──────
        await loadDepartments();
        console.log("✅ Table refreshed");

      } else {
        await updateDepartment(editTarget.id, formData);
        console.log("✅ Department updated");

        await loadDepartments();
        console.log("✅ Table refreshed");
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

  // ── Delete handlers ───────────────────────────
  const handleDeleteClick = (dept) => {
    setApiError("");
    setDeleteTarget(dept);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleteSubmitting(true);
    setApiError("");

    try {
      await deleteDepartment(deleteTarget.id);
      setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("❌ Failed to delete department:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to delete department. Please try again.";
      setApiError(message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setDeleteSubmitting(true);
    setApiError("");

    try {
      await Promise.all(selectedIds.map((id) => deleteDepartment(id)));
      setDepartments((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("❌ Failed to delete selected departments:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to delete selected departments. Please try again.";
      setApiError(message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // ── Toggle status ─────────────────────────────
  const handleToggleStatus = async (dept) => {
    if (!dept.is_active) return;

    try {
      await deactivateDepartment(dept.id);
      setDepartments((prev) =>
        prev.map((item) =>
          item.id === dept.id
            ? normalizeDepartment({ ...item, is_active: false })
            : item
        )
      );
    } catch (error) {
      console.error("❌ Failed to deactivate department:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to deactivate department. Please try again.";
      setApiError(message);
    }
  };

  // ── Pagination ────────────────────────────────
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const existingNames = departments.map((d) => d.dept_name);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Department Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and organize company departments
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Department
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, ID or description..."
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

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleteSubmitting}
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {selectedIds.length > 0 && (
          <div className="px-6 py-2.5 bg-[#1a2240]/5 border-b border-[#1a2240]/10">
            <span className="text-sm font-medium text-[#1a2240]">
              {selectedIds.length} department{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
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
                {["Dept ID", "Department Name", "Description", "Status", "Created Date", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">

              {/* Loading spinner */}
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Loading departments...</span>
                    </div>
                  </td>
                </tr>

              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-sm font-medium">No departments found</p>
                      <p className="text-xs">
                        {search ? "Try adjusting your search" : "Click 'Add Department' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>

              ) : paginated.map((dept) => {
                const isSelected = selectedIds.includes(dept.id);
                return (
                  <tr
                    key={dept.id}
                    className={`group transition-colors duration-100 ${
                      isSelected ? "bg-[#1a2240]/3" : "hover:bg-gray-50/80"
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(dept.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-[#1a2240] cursor-pointer"
                      />
                    </td>

                    {/* Dept ID */}
                    <td className="px-4 py-4">
                      <span className="text-sm font-mono font-medium text-gray-500">
                        {dept.dept_id || "—"}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1a2240]/10 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-[#1a2240]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{dept.dept_name}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4 max-w-xs">
                      <p className="text-sm text-gray-500 truncate">
                        {dept.description || <span className="text-gray-300 italic">No description</span>}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(dept)}
                        className={`focus:outline-none ${dept.is_active ? "" : "cursor-not-allowed"}`}
                        disabled={!dept.is_active}
                        title={dept.is_active ? "Deactivate department" : "Department is already inactive"}
                      >
                        <StatusBadge status={dept.is_active ? "Active" : "Inactive"} />
                      </button>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dept.created_at || "—"}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <ActionButtons
                        onView={() => {}}
                        onEdit={() => handleEdit(dept)}
                        onDelete={() => handleDeleteClick(dept)}
                        onMore={() => {}}
                      />
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
            of <span className="font-medium text-gray-700">{filtered.length}</span> departments
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
        <DepartmentForm
          mode={formMode}
          initial={editTarget}
          existingNames={existingNames}
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
          deptName={deleteTarget.dept_name}
          submitting={deleteSubmitting}
          error={apiError}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            if (!deleteSubmitting) {
              setDeleteTarget(null);
              setApiError("");
            }
          }}
        />
      )}

    </div>
  );
}
