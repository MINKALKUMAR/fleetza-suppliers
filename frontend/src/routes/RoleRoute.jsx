import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const RoleRoute = ({ allowedRoles = [] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader message="Verifying permissions..." />
      </div>
    );
  }

  // Fallback to localStorage if state is in-transit
  let currentUser = user;
  if (!currentUser) {
    try {
      const stored = localStorage.getItem('fleetza_user');
      if (stored) currentUser = JSON.parse(stored);
    } catch {}
  }

  if (!currentUser || !currentUser.roles) {
    return <Navigate to="/login" replace />;
  }

  const hasMatchingRole = allowedRoles.some((role) => {
    const formatted = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    return (
      currentUser.roles.includes(formatted) ||
      currentUser.roles.includes(role) ||
      currentUser.roles.includes('ROLE_SUPER_ADMIN')
    );
  });

  if (!hasMatchingRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;

