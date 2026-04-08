// src/pages/LeavePolicy.jsx
// ─────────────────────────────────────────────
//  Leave Policy Management — full CRUD
//  RBAC: admin only
//  UI matches Department / Designation / LeaveType pages
// ─────────────────────────────────────────────

import { useState, useMemo, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import LeavePolicyForm, { deriveYearDates } from "../components/leavepolicy/LeavePolicyForm";
import DeleteConfirm                         from "../components/leavepolicy/DeleteConfirm";
import {
  createLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
  fetchLeavePolicies,
  fetchLeaveTypes,
  fetchEmployeeTypes,
} from "../api/leavePolicyApi";

const PAGE_SIZE = 8;

// ── Tooltip ───────────────────────────────────
const Tooltip = ({ text, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800
      text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity
      duration-150 whitespace-nowrap pointer-events-none z-10">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
    </div>
  </div>
);

// ── Helper: derive FY label from dates ────────
const getFYLabel = (start_date) => {
  if (!start_date) return "—";
  const year = new Date(start_date).getFullYear();
  return `${year}-${String(year + 1).slice(-2)}`;
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const mapOption = (item = {}, idKeys = [], labelKeys = []) => ({
  id: idKeys.map((key) => item?.[key]).find(Boolean) || "",
  label: labelKeys.map((key) => item?.[key]).find(Boolean) || "",
});

const mapLeaveTypeOption = (item) =>
  mapOption(item, ["id", "typeId", "type_id"], ["name", "title", "type", "leaveType"]);

const mapEmployeeTypeOption = (item) =>
  mapOption(item, ["id", "employeeTypeId", "employee_type_id"], ["name", "title", "type", "employeeType"]);

const mapPolicyItem = (d = {}) => ({
  id: d.policyId || d.id || d.policy_id || uuidv4(),
  type_id: d.typeId || d.type_id || "",
  employee_type_id: d.employeeTypeId || d.employee_type_id || "",
  no_of_days: d.noOfDays ?? d.no_of_days ?? 0,
  start_date: d.startDate || d.start_date || "",
  end_date: d.endDate || d.end_date || "",
  financial_year: getFYLabel(d.startDate || d.start_date),
  leave_type_label: d.leaveTypeName || d.name || d.title || d.type || "",
  employee_type_label: d.employeeTypeName || d.employeeType || d.name || d.title || "",
});

const decodeJwtPayload = (token) => {
  try {
    const [, payload = ""] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const getCreatedBy = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    const tokenPayload = token ? decodeJwtPayload(token) : null;

    return (
      user.id ||
      user.userId ||
      user.uuid ||
      user.employeeId ||
      user.empId ||
      user.user_id ||
      tokenPayload?.userId ||
      tokenPayload?.id ||
      tokenPayload?.sub ||
      tokenPayload?.uid ||
      ""
    );
  } catch {
    return "";
  }
};

const getFinancialYearDates = (financialYear) => {
  const normalizedYear = String(financialYear || "").trim();

  if (!normalizedYear) {
    return { startDate: "", endDate: "" };
  }

  const [rawStartYear = "", rawEndYear = ""] = normalizedYear.split("-");
  const startYear = rawStartYear.trim();
  const endSuffix = rawEndYear.trim();

  if (!startYear || !endSuffix) {
    return { startDate: "", endDate: "" };
  }

  const endYear =
    endSuffix.length === 2 ? `${startYear.slice(0, 2)}${endSuffix}` : endSuffix;

  return {
    startDate: `${startYear}-04-01`,
    endDate: `${endYear}-03-31`,
  };
};

export default function LeavePolicy() {
  // ── RBAC ──────────────────────────────────────
  const role = localStorage.getItem("role") || "";

  // ── Data state ────────────────────────────────
  const [policies, setPolicies]         = useState([]);
  const [leaveTypes, setLeaveTypes]     = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [search, setSearch]             = useState("");
  const [selectedIds, setSelectedIds]   = useState([]);
  const [currentPage, setCurrentPage]   = useState(1);

  // ── Modal state ───────────────────────────────
  const [showForm, setShowForm]         = useState(false);
  const [formMode, setFormMode]         = useState("add");
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── API state ─────────────────────────────────
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState("");

  // ── Load all data on mount ────────────────────
  useEffect(() => {
    if (role === "admin") {
      loadAll();
    }
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setApiError("");

    try {
      const [policiesResult, leaveTypesResult, employeeTypesResult] = await Promise.allSettled([
        fetchLeavePolicies(),
        fetchLeaveTypes(),
        fetchEmployeeTypes(),
      ]);

      if (leaveTypesResult.status === "fulfilled") {
        console.log("✅ Leave types:", leaveTypesResult.value);
        setLeaveTypes(
          toArray(leaveTypesResult.value)
            .map(mapLeaveTypeOption)
            .filter((item) => item.id)
        );
      } else {
        console.error("❌ Failed to load leave types:", leaveTypesResult.reason);
      }

      if (employeeTypesResult.status === "fulfilled") {
        console.log("✅ Employee types:", employeeTypesResult.value);
        setEmployeeTypes(
          toArray(employeeTypesResult.value)
            .map(mapEmployeeTypeOption)
            .filter((item) => item.id)
        );
      } else {
        console.error("❌ Failed to load employee types:", employeeTypesResult.reason);
      }

      if (policiesResult.status === "fulfilled") {
        console.log("✅ Policies:", policiesResult.value);
        setPolicies(toArray(policiesResult.value).map(mapPolicyItem));
      } else {
        console.error("❌ Failed to load policies:", policiesResult.reason);
        setPolicies([]);
      }

      if (
        leaveTypesResult.status === "rejected" &&
        employeeTypesResult.status === "rejected"
      ) {
        const error = employeeTypesResult.reason || leaveTypesResult.reason;
        setApiError(
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load form dropdown data."
        );
      } else if (policiesResult.status === "rejected") {
        setApiError(
          policiesResult.reason?.response?.data?.message ||
          policiesResult.reason?.response?.data?.error ||
          "Leave policies could not be loaded, but you can still add a policy."
        );
      }
    } catch (error) {
      console.error("❌ Unexpected load error:", error);
      setApiError("Failed to load leave policy data.");
    } finally {
      setLoading(false);
    }
  };

  const loadPolicies = async () => {
    try {
      const data = await fetchLeavePolicies();
      setPolicies(toArray(data).map(mapPolicyItem));
    } catch (error) {
      console.error("❌ Failed to refresh policies:", error);
    }
  };

  // ── Helper: resolve labels from IDs ──────────
  const resolveLabel = (id, list) =>
    list.find((i) => String(i.id) === String(id))?.label || id || "—";

  // ── Filtered + paginated ──────────────────────
  const filtered = useMemo(() =>
    policies.filter((p) => {
      const ltLabel  = p.leave_type_label    || resolveLabel(p.type_id, leaveTypes);
      const etLabel  = p.employee_type_label || resolveLabel(p.employee_type_id, employeeTypes);
      const fyLabel  = p.financial_year      || "";
      const q = search.toLowerCase();
      return ltLabel.toLowerCase().includes(q) ||
             etLabel.toLowerCase().includes(q) ||
             fyLabel.toLowerCase().includes(q);
    }), [policies, search, leaveTypes, employeeTypes]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Bulk select ───────────────────────────────
  const allSelected = paginated.length > 0 && paginated.every((p) => selectedIds.includes(p.id));

  const toggleAll = () =>
    setSelectedIds(allSelected
      ? selectedIds.filter((id) => !paginated.find((p) => p.id === id))
      : [...new Set([...selectedIds, ...paginated.map((p) => p.id)])]
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

  const handleEdit = (policy) => {
    setFormMode("edit");
    setEditTarget(policy);
    setApiError("");
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    setApiError("");

    try {
      const typeId = formData?.type_id || "";
      const employeeTypeId = formData?.employee_type_id || "";
      const noOfDays = Number(formData?.no_of_days);
      const { startDate, endDate } = getFinancialYearDates(formData?.financial_year);
      const createdBy = getCreatedBy();

      if (!typeId || !employeeTypeId || !formData?.financial_year || !Number.isFinite(noOfDays) || noOfDays <= 0) {
        setApiError("All fields are required.");
        return;
      }

      if (!startDate || !endDate) {
        setApiError("Invalid financial year selected.");
        return;
      }

      if (!createdBy) {
        setApiError("Unable to identify the current user.");
        return;
      }

      const body = {
        typeId,
        employeeTypeId,
        noOfDays,
        startDate,
        endDate,
        createdBy,
      };

      if (formMode === "add") {
        await createLeavePolicy(body);
        console.log("✅ Policy created");
        await loadPolicies();
      } else {
        if (!editTarget?.id) {
          setApiError("Unable to identify the policy to update.");
          return;
        }

        await updateLeavePolicy(editTarget.id, body);
        console.log("✅ Policy updated");
        await loadPolicies();
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

  const handleDeleteClick   = (policy) => setDeleteTarget(policy);
  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) {
      setApiError("Unable to identify the policy to delete.");
      return;
    }

    try {
      setApiError("");
      await deleteLeavePolicy(deleteTarget.id);
      await loadPolicies();
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("❌ Delete API Error:", error);
      setApiError(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to delete leave policy."
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      setApiError("");
      await Promise.all(selectedIds.map((id) => deleteLeavePolicy(id)));
      await loadPolicies();
      setSelectedIds([]);
    } catch (error) {
      console.error("❌ Bulk delete API Error:", error);
      setApiError(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to delete selected leave policies."
      );
    }
  };

  // ── Pagination ────────────────────────────────
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  // ── Existing keys for duplicate detection ─────
  const existingKeys = policies.map(
    (p) => `${p.type_id}_${p.employee_type_id}_${p.financial_year}`
  );

  // ── Access Denied ─────────────────────────────
  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
            Leave Policy Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define leave entitlements by employee type and financial year
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#1a2240] hover:bg-[#243055] active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Policy
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">

        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by leave type, employee type or year..."
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

        {selectedIds.length > 0 && (
          <div className="px-6 py-2.5 bg-[#1a2240]/5 border-b border-[#1a2240]/10">
            <span className="text-sm font-medium text-[#1a2240]">
              {selectedIds.length} polic{selectedIds.length > 1 ? "ies" : "y"} selected
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
                {["Leave Type", "Employee Type", "No. of Days", "Financial Year", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

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
                      <span className="text-sm">Loading policies...</span>
                    </div>
                  </td>
                </tr>

              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium">No leave policies found</p>
                      <p className="text-xs">
                        {search ? "Try adjusting your search" : "Click 'Add Policy' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>

              ) : paginated.map((policy) => {
                const isSelected    = selectedIds.includes(policy.id);
                const ltLabel       = policy.leave_type_label    || resolveLabel(policy.type_id, leaveTypes);
                const etLabel       = policy.employee_type_label || resolveLabel(policy.employee_type_id, employeeTypes);
                const fyLabel       = policy.financial_year      || getFYLabel(policy.start_date);

                return (
                  <tr
                    key={policy.id}
                    className={`group transition-colors duration-100 ${
                      isSelected ? "bg-[#1a2240]/3" : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(policy.id)}
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
                        <span className="text-sm font-semibold text-gray-800">{ltLabel}</span>
                      </div>
                    </td>

                    {/* Employee Type */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 ring-1 ring-violet-200">
                        {etLabel}
                      </span>
                    </td>

                    {/* No. of Days */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                        {policy.no_of_days} days
                      </span>
                    </td>

                    {/* Financial Year */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{fyLabel}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Tooltip text="Edit">
                          <button
                            onClick={() => handleEdit(policy)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </Tooltip>
                        <Tooltip text="Delete">
                          <button
                            onClick={() => handleDeleteClick(policy)}
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
            of <span className="font-medium text-gray-700">{filtered.length}</span> policies
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
        <LeavePolicyForm
          mode={formMode}
          initial={editTarget}
          leaveTypes={leaveTypes}
          employeeTypes={employeeTypes}
          existingKeys={existingKeys}
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
          itemName={
            (deleteTarget.leave_type_label || resolveLabel(deleteTarget.type_id, leaveTypes)) +
            " — " +
            (deleteTarget.employee_type_label || resolveLabel(deleteTarget.employee_type_id, employeeTypes))
          }
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

    </div>
  );
}
