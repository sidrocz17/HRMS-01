// src/api/departmentApi.js
// ─────────────────────────────────────────────
//  All department API calls live here.
//  Add more endpoints as your backend grows.
// ─────────────────────────────────────────────

import axios from "axios";

const BASE_URL = "http://localhost:8080/api/departments";

// ── Auth headers ──────────────────────────────
const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// ── POST /add-department ──────────────────────
export const createDepartment = async ({ dept_id, dept_name, description, is_active }) => {
  const response = await axios.post(
    `${BASE_URL}/add-department`,
    {
      deptName:    dept_name,
      description: description,
      isActive:    String(is_active), // API expects "true" / "false"
    },
    authHeaders()
  );
  return response.data;
};

// ── Uncomment as your API grows ───────────────

// export const getDepartments = async () => {
//   const response = await axios.get(`${BASE_URL}`, authHeaders());
//   return response.data;
// };

// export const updateDepartment = async (id, data) => {
//   const response = await axios.put(
//     `${BASE_URL}/${id}`,
//     {
//       deptName:    data.dept_name,
//       description: data.description,
//       isActive:    String(data.is_active),
//     },
//     authHeaders()
//   );
//   return response.data;
// };

// export const deleteDepartment = async (id) => {
//   const response = await axios.delete(`${BASE_URL}/${id}`, authHeaders());
//   return response.data;
// };
