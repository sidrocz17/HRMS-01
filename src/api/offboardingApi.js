// src/api/offboardingApi.js
// ─────────────────────────────────────────────
//  Offboarding Management API layer
//  Follow same pattern as leaveApi.js / departmentApi.js
// ─────────────────────────────────────────────

import axios from "axios";
import { buildApiUrl } from "./apiBase";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

const normalizeListResponse = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.items)) return responseData.items;
  if (Array.isArray(responseData?.content)) return responseData.content;
  return [];
};

// ── POST /offboarding/resignation ─────────────
// Payload: { empId, resignationDate, proposedLastWorkingDate, reason }
// Response: { empId, employeeName, offboardingId, resignationDate,
//             proposedLastWorkingDate, finalLastWorkingDate, status }
export const applyResignation = async (payload) => {
  const response = await axios.post(
    buildApiUrl("/offboarding/resignation"),
    payload,
    authHeaders()
  );
  return response.data;
};

// ── POST /offboarding/termination ────────────
// Payload: { empId, terminationDate, reason, feedback, isGoodToRehire }
export const initiateTermination = async (payload) => {
  const response = await axios.post(
    buildApiUrl("/offboarding/termination"),
    payload,
    authHeaders()
  );
  return response.data;
};

// ── POST /offboarding/resignation/:id/action ──
// Payload: { status, finalLastWorkingDate, feedback, isGoodToRehire }
// Response: { offboardingId, employeeName, status, finalLastWorkingDate }
export const approveRejectOffboarding = async (offboardingId, payload) => {
  const response = await axios.put(
    buildApiUrl(`/offboarding/resignation/${offboardingId}/action`),
    payload,
    authHeaders()
  );
  return response.data;

  // TODO: After APPROVED → deactivate employee & user
  //   await axios.put(buildApiUrl(`/employees/${empId}/status`),
  //     { is_active: false, user_active: false }, authHeaders());
};

// ── GET /offboarding/resignation[/STATUS] ─────
// Examples:
//   /offboarding/resignation
//   /offboarding/resignation/PENDING
//   /offboarding/resignation/APPROVED
//   /offboarding/resignation/REJECTED
export const getOffboardingList = async (status) => {
  const normalizedStatus = String(status || "").trim().toUpperCase();
  const path = normalizedStatus
    ? buildApiUrl(`/offboarding/resignation/${normalizedStatus}`)
    : buildApiUrl("/offboarding/resignation");

  const response = await axios.get(path, authHeaders());
  return normalizeListResponse(response.data);
};

// ── GET /offboarding/termination ─────────────
export const getTerminationList = async () => {
  const response = await axios.get(
    buildApiUrl("/offboarding/termination"),
    authHeaders()
  );
  return normalizeListResponse(response.data);
};
