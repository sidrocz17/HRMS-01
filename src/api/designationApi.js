// src/api/designationApi.js

import axios from "axios";

const BASE_URL = "/api";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── POST /designation ─────────────────────────
export const createDesignation = async (formData) => {
  const body = {
    title: formData.title,
    description: formData.description,
    isActive: String(formData.is_active),
  };

  console.log("📤 Sending designation to API:", body);

  const response = await axios.post(
    `${BASE_URL}/designation`,
    body,
    authHeaders()
  );

  console.log("📥 Designation API Response:", response.data);
  return response.data;
};

// ── PUT /designation/:id ──────────────────────
export const updateDesignation = async (id, formData) => {
  const body = {
    title: formData.title,
    description: formData.description,
    isActive: String(formData.is_active),
  };

  const response = await axios.put(
    `${BASE_URL}/designation/${id}`,
    body,
    authHeaders()
  );

  console.log("📥 Update Designation API Response:", response.data);
  return response.data;
};

// ── GET /designations ─────────────────────────
export const fetchDesignations = async () => {
  const response = await axios.get(
    `${BASE_URL}/designations`,
    authHeaders()
  );

  return response.data;
};
