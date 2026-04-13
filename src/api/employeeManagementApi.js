// src/api/employeeManagementApi.js
import httpClient from "./httpClient";

const EMPLOYEE_API_PATH = "/api/employees";

/**
 * Fetch all employees with pagination and filtering
 * @param {Object} params - Query parameters (page, limit, search, status, department)
 * @returns {Promise}
 */
export const getEmployees = async (params = {}) => {
  try {
    const response = await httpClient.get(EMPLOYEE_API_PATH, { params });
    return response.data;
  } catch (error) {
    console.error("❌ Get Employees Error:", error);
    throw error;
  }
};

/**
 * Fetch single employee by ID
 * @param {string} empId - Employee ID
 * @returns {Promise}
 */
export const getEmployeeById = async (empId) => {
  try {
    const response = await httpClient.get(`${EMPLOYEE_API_PATH}/${empId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Get Employee Error:", error);
    throw error;
  }
};

/**
 * Update employee and user status
 * @param {string} empId - Employee ID
 * @param {Object} statusData - { employeeActive: boolean, userActive: boolean }
 * @returns {Promise}
 *
 * Business Logic:
 * - If employeeActive = false → userActive must be false
 * - If employeeActive = true and userActive = false → allowed
 * - Backend should validate this constraint
 */
export const updateEmployeeStatus = async (empId, statusData) => {
  try {
    const payload = {
      is_active: statusData.employeeActive,
      user_active: statusData.userActive,
    };
    const response = await httpClient.put(
      `${EMPLOYEE_API_PATH}/${empId}/status`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("❌ Update Employee Status Error:", error);
    throw error;
  }
};

/**
 * Deactivate employee (convenience method)
 * @param {string} empId - Employee ID
 * @param {boolean} deactivateUserLogin - Also deactivate user login
 * @returns {Promise}
 */
export const deactivateEmployee = async (empId, deactivateUserLogin = true) => {
  try {
    return await updateEmployeeStatus(empId, {
      employeeActive: false,
      userActive: !deactivateUserLogin,
    });
  } catch (error) {
    console.error("❌ Deactivate Employee Error:", error);
    throw error;
  }
};

/**
 * Deactivate user login only (employee remains active)
 * @param {string} empId - Employee ID
 * @returns {Promise}
 */
export const deactivateUserLogin = async (empId) => {
  try {
    return await updateEmployeeStatus(empId, {
      employeeActive: true,
      userActive: false,
    });
  } catch (error) {
    console.error("❌ Deactivate User Login Error:", error);
    throw error;
  }
};

/**
 * Update employee details
 * @param {string} empId - Employee ID
 * @param {Object} updateData - Employee data to update
 * @returns {Promise}
 */
export const updateEmployee = async (empId, updateData) => {
  try {
    const response = await httpClient.put(
      `${EMPLOYEE_API_PATH}/${empId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error("❌ Update Employee Error:", error);
    throw error;
  }
};

/**
 * Search employees
 * @param {string} query - Search query
 * @returns {Promise}
 */
export const searchEmployees = async (query) => {
  try {
    const response = await httpClient.get(`${EMPLOYEE_API_PATH}/search`, {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Search Employees Error:", error);
    throw error;
  }
};

export default {
  getEmployees,
  getEmployeeById,
  updateEmployeeStatus,
  deactivateEmployee,
  deactivateUserLogin,
  updateEmployee,
  searchEmployees,
};
