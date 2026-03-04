import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { token, role } = useAuth();
  const location = useLocation();

  if (!token) {
    // Not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Logged in but wrong role. Redirect based on role
    if (role === 'CLIENT') return <Navigate to="/dashboard" replace />;
    if (role === 'CLERK') return <Navigate to="/review-queue" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  // Render the child routes
  return <Outlet />;
};
