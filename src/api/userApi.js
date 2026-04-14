import axios from "axios";

const BASE_URL = "/api";

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

// ── GET /users — list users ───────────────────
export const fetchUsers = async () => {
  const response = await axios.get(`${BASE_URL}/users`, authHeaders());
  return response.data;
};

// ── Helper: resolve logged-in user from /users ─
export const fetchLoggedInUserDetails = async ({
  userId,
  userName,
} = {}) => {
  const response = await fetchUsers();
  const users = toArray(response);

  const normalizedUserId = userId ? String(userId) : "";
  const normalizedUserName = userName
    ? String(userName).trim().toLowerCase()
    : "";

  let matched =
    (normalizedUserId &&
      users.find((u) => String(u.id) === normalizedUserId)) ||
    (normalizedUserName &&
      users.find(
        (u) => String(u.userName || "").trim().toLowerCase() === normalizedUserName
      )) ||
    null;

  if (!matched && users.length === 1) {
    matched = users[0];
  }

  return matched;
};

