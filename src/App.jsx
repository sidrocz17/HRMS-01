import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import Departments    from "./pages/Departments";
import Sidebar        from "./components/Sidebar";
import Navbar         from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES }      from "./config/roles.jsx";

// ── Layout wrapper ────────────────────────────
//  "page" prop decides what renders in the content area
// ─────────────────────────────────────────────
function DashboardLayout({ page }) {
  const pages = {
    dashboard:   <Dashboard />,
    departments: <Departments />,
    // employees: <Employee />,  ← uncomment when built
    // payroll:   <Payroll />,   ← uncomment when built
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Navbar />
        <div className="pt-16">
          {pages[page] || <Dashboard />}
        </div>
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

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}