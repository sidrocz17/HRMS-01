import { create } from "zustand";
import axios from "axios";
import { buildUrl } from "../api/apiBase";
import { setSessionTokens } from "../utils/authStorage";

const getAuthErrorMessage = (error, fallback = "Login failed") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const useAuthStore = create((set) => ({
  loading: false,
  error: "",

  clearError: () => set({ error: "" }),

  login: async ({ email, password }) => {
    const username = String(email || "").trim();

    set({ loading: true, error: "" });

    try {
      const response = await axios.post(
        buildUrl("/auth/login"),
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      const token = data.accessToken || data.token;

      if (!token) {
        throw new Error("Token missing in login response");
      }

      setSessionTokens({
        accessToken: token,
        refreshToken: data.refreshToken,
      });
      localStorage.removeItem("auth_token");

      set({ loading: false, error: "" });
      return { data, token };
    } catch (error) {
      const message = getAuthErrorMessage(error, "Login failed");

      set({ loading: false, error: message });
      throw {
        error,
        message,
        status: error?.response?.status,
        data: error?.response?.data,
      };
    }
  },
}));

export default useAuthStore;
