// src/api/leavePolicyApi.js

import axios from "axios";

const BASE_URL = "/api";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── POST /leave-policy ────────────────────────
export const createLeavePolicy = async (body) => {
  console.log("📤 Sending leave policy:", body);
  const response = await axios.post(`${BASE_URL}/leave-policy`, body, authHeaders());
  console.log("📥 Response:", response.data);
  return response.data;
};

// ── GET /leave-policies ───────────────────────
export const fetchLeavePolicies = async () => {
  const response = await axios.get(`${BASE_URL}/leave-policies`, authHeaders());
  return response.data;
};

// ── GET /leave-types ──────────────────────────
export const fetchLeaveTypes = async () => {
  const response = await axios.get(`${BASE_URL}/leave-types`, authHeaders());
  return response.data;
};

// ── GET /employee-types ───────────────────────
export const fetchEmployeeTypes = async () => {
  const response = await axios.get(`${BASE_URL}/employee-types`, authHeaders());
  return response.data;
};
