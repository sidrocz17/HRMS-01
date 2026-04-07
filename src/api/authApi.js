import axios from "axios";
import { getAccessToken, clearSession } from "../utils/authStorage";

const LOGOUT_PATH = "/auth/logout";

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
  }
};
