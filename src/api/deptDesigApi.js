// ADD THIS FUNCTION to your existing src/api/departmentApi.js
// ─────────────────────────────────────────────
//  POST /api/dept-desig
//  Maps one or more designations to a department
//
//  Payload:
//  {
//    "deptId":   "uuid",
//    "desigIds": ["uuid", "uuid"],
//    "userId":   "uuid"
//  }
// ─────────────────────────────────────────────

import axios from "axios";
import { buildApiUrl } from "./apiBase";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── Helper: resolve logged-in user ID ──────────
const getUserId = () => {
  try {
    const user  = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    // Try JWT payload first
    let tokenPayload = null;
    if (token) {
      try {
        const [, payload = ""] = token.split(".");
        const norm = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = norm.padEnd(norm.length + ((4 - (norm.length % 4)) % 4), "=");
        tokenPayload = JSON.parse(atob(padded));
      } catch { /* ignore */ }
    }

    return (
      user.id         ||
      user.userId     ||
      user.uuid       ||
      user.employeeId ||
      tokenPayload?.userId ||
      tokenPayload?.id     ||
      tokenPayload?.sub    ||
      ""
    );
  } catch {
    return "";
  }
};

// ── POST /api/dept-desig ──────────────────────
export const mapDesignationsToDepartment = async (deptId, desigIds) => {
  const userId = getUserId();

  const body = {
    deptId,
    desigIds, // array of designation UUIDs
    userId,
  };

  // console.log("📤 POST /api/dept-desig:", body);

  const response = await axios.post(
    buildApiUrl("/dept-desig"),
    body,
    authHeaders()
  );

  // console.log("📥 dept-desig response:", response.data);
  return response.data;
};

// ── GET /api/dept-desig/:deptId/details ───────
// Fetch department-wise mapped designations for onboarding/edit flows
export const getMappedDesignations = async (deptId) => {
  try {
    const response = await axios.get(
      buildApiUrl(`/dept-desig/${deptId}/details`),
      authHeaders()
    );
    return response.data;
  } catch (err) {
    console.warn(
      "GET /dept-desig/:deptId/details failed:",
      err?.response?.status,
      err?.response?.data || err?.message
    );
    return [];
  }
};
