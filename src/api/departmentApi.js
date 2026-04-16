// src/api/departmentApi.js

import axios from "axios";
import { buildApiUrl } from "./apiBase";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── POST /department ──────────────────────────
export const createDepartment = async (formData) => {
  const body = {
    deptName:    formData.dept_name,
    description: formData.description,
    isActive:    String(formData.is_active),
  };

  console.log("📤 Sending to API:", body);

  const response = await axios.post(
    buildApiUrl("/department"),
    body,
    authHeaders()
  );

  console.log("📥 API Response:", response.data);
  return response.data;
};

// ── PUT /department/:id ───────────────────────
export const updateDepartment = async (id, formData) => {
  const body = {
    deptName:    formData.dept_name,
    description: formData.description,
    isActive:    String(formData.is_active),
  };

  const response = await axios.put(
    buildApiUrl(`/department/${id}`),
    body,
    authHeaders()
  );

  console.log("📥 Update Response:", response.data);
  return response.data;
};

// ── PUT /department/:id/deactivate ────────────
export const deactivateDepartment = async (id) => {
  const response = await axios.put(
    buildApiUrl(`/department/${id}/deactivate`),
    {},
    authHeaders()
  );

  console.log("📥 Deactivate Response:", response.data);
  return response.data;
};

// ── DELETE /department/:id ────────────────────
export const deleteDepartment = async (id) => {
  const response = await axios.delete(
    buildApiUrl(`/department/${id}`),
    authHeaders()
  );

  console.log("📥 Delete Response:", response.data);
  return response.data;
};

// ── GET /departments ──────────────────────────
export const fetchDepartments = async () => {
  const response = await axios.get(
    buildApiUrl("/departments"),
    authHeaders()
  );
  return response.data;
};
