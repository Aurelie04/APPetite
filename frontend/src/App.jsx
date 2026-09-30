import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import ClientRegisterPage from './pages/ClientRegisterPage.jsx';
import RestaurantRegisterPage from './pages/RestaurantRegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import ClientDashboard from './pages/ClientDashboard.jsx';
import RestaurantDashboard from './pages/RestaurantDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { ROLES, dashboardPath } from './utils/roles.js';

function DashboardRedirect() {
  const { user } = useAuth();
  return <Navigate to={dashboardPath(user?.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<ClientRegisterPage />} />
      <Route path="/register/restaurant" element={<RestaurantRegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/client"
        element={
          <ProtectedRoute roles={[ROLES.CUSTOMER]}>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant"
        element={
          <ProtectedRoute roles={[ROLES.RESTAURANT]}>
            <RestaurantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
