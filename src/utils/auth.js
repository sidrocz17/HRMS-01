import { jwtDecode } from "jwt-decode";
import { normalizeRole, ROLES } from "../config/roles.jsx";

const TOKEN_KEYS = ["token", "auth_token"];
const LOGIN_PATH = "/";

const normalizeValue = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const firstFilled = (...values) =>
  values
    .map(normalizeValue)
    .find((value) => value !== "");

const firstClaim = (payload, keys = []) =>
  firstFilled(...keys.map((key) => payload?.[key]));

const normalizeRoleClaim = (value) => {
  if (Array.isArray(value)) {
    return normalizeRoleClaim(value[0]);
  }

  const normalized = normalizeValue(value)
    .replace(/^ROLE_/i, "")
    .split(",")[0];

  return normalizeRole(normalized || ROLES.EMPLOYEE);
};

export const getToken = () => {
  if (typeof window === "undefined") return "";

  return firstFilled(...TOKEN_KEYS.map((key) => window.localStorage.getItem(key))) || "";
};

export const getDecodedToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Failed to decode JWT token:", error);
    return null;
  }
};

export const isTokenExpired = (token = getToken()) => {
  if (!token) return true;

  try {
    const payload = jwtDecode(token);
    const exp = Number(payload?.exp);

    if (!Number.isFinite(exp)) return false;

    return exp * 1000 <= Date.now();
  } catch (error) {
    console.error("Failed to decode JWT token expiry:", error);
    return true;
  }
};

export const getUserFromToken = () => {
  const token = getToken();
  const payload = getDecodedToken();

  if (!token || !payload) {
    return {
      token,
      userId: "",
      empId: "",
      role: ROLES.EMPLOYEE,
      claims: null,
    };
  }

  const userId =
    firstClaim(payload, ["userId", "user_id", "uid", "id", "sub"]) || "";
  const empId =
    firstClaim(payload, [
      "empId",
      "emp_id",
      "employeeId",
      "employee_id",
      "eid",
    ]) || "";
  const role = normalizeRoleClaim(
    payload.role ?? payload.roles ?? payload.authorities ?? payload.authority
  );

  return {
    token,
    userId,
    empId,
    role,
    isExpired: isTokenExpired(token),
    claims: payload,
  };
};

export const getRoleFromToken = () => getUserFromToken().role;

export const getEmpIdFromToken = () => getUserFromToken().empId;

export const getUserIdFromToken = () => getUserFromToken().userId;

export const logoutAndRedirect = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("token");
  window.localStorage.removeItem("auth_token");
  window.localStorage.removeItem("refreshToken");

  if (window.location.pathname !== LOGIN_PATH) {
    window.location.replace(LOGIN_PATH);
  }
};
