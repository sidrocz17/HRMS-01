// src/api/leavePolicyApi.js

import httpClient from "./httpClient";
import { BASE_URL } from "./apiBase";

// ── POST /leave-policy ────────────────────────
export const createLeavePolicy = async (payload) => {
  console.log("📤 POST leave policy:", payload);
  const response = await httpClient.post(`${BASE_URL}/api/leave-policy`, payload);
  console.log("📥 Leave policy response:", response.data);
  return response.data;
};

// ── PUT /leave-policy/:id ─────────────────────
export const updateLeavePolicy = async (id, payload) => {
  console.log(`📤 PUT leave policy ${id}:`, payload);
  const response = await httpClient.put(
    `${BASE_URL}/api/leave-policy/${id}`,
    payload
  );
  console.log("📥 Update leave policy response:", response.data);
  return response.data;
};

// ── DELETE /leave-policy/:id ──────────────────
export const deleteLeavePolicy = async (id) => {
  console.log(`📤 DELETE leave policy ${id}`);
  const response = await httpClient.delete(`${BASE_URL}/api/leave-policy/${id}`);
  console.log("📥 Delete leave policy response:", response.data);
  return response.data;
};

// ── GET /leave-policy ─────────────────────────
export const fetchLeavePolicies = async () => {
  const response = await httpClient.get(`${BASE_URL}/api/leave-policy`);
  return response.data;
};

// ── GET /leaveTypes ───────────────────────────
export const fetchLeaveTypes = async () => {
  const response = await httpClient.get(`${BASE_URL}/api/leaveTypes`);
  return response.data;
};

// ── GET /employment-types ─────────────────────
export const fetchEmployeeTypes = async () => {
  const response = await httpClient.get(`${BASE_URL}/api/employment-types`);
  return response.data;
};
