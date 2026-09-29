import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, requiresPasswordChange } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader message="Verifying authentication..." />
      </div>
    );
  }

  const storedToken = localStorage.getItem('fleetza_token');

  if (!isAuthenticated && !storedToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password change on first login before allowing access to other sections
  if (requiresPasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
