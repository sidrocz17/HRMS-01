// src/api/departmentApi.js

import axios from "axios";

// ── Use relative path — Vite proxy handles the real IP ──
const BASE_URL = "/api";

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
    `${BASE_URL}/department`,
    body,
    authHeaders()
  );

  console.log("📥 API Response:", response.data);
  return response.data;
};

// ── GET /departments ──────────────────────────
export const fetchDepartments = async () => {
  const response = await axios.get(
    `${BASE_URL}/departments`,
    authHeaders()
  );
  return response.data;
};