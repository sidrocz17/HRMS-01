import axios from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSessionTokens,
} from "../utils/authStorage";
import { BASE_URL, buildUrl } from "./apiBase";

const REFRESH_PATH = buildUrl(
  import.meta.env.VITE_AUTH_REFRESH_PATH || "/auth/refresh"
);

const httpClient = axios.create({
  baseURL: BASE_URL || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

const decodeJwtPayload = (token) => {
  try {
    const [, payload = ""] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("Refresh token missing");
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        REFRESH_PATH,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        const data = response.data || {};
        const nextAccessToken = data.accessToken || data.token;
        const nextRefreshToken = data.refreshToken || refreshToken;

        if (!nextAccessToken) {
          throw new Error("Access token missing in refresh response");
        }

        setSessionTokens({
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
        });

        return nextAccessToken;
      })
      .catch((error) => {
        clearSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.url?.includes("/employment-type")) {
    const tokenPayload = token ? decodeJwtPayload(token) : null;

    console.log("🌐 Employment type request", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      hasToken: Boolean(token),
      tokenPayload,
    });
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      throw error;
    }

    if (originalRequest.url?.includes(REFRESH_PATH)) {
      clearSession();
      throw error;
    }

    originalRequest._retry = true;

    const nextAccessToken = await refreshAccessToken();
    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
    return httpClient(originalRequest);
  }
);

export default httpClient;
