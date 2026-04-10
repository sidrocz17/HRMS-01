// ─────────────────────────────────────────────
//  XCELTECH — RBAC Config (Single Source of Truth)
//  All roles, permissions and sidebar menus live here.
//  To add a new role or menu item → only edit THIS file.
// ─────────────────────────────────────────────

// ── 1. Role constants ──────────────────────────
export const ROLES = {
  ADMIN: "admin",
  HR: "hr",
  EMPLOYEE: "employee",
};

export const normalizeRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  if (normalized === "admin") return ROLES.ADMIN;
  if (normalized === "hr") return ROLES.HR;
  if (normalized === "employee") return ROLES.EMPLOYEE;

  return ROLES.EMPLOYEE;
};

// ── 2. SVG icons (reusable) ────────────────────
const Icons = {
  dashboard: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 8a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm8-8a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zm0 8a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  employees: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2zM1 14.5a7.5 7.5 0 0115 0v.5H1v-.5z" />
    </svg>
  ),
  leave: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
    </svg>
  ),
  attendance: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
        clipRule="evenodd"
      />
    </svg>
  ),
  admin: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
        clipRule="evenodd"
      />
    </svg>
  ),
  payroll: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
      <path
        fillRule="evenodd"
        d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  reports: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
        clipRule="evenodd"
      />
    </svg>
  ),
  onboarding: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zm0 2a6 6 0 016 6H2a6 6 0 016-6zm8-4a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
    </svg>
  ),
};

// ── 3. Menu config per role ────────────────────
//  Each item: { label, icon, children[] }
//  children: [] means it's a direct link (no dropdown)
// ──────────────────────────────────────────────

export const MENU_CONFIG = {
  // ── ADMIN: full access ──────────────────────
  [ROLES.ADMIN]: [
    {
      label: "Dashboard",
      icon: Icons.dashboard,
      children: [],
    },
    {
      label: "Leave Management",
      icon: Icons.leave,
      children: ["Apply Leave", "My Leaves", "Team Leaves"],
    },
    {
      label: "My Attendance",
      icon: Icons.attendance,
      children: ["Attendance Dashboard", "Holiday List"],
    },
    {
      label: "Admin",
      icon: Icons.admin,
      children: [
        "Employee Onboarding",
        "Department",
        "Designation",
        "Employee Types",
        "Leave Types",
        "Leave Policy",
        "Attendance Settings",
        "Holiday",
      ],
    },
    {
      label: "Payroll Management",
      icon: Icons.payroll,
      children: [],
    },
    {
      label: "Reports",
      icon: Icons.reports,
      children: ["Employee Report", "Attendance Report", "Performance Report"],
    },
  ],

  // ── HR: people ops access ───────────────────
  [ROLES.HR]: [
    {
      label: "Dashboard",
      icon: Icons.dashboard,
      children: [],
    },
    {
      label: "Employee Management",
      icon: Icons.onboarding,
      children: [
        "Employee Onboarding",
        "Employee Offboarding",
        "Resignation Requests",
      ],
    },
    {
      label: "Leave Management",
      icon: Icons.leave,
      children: ["Apply Leave", "My Leaves", "Team Leaves"],
    },
    {
      label: "My Attendance",
      icon: Icons.attendance,
      children: ["Attendance Dashboard", "Holiday List"],
    },
    {
      label: "Reports",
      icon: Icons.reports,
      children: ["Employee Report", "Attendance Report"],
    },
  ],

  // ── EMPLOYEE: self-service only ─────────────
  [ROLES.EMPLOYEE]: [
    {
      label: "Dashboard",
      icon: Icons.dashboard,
      children: [],
    },
    {
      label: "Leave",
      icon: Icons.leave,
      children: ["Apply Leave", "My Leaves"],
    },
    {
      label: "My Attendance",
      icon: Icons.attendance,
      children: ["Attendance Dashboard", "Holiday List"],
    },
    {
      label: "Payroll",
      icon: Icons.payroll,
      children: [],
    },
  ],
};

// ── 4. Role redirect map ───────────────────────
//  Where each role lands after login
export const ROLE_REDIRECT = {
  [ROLES.ADMIN]: "/dashboard",
  [ROLES.HR]: "/dashboard",
  [ROLES.EMPLOYEE]: "/dashboard",
};

// ── 5. Role display labels + badge colors ──────
export const ROLE_META = {
  [ROLES.ADMIN]: {
    label: "ADMIN",
    badgeClass: "bg-red-100 text-red-700",
  },
  [ROLES.HR]: {
    label: "HR Manager",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  [ROLES.EMPLOYEE]: {
    label: "Employee",
    badgeClass: "bg-green-100 text-green-700",
  },
};
