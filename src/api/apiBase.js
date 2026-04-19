const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

export const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const buildUrl = (path = "") =>
  `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const buildApiUrl = (path = "") =>
  buildUrl(`/api${path.startsWith("/") ? path : `/${path}`}`);
