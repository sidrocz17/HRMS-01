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

import { Navigate } from "react-router-dom";
import { normalizeRole } from "../config/roles.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role  = normalizeRole(localStorage.getItem("role"));

  // ── 1. Not logged in → go to login ──────────
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ── 2. Role restriction check ───────────────
  //  If allowedRoles is provided, verify the user's
  //  role is in that list. If not → send to dashboard
  //  (they're logged in but not authorized for this page)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // ── 3. All checks passed → render the page ──
  return children;
};

export default ProtectedRoute;
