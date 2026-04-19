// src/api/employeeTypeApi.js

import httpClient from "./httpClient";
import { BASE_URL } from "./apiBase";

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

// ── Get logged-in user ID from localStorage ───
const getUserId = () => {
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

// ── POST /api/employment-type ─────────────────
// Payload: { name, isActive, createdBy, updatedBy }
export const createEmployeeType = async ({ name, isActive }) => {
  const userId = getUserId();
  const body = {
    name:      name,
    typeName:  name,
    isActive:  String(isActive),
    createdBy: userId,
    updatedBy: userId,
  };
  console.log("📤 POST /api/employment-type:", body);
  const response = await httpClient.post(`${BASE_URL}/api/employment-type`, body);
  console.log("📥 Response:", response.data);
  return response.data;
};

// ── PUT /api/employment-type/:id ──────────────
// Payload: { name, isActive, updatedBy }
export const updateEmployeeType = async (id, { name, isActive }) => {
  const userId = getUserId();
  const body = {
    name: name,
    typeName: name,
    isActive: String(isActive),
    updatedBy: userId,
  };

  console.log(`📤 PUT /api/employment-type/${id}:`, body);
  const response = await httpClient.put(
    `${BASE_URL}/api/employment-type/${id}`,
    body
  );
  console.log("📥 Update Response:", response.data);
  return response.data;
};

// ── DELETE /api/employment-type/:id ───────────
export const deleteEmployeeType = async (id) => {
  const response = await httpClient.delete(
    `${BASE_URL}/api/employment-type/${id}`
  );
  console.log("📥 Delete Response:", response.data);
  return response.data;
};

// ── PATCH /api/employment-type/:id ───────────
export const deactivateEmployeeType = async (id) => {
  const userId = getUserId();
  const body = {
    isActive: "false",
    updatedBy: userId,
  };

  console.log(`📤 PATCH /api/employment-type/${id}:`, body);
  const response = await httpClient.patch(
    `${BASE_URL}/api/employment-type/${id}`,
    body
  );
  console.log("📥 Deactivate Response:", response.data);
  return response.data;
};

// ── GET /api/employment-types ─────────────────
// Returns: [{ id, name, isActive, createdOn, createdBy, updatedOn, updatedBy }]
export const fetchEmployeeTypes = async () => {
  const response = await httpClient.get(`${BASE_URL}/api/employment-types`);
  return response.data;
};
