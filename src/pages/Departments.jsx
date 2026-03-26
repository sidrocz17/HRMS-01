// pages/Departments.jsx
// ─────────────────────────────────────────────
//  Department Management — full CRUD
//  RBAC: admin only
//  UI matches Employee page exactly
// ─────────────────────────────────────────────

import { useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import StatusBadge    from "../components/employee/StatusBadge";
import ActionButtons  from "../components/employee/ActionButtons";
import DepartmentForm from "../components/department/DepartmentForm";
import DeleteConfirm  from "../components/department/DeleteConfirm";

// ── Mock seed data ─────────────────────────────
const SEED = [
  { id: uuidv4(), dept_id: "DEPT-001", dept_name: "Engineering",       description: "Product development and infrastructure.",         is_active: true,  created_at: "12 Dec, 2023" },
  { id: uuidv4(), dept_id: "DEPT-002", dept_name: "Human Resources",   description: "Recruitment, culture and employee relations.",    is_active: true,  created_at: "10 Dec, 2023" },
  { id: uuidv4(), dept_id: "DEPT-003", dept_name: "Finance",           description: "Budgeting, payroll and financial reporting.",     is_active: true,  created_at: "08 Dec, 2023" },
  { id: uuidv4(), dept_id: "DEPT-004", dept_name: "Marketing",         description: "Brand strategy and digital campaigns.",          is_active: false, created_at: "05 Dec, 2023" },
  { id: uuidv4(), dept_id: "DEPT-005", dept_name: "Sales",             description: "Revenue generation and client management.",       is_active: true,  created_at: "01 Dec, 2023" },
  { id: uuidv4(), dept_id: "DEPT-006", dept_name: "Design",            description: "UI/UX design and brand identity.",               is_active: true,  created_at: "28 Nov, 2023" },
  { id: uuidv4(), dept_id: "DEPT-007", dept_name: "Customer Support",  description: "Post-sales support and customer success.",       is_active: false, created_at: "20 Nov, 2023" },
  { id: uuidv4(), dept_id: "DEPT-008", dept_name: "Legal",             description: "Contracts, compliance and regulatory affairs.",  is_active: true,  created_at: "15 Nov, 2023" },
];

// ── Page size ─────────────────────────────────
const PAGE_SIZE = 7;

export default function Departments() {
  const [departments, setDepartments] = useState(SEED);
  const [search, setSearch]           = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal state ───────────────────────────────
  const [showForm, setShowForm]           = useState(false);
  const [formMode, setFormMode]           = useState("add");   // "add" | "edit"
  const [editTarget, setEditTarget]       = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);    // dept object

  // ── Filtered list ─────────────────────────────
  const filtered = useMemo(() =>
    departments.filter((d) =>
      d.dept_name.toLowerCase().includes(search.toLowerCase()) ||
      d.dept_id.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
    ), [departments, search]
  );

  // ── Paginated slice ───────────────────────────
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

  // Add
  const handleAdd = () => {
    setFormMode("add");
    setEditTarget(null);
    setShowForm(true);
  };

  // Edit
  const handleEdit = (dept) => {
    setFormMode("edit");
    setEditTarget(dept);
    setShowForm(true);
  };

  // Form submit (add or edit)
  const handleFormSubmit = (formData) => {
    const now = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });

    if (formMode === "add") {
      const newDept = {
        id:          uuidv4(),
        dept_id:     formData.dept_id,
        dept_name:   formData.dept_name,
        description: formData.description,
        is_active:   formData.is_active,
        created_at:  now,
      };
      setDepartments((prev) => [newDept, ...prev]);
    } else {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editTarget.id
            ? { ...d, ...formData, updated_at: now }
            : d
        )
      );
    }
    setShowForm(false);
    setCurrentPage(1);
  };

  // Delete — show confirm dialog
  const handleDeleteClick = (dept) => setDeleteTarget(dept);

  // Delete — confirmed
  const handleDeleteConfirm = () => {
    setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // Bulk delete
  const handleBulkDelete = () => {
    setDepartments((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
    setSelectedIds([]);
  };

  // Toggle active/inactive
  const handleToggleStatus = (id) => {
    setDepartments((prev) =>
      prev.map((d) => d.id === id ? { ...d, is_active: !d.is_active } : d)
    );
  };

  // ── Pagination page numbers ───────────────────
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  // ── Existing names for duplicate check ────────
  const existingNames = departments.map((d) => d.dept_name);
  const existingDeptIds = departments.map((d) => d.dept_id);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">

      {/* ── Page Header ── */}
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

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search departments..."
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

          {/* Bulk delete */}
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

          {/* Filter */}
          <button className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl transition-all">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filter
          </button>

          {/* Export */}
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
          <div className="px-6 py-2.5 bg-[#1a2240]/5 border-b border-[#1a2240]/10 flex items-center gap-2">
            <span className="text-sm font-medium text-[#1a2240]">
              {selectedIds.length} department{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">

            {/* ── Head ── */}
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
                {["Department Name", "Description", "Status", "Created Date", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* ── Body ── */}
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (

                /* Empty state */
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
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
                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(dept.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-[#1a2240] cursor-pointer"
                      />
                    </td>

                    {/* Dept Name */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1a2240]/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#1a2240]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">
                            {dept.dept_name}
                          </p>
                          <p className="text-xs font-medium text-gray-400">
                            {dept.dept_id}
                          </p>
                        </div>
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
                        onClick={() => handleToggleStatus(dept.id)}
                        title="Click to toggle status"
                        className="focus:outline-none"
                      >
                        <StatusBadge status={dept.is_active ? "Active" : "Inactive"} />
                      </button>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dept.created_at}
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
            {/* Prev */}
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

            {/* Page numbers */}
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

            {/* Next */}
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
          existingDeptIds={existingDeptIds}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          deptName={deleteTarget.dept_name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

    </div>
  );
}
