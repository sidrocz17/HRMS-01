// Sidebar.jsx
// ─────────────────────────────────────────────
//  Dynamic sidebar — menu items change based on
//  the role stored in localStorage.
//  All menu config lives in src/config/roles.jsx
//  Navigation wired to all child + parent items.
// ─────────────────────────────────────────────

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MENU_CONFIG, ROLE_META, ROLES } from "../config/roles.jsx";
import { logoutUser } from "../api/authApi";
import { clearSession } from "../utils/authStorage";

// ── Route map — label → path ───────────────────
//  Add new pages here as your project grows.
//  Format: "Sidebar label": "/your-route"
// ──────────────────────────────────────────────
const ROUTE_MAP = {
  // Top-level
  "Dashboard":              "/dashboard",
  "Payroll Management":     "/payroll",
  "Payroll":                "/payroll",

  // Employee Management
  "Employee Onboarding":    "/employees",
  "Employee Offboarding":   "/employees",
  "Resignation Requests":   "/employees",

  // Onboarding & Offboarding (HR label)
  "Onboarding & Offboarding": "/employees",

  // Leave Management
  "Apply Leave":            "/leave/apply",
  "Leave Balance":          "/leave/balance",
  "Approvals":              "/leave/approvals",
  "Approve Leave":          "/leave/approvals",
  "View All Requests":      "/leave/approvals",
  "Requests":               "/leave/approvals",
  "History":                "/leave/history",

  // My Attendance
  "Attendance Dashboard":   "/attendance",
  "Holiday List":           "/holidays",

  // Admin
  "Roles":                  "/roles",
  "Department":             "/departments",
  "Designation":            "/designation",
  "Leave Types":            "/leave-types",
  "Leave Policy":           "/leave-policy",
  "Employee Types": "/employee-types",

  "Company Policies":       "/policies",
  "Attendance Settings":    "/attendance-settings",
  "Holiday":                "/holidays",
  "Holiday Calendar":       "/holidays",

  // Reports
  "Employee Report":        "/reports/employee",
  "Attendance Report":      "/reports/attendance",
  "Performance Report":     "/reports/performance",
};

// ─────────────────────────────────────────────

export default function Sidebar() {
  // ── Read role from localStorage ─────────────
  const role = localStorage.getItem("role") || ROLES.EMPLOYEE;

  // ── Pick the correct menu for this role ─────
  const navItems = MENU_CONFIG[role] || MENU_CONFIG[ROLES.EMPLOYEE];

  // ── Role badge info (label + color) ─────────
  const roleMeta = ROLE_META[role] || ROLE_META[ROLES.EMPLOYEE];

  // ── Hooks ────────────────────────────────────
  const navigate = useNavigate();
  const location = useLocation();

  // ── Sync active item with current URL ────────
  //  Reverse-looks up which label matches the URL
  //  so refresh / direct navigation keeps highlight
  const getActiveFromPath = () => {
    const match = Object.entries(ROUTE_MAP).find(
      ([, path]) => path === location.pathname
    );
    return match ? match[0] : "Dashboard";
  };

  const [activeItem, setActiveItem] = useState(getActiveFromPath);
  const [expanded, setExpanded]     = useState({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggle = (label) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  // ── Navigation handler ────────────────────────
  const handleNavigate = (label) => {
    setActiveItem(label);
    if (ROUTE_MAP[label]) navigate(ROUTE_MAP[label]);
  };

  // ── Logout ────────────────────────────────────
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
      clearSession();
    } finally {
      navigate("/", { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-[#1a2240] flex flex-col z-30 overflow-y-auto scrollbar-hide">

      {/* ── Logo ── */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg tracking-widest">XCELTECH</span>
      </div>

      {/* ── Role badge ── */}
      <div className="px-5 pt-4 pb-1">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleMeta.badgeClass}`}>
          {roleMeta.label}
        </span>
      </div>

      {/* ── Features label ── */}
      <div className="px-5 pt-3 pb-1">
        <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">
          Features
        </span>
      </div>

      {/* ── Nav items — driven by role config ── */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        {navItems.map((item) => (
          <div key={item.label}>

            {/* ── No children → direct link ── */}
            {item.children.length === 0 ? (
              <button
                onClick={() => handleNavigate(item.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeItem === item.label
                    ? "bg-[#f5a623] text-[#1a2240]"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className={activeItem === item.label ? "text-[#1a2240]" : "text-white/60"}>
                  {item.icon}
                </span>
                {item.label}
                {activeItem === item.label && (
                  <span className="ml-auto">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </span>
                )}
              </button>

            ) : (
              /* ── Has children → collapsible section ── */
              <>
                <button
                  onClick={() => toggle(item.label)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150"
                >
                  <span className="text-white/60">{item.icon}</span>
                  {item.label}
                  <span className="ml-auto text-white/40">
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expanded[item.label] ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {expanded[item.label] && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-4">
                    {item.children.map((child) => (
                      <button
                        key={child}
                        onClick={() => handleNavigate(child)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          activeItem === child
                            ? "text-[#f5a623] font-medium"
                            : "text-white/50 hover:text-white/80"
                        }`}
                      >
                        {child}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        ))}

        {/* ── My Profile (always visible) ── */}
        <button
          onClick={() => handleNavigate("My Profile")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            activeItem === "My Profile"
              ? "bg-[#f5a623] text-[#1a2240]"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          My Profile
        </button>
      </nav>

      {/* ── Logout ── */}
      <div className="px-4 pb-6 pt-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm py-3 rounded-xl transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          {isLoggingOut ? "Logging out..." : "Log Out"}
        </button>
      </div>

    </aside>
  );
}
