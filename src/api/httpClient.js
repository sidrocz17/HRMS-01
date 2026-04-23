import axios from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSessionTokens,
} from "../utils/authStorage";
import { isTokenExpired, logoutAndRedirect } from "../utils/auth";
import { BASE_URL } from "./apiBase";

const REFRESH_PATH =
  String(import.meta.env.VITE_AUTH_REFRESH_URL || "").trim() ||
  "http://172.16.219.107:8080/auth/refresh";

const httpClient = axios.create({
  baseURL: BASE_URL || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;
let interceptorsInitialized = false;

const isAuthRoute = (url = "") => {
  const normalizedUrl = String(url || "");
  return ["/auth/login", "/auth/logout", "/auth/change-password", "/auth/refresh"].some(
    (path) => normalizedUrl.includes(path)
  );
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
  const refreshToken = getRefreshToken();

  // Let response interceptor or preflight refresh handle expired access tokens.
  // Do not clear the session here if a refresh token is available.
  if (token && isTokenExpired(token) && refreshToken) {
    return config;
  }

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

const attachValidAuthHeader = async (config = {}) => {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();

  if (token && isTokenExpired(token) && refreshToken && !isAuthRoute(config.url)) {
    try {
      const nextAccessToken = await refreshAccessToken();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${nextAccessToken}`;
      return config;
    } catch (error) {
      clearSession();
      logoutAndRedirect();
      return Promise.reject(error);
    }
  }

  return attachAuthHeader(config);
};

const handleAuthError = async (error, client) => {
  const originalRequest = error.config;
  const token = getAccessToken();
  const hasAuthorizationHeader = Boolean(
    originalRequest?.headers?.Authorization || originalRequest?.headers?.authorization
  );

  if (
    error.response?.status !== 401 ||
    !originalRequest ||
    originalRequest._retry
  ) {
    throw error;
  }

  if (
    originalRequest.url?.includes(REFRESH_PATH) ||
    isAuthRoute(originalRequest.url) ||
    (!token && !hasAuthorizationHeader)
  ) {
    throw error;
  }

  if (!getRefreshToken()) {
    clearSession();
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
    client.interceptors.request.use(attachValidAuthHeader);
    client.interceptors.response.use(
      (response) => response,
      (error) => handleAuthError(error, client)
    );
  });

  interceptorsInitialized = true;
};

export default httpClient;
