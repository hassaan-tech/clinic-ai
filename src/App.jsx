import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"

// ===== AUTH =====
import Login from "./pages/auth/login"
import Register from "./pages/auth/register"

// ===== DASHBOARD =====
import ClinicDashboard from "./pages/dashboard/clinic-dashboard"
import ClinicSelector from "./pages/dashboard/clinic-selector"
import Reminders from "./pages/dashboard/reminders"

// ===== MODULES =====
import Appointments from "./pages/appointments/appointments"
import Patients from "./pages/patients/patients"
import Medicines from "./pages/medicines/medicines"
import Settings from "./pages/settings/settings"

// ===== LAYOUTS =====
import ClinicLayout from "./components/layouts/ClinicLayout"

// ===== STYLES =====
import "./styles/custom.css"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== AUTH ROUTES ===== */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ===== DASHBOARD SELECTOR (POST-LOGIN) ===== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ClinicSelector />
            </ProtectedRoute>
          }
        />

        {/* ===== CLINIC LAYOUT ===== */}
        <Route
          path="/clinic/:id"
          element={
            <ProtectedRoute>
              <ClinicLayout />
            </ProtectedRoute>
          }
        >
          {/* Nested routes inside ClinicLayout */}
          <Route path="dashboard" element={<ClinicDashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="patients" element={<Patients />} />
          <Route path="medicines" element={<Medicines />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="settings" element={<Settings />} />
        
          
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
