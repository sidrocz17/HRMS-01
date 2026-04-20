// src/api/profileApi.js
// ─────────────────────────────────────────────
//  My Profile API layer
//  Follows same pattern as departmentApi.js / leaveApi.js
// ─────────────────────────────────────────────

import axios from "axios";
import { buildApiUrl } from "./apiBase";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

const normalizeProfileResponse = (responseData) => {
  if (responseData?.data && typeof responseData.data === "object") {
    return responseData.data;
  }
  if (responseData?.employee && typeof responseData.employee === "object") {
    return responseData.employee;
  }
  return responseData;
};

// ── Helper: resolve logged-in employee ID ──────
export const getLoggedInEmpId = () => {
  try {
    const user        = JSON.parse(localStorage.getItem("user")        || "{}");
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
    return (
      localStorage.getItem("employeeId") ||
      user.employeeId  || user.empId  || user.emp_id  ||
      userDetails.empId || userDetails.emp_id || userDetails.employeeId ||
      user.id          || ""
    );
  } catch {
    return localStorage.getItem("employeeId") || "";
  }
};

// ── GET /employees/:empId ─────────────────────
// Response shape:
// { empId, firstName, lastName, email, phone, address,
//   department: { deptName }, designation: { title },
//   panNum, aadharNum, passportNum, joinDate,
//   reportingManager, isActive, noticePeriod }
export const getProfile = async (empId) => {
  const response = await axios.get(
    buildApiUrl(`/employees/${empId}`),
    authHeaders()
  );
  return normalizeProfileResponse(response.data);
};

// ── PUT /employees/:empId ─────────────────────
// Update personal information (phone, address etc.)
export const updateProfile = async (empId, payload) => {
  // TODO: integrate API
  // const response = await axios.put(
  //   buildApiUrl(`/employees/${empId}`),
  //   payload,
  //   authHeaders()
  // );
  // return response.data;

  console.log("📤 PUT /employees/:empId →", empId, payload);
  return { ...payload, empId };
};
