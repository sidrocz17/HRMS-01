// src/api/leaveTypeApi.js

import axios from "axios";
import { buildApiUrl } from "./apiBase";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── POST /leaveType ───────────────────────────
export const createLeaveType = async (formData) => {
  const carryForwardAllowed = Boolean(formData.carry_forward_allowed);
  const postApplicationAllowed = Boolean(formData.post_application_allowed);

  const body = {
    type:                     formData.type,
    maxConsecutiveDays:       Number(formData.max_consecutive_days),
    carryForwardAllowed,
    carry_forward_allowed:    carryForwardAllowed,
    postApplicationAllowed,
    post_application_allowed: postApplicationAllowed,
  };

  console.log("📤 Sending to API:", body);

  const response = await axios.post(
    buildApiUrl("/leaveType"),
    body,
    authHeaders()
  );

  console.log("📥 API Response:", response.data);
  return response.data;
};

// ── DELETE /leaveType/:id ─────────────────────
export const deleteLeaveType = async (id) => {
  const response = await axios.delete(
    buildApiUrl(`/leaveType/${id}`),
    authHeaders()
  );

  console.log("📥 Delete Leave Type Response:", response.data);
  return response.data;
};

// ── GET /leaveTypes ───────────────────────────
export const fetchLeaveTypes = async () => {
  const response = await axios.get(
    buildApiUrl("/leaveTypes"),
    authHeaders()
  );
  return response.data;
};
