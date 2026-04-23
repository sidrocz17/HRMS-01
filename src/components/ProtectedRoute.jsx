// ProtectedRoute.jsx
// ─────────────────────────────────────────────
//  Guards routes by:
//  1. Checking if user is logged in (token exists)
//  2. Checking if user's role is allowed (optional)
//
//  Usage:
//  <ProtectedRoute>                          ← any logged-in user
//  <ProtectedRoute allowedRoles={["admin"]}> ← only admin
// ─────────────────────────────────────────────

import { Navigate, useLocation } from "react-router-dom";
import { ROLE_REDIRECT } from "../config/roles.jsx";
import { getUserFromToken } from "../utils/auth.js";
import { shouldForcePasswordReset } from "../utils/authStorage";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { token, role } = getUserFromToken();
  const forcePasswordReset = shouldForcePasswordReset();

  // ── 1. Not logged in → go to login ──────────
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ── 2. Force password reset until completed ─
  if (forcePasswordReset && location.pathname !== "/reset-password") {
    return <Navigate to="/reset-password" replace />;
  }

  if (!forcePasswordReset && location.pathname === "/reset-password") {
    return <Navigate to={ROLE_REDIRECT[role] || "/dashboard"} replace />;
  }

  // ── 3. Role restriction check ───────────────
  //  If allowedRoles is provided, verify the user's
  //  role is in that list. If not → send to dashboard
  //  (they're logged in but not authorized for this page)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_REDIRECT[role] || "/dashboard"} replace />;
  }

  // ── 4. All checks passed → render the page ──
  return children;
};

export default ProtectedRoute;
