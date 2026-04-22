import axios from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSessionTokens,
} from "../utils/authStorage";
import { isTokenExpired, logoutAndRedirect } from "../utils/auth";
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
let interceptorsInitialized = false;

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
        logoutAndRedirect();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const attachAuthHeader = (config = {}) => {
  const token = getAccessToken();

  if (token && isTokenExpired(token)) {
    clearSession();
    logoutAndRedirect();
    return Promise.reject(new Error("Session expired. Please log in again."));
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

const handleAuthError = async (error, client) => {
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
    logoutAndRedirect();
    throw error;
  }

  originalRequest._retry = true;

  try {
    const nextAccessToken = await refreshAccessToken();
    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
    return client(originalRequest);
  } catch (refreshError) {
    clearSession();
    logoutAndRedirect();
    throw refreshError;
  }
};

export const setupAuthInterceptors = () => {
  if (interceptorsInitialized) return;

  [axios, httpClient].forEach((client) => {
    client.interceptors.request.use(attachAuthHeader);
    client.interceptors.response.use(
      (response) => response,
      (error) => handleAuthError(error, client)
    );
  });

  interceptorsInitialized = true;
};

export default httpClient;
