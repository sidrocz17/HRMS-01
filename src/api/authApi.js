import axios from "axios";
import {
  getAccessToken,
  clearSession,
  setForcePasswordReset,
} from "../utils/authStorage";
import { logoutAndRedirect } from "../utils/auth";
import { buildUrl } from "./apiBase";

const LOGOUT_PATH = buildUrl("/auth/logout");
const CHANGE_PASSWORD_PATH = buildUrl("/auth/change-password");

const authHeaders = () => {
  const token = getAccessToken();

  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

export const logoutUser = async () => {
  try {
    const response = await axios.post(LOGOUT_PATH, {}, authHeaders());
    return response.data;
  } catch (error) {
    if (error.response?.status === 405) {
      const response = await axios.get(LOGOUT_PATH, authHeaders());
      return response.data;
    }

    throw error;
  } finally {
    clearSession();
    logoutAndRedirect();
  }
};

export const changePassword = async ({ oldPassword, newPassword }) => {
  const response = await axios.post(
    CHANGE_PASSWORD_PATH,
    { oldPassword, newPassword },
    authHeaders()
  );

  setForcePasswordReset(false);
  return response.data;
};
