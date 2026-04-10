// src/api/employeeApi.js
import axios from "axios";

const BASE_URL = "/api";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("auth_token")}`,
    "Content-Type": "application/json",
  },
});

export const createEmployee = async (formData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/employees`,
      JSON.stringify(formData),
      authHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("❌ Create Employee Error:", error);
    throw error;
  }
};

export const fetchDepartments = async () => {
  try {
    // TODO: Uncomment when backend is ready
    // const response = await axios.get(`${BASE_URL}/departments`, authHeaders());
    // return response.data;
    console.log("📥 Fetching departments...");
    throw new Error("API not integrated yet");
  } catch (error) {
    console.error("❌ Fetch Departments Error:", error);
    throw error;
  }
};

export const fetchDesignations = async () => {
  try {
    // TODO: Uncomment when backend is ready
    // const response = await axios.get(`${BASE_URL}/designations`, authHeaders());
    // return response.data;
    console.log("📥 Fetching designations...");
    throw new Error("API not integrated yet");
  } catch (error) {
    console.error("❌ Fetch Designations Error:", error);
    throw error;
  }
};

export const fetchManagers = async () => {
  try {
    // TODO: Uncomment when backend is ready
    // const response = await axios.get(`${BASE_URL}/employees/managers`, authHeaders());
    // return response.data;
    console.log("📥 Fetching managers...");
    throw new Error("API not integrated yet");
  } catch (error) {
    console.error("❌ Fetch Managers Error:", error);
    throw error;
  }
};

export const uploadDocument = async (docType, file) => {
  try {
    const formDataWithFile = new FormData();
    formDataWithFile.append("document_type", docType);
    formDataWithFile.append("file", file);

    // TODO: Uncomment when backend is ready
    // const response = await axios.post(`${BASE_URL}/documents/upload`, formDataWithFile, {
    //   headers: {
    //     Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("auth_token")}`,
    //     "Content-Type": "multipart/form-data",
    //   },
    // });
    // return response.data;

    console.log("📤 Document uploaded:", docType);
    throw new Error("API not integrated yet");
  } catch (error) {
    console.error("❌ Upload Document Error:", error);
    throw error;
  }
};

export default {
  createEmployee,
  fetchDepartments,
  fetchDesignations,
  fetchManagers,
  uploadDocument,
};
