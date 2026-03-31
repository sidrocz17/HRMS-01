// src/api/leaveTypeApi.js

import axios from "axios";

const BASE_URL = "/api";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── POST /leave-type ──────────────────────────
export const createLeaveType = async (formData) => {
  const body = {
    type:                   formData.type,
    maxConsecutiveDays:     Number(formData.max_consecutive_days),
    carryForwardAllowed:    formData.carry_forward_allowed,
    postApplicationAllowed: formData.post_application_allowed,
  };

  console.log("📤 Sending to API:", body);

  const response = await axios.post(
    `${BASE_URL}/leave-type`,
    body,
    authHeaders()
  );

  console.log("📥 API Response:", response.data);
  return response.data;
};

// ── GET /leave-types ──────────────────────────
export const fetchLeaveTypes = async () => {
  const response = await axios.get(
    `${BASE_URL}/leave-types`,
    authHeaders()
  );
  return response.data;
};
