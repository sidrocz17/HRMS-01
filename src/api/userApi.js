import axios from "axios";
import { buildApiUrl } from "./apiBase";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const firstFilled = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );

const getResponseObjects = (value) => {
  const root = asObject(value);
  const data = asObject(root.data);

  return [
    root,
    data,
    asObject(root.result),
    asObject(root.payload),
    asObject(root.user),
    asObject(root.employee),
    asObject(data.result),
    asObject(data.payload),
    asObject(data.user),
    asObject(data.employee),
  ];
};

const getUserIdentity = (user = {}) =>
  firstFilled(user.userId, user.id, user.uuid, user.user_id);

export const getEmployeeIdentity = (employee = {}) => {
  if (typeof employee === "string" || typeof employee === "number") {
    const normalized = String(employee).trim();
    return normalized || "";
  }

  const sources = getResponseObjects(employee);

  return firstFilled(
    ...sources.map((source) =>
      firstFilled(
        source.empId,
        source.emp_id,
        source.employeeId,
        source.employee_id,
        source.id
      )
    )
  );
};

// ── GET /users — list users ───────────────────
export const fetchUsers = async () => {
  const response = await axios.get(buildApiUrl("/users"), authHeaders());
  return response.data;
};

// ── GET /users/:userId/employee ───────────────
export const fetchEmployeeByUserId = async (userId) => {
  if (!String(userId || "").trim()) {
    return null;
  }

  const response = await axios.get(
    buildApiUrl(`/users/${userId}/employee`),
    authHeaders()
  );

  return response.data;
};

// ── Helper: resolve logged-in user from /users ─
export const fetchLoggedInUserDetails = async ({
  userId,
  employeeId,
  userName,
  username,
  email,
} = {}) => {
  const response = await fetchUsers();
  const users = toArray(response);

  const normalizedUserId = userId ? String(userId) : "";
  const normalizedEmployeeId = employeeId ? String(employeeId) : "";
  const normalizedUserName = firstFilled(userName, username)
    ? String(firstFilled(userName, username)).trim().toLowerCase()
    : "";
  const normalizedEmail = email
    ? String(email).trim().toLowerCase()
    : "";

  const hasMatchingIdentity = (user) =>
    [
      user.id,
      user.userId,
      user.uuid,
      user.employeeId,
      user.employee_id,
      user.empId,
      user.emp_id,
    ]
      .filter(Boolean)
      .map((value) => String(value))
      .some(
        (value) =>
          value === normalizedUserId || value === normalizedEmployeeId
      );

  let matched =
    (normalizedUserName &&
      users.find(
        (u) =>
          String(u.userName || u.username || "")
            .trim()
            .toLowerCase() === normalizedUserName
      )) ||
    (normalizedEmail &&
      users.find(
        (u) => String(u.email || "").trim().toLowerCase() === normalizedEmail
      )) ||
    (normalizedUserId &&
      users.find((u) => hasMatchingIdentity(u))) ||
    (normalizedEmployeeId &&
      users.find((u) => hasMatchingIdentity(u))) ||
    null;

  if (!matched && users.length === 1) {
    matched = users[0];
  }

  return matched;
};

// ── Resolve logged-in user + employee payload ─
export const fetchLoggedInUserContext = async (identity = {}) => {
  const user = await fetchLoggedInUserDetails(identity);
  const resolvedUserId = firstFilled(
    getUserIdentity(user || {}),
    identity.userId,
    identity.id,
    identity.uuid
  );

  let employee = null;
  if (resolvedUserId) {
    try {
      employee = await fetchEmployeeByUserId(resolvedUserId);
    } catch (error) {
      console.error("❌ Failed to fetch /api/users/:userId/employee:", error);
    }
  }

  return {
    user,
    userId: resolvedUserId ? String(resolvedUserId) : "",
    employee,
    employeeId: firstFilled(
      getEmployeeIdentity(employee || {}),
      identity.employeeId,
      user?.employeeId,
      user?.employee_id,
      user?.empId,
      user?.emp_id
    ),
  };
};
