import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Departments from "./pages/Departments";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./config/roles.jsx";
import Designations from "./pages/Designations.jsx";
import LeaveTypes from "./pages/LeaveTypes";
import LeavePolicy from "./pages/LeavePolicy";
import EmployeeTypes from "./pages/EmployeeTypes";
import HolidayCalendar from "./pages/HolidayCalendar";
import AttendancePolicy from "./pages/AttendancePolicy";
import LeaveManagement from "./pages/LeaveManagement";
import EmployeeOnboarding from "./pages/EmployeeOnboarding";
import EmployeeManagement from "./pages/EmployeeManagement";
import Attendance from "./pages/Attendance";

function DashboardLayout({ page }) {
  const pages = {
    dashboard: <Dashboard />,
    departments: <Departments />,
    designation: <Designations />,
    "leave-types": <LeaveTypes />,
    "leave-policy": <LeavePolicy />,
    "employee-types": <EmployeeTypes />,
    holidays: <HolidayCalendar />,
    "attendance-settings": <AttendancePolicy />,
    "leave-management": <LeaveManagement />,
    "employee-onboarding": <EmployeeOnboarding />,
    "employee-management": <EmployeeManagement />,
    "attendance": <Attendance />,
    // employees: <Employee />,  ← uncomment when built
    // payroll:   <Payroll />,   ← uncomment when built
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Navbar />
        <div className="pt-16">{pages[page] || <Dashboard />}</div>
      </div>
    </div>
  );
}

// ── Routes ────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Any logged-in role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout page="dashboard" />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <DashboardLayout page="departments" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designation"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <DashboardLayout page="designation" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave-types"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <DashboardLayout page="leave-types" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave-policy"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <DashboardLayout page="leave-policy" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-types"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <DashboardLayout page="employee-types" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/holidays"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE]}
            >
              <DashboardLayout page="holidays" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-settings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <DashboardLayout page="attendance-settings" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave-management"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE]}
            >
              <DashboardLayout page="leave-management" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-onboarding"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <DashboardLayout page="employee-onboarding" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-management"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <DashboardLayout page="employee-management" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <DashboardLayout page="attendance" />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
