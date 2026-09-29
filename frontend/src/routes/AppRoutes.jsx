import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';

import LoginPage from '../pages/auth/LoginPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';
import AdminOverviewPage from '../pages/dashboard/AdminOverviewPage';
import SupplierManagementPage from '../pages/dashboard/SupplierManagementPage';
import FleetManagementPage from '../pages/dashboard/FleetManagementPage';
import BookingRequestsPage from '../pages/dashboard/BookingRequestsPage';
import SupplierDashboardPage from '../pages/dashboard/SupplierDashboardPage';
import NotificationsPage from '../pages/dashboard/NotificationsPage';
import AdminNotificationsPage from '../pages/dashboard/AdminNotificationsPage';
import UnauthorizedPage from '../pages/common/UnauthorizedPage';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Helper component to route root '/' dynamically based on user's primary role
const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  let currentUser = user;
  if (!currentUser) {
    try {
      const stored = localStorage.getItem('fleetza_user');
      if (stored) currentUser = JSON.parse(stored);
    } catch {}
  }

  const storedToken = localStorage.getItem('fleetza_token');
  if ((!isAuthenticated && !storedToken) || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.requiresPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  if (currentUser.roles?.some((r) => r === 'ROLE_SUPPLIER' || r === 'SUPPLIER')) {
    return <Navigate to="/supplier/dashboard" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Root Redirect & Shortcuts */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/supplier" element={<Navigate to="/supplier/dashboard" replace />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Main Application Layout with Role Protection */}
        <Route element={<MainLayout />}>
          {/* Universal Authenticated Account Security */}
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Admin area */}
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminOverviewPage />} />
            <Route path="/admin/suppliers" element={<SupplierManagementPage />} />
            <Route path="/admin/fleet" element={<FleetManagementPage />} />
            <Route path="/admin/requests" element={<BookingRequestsPage />} />
            <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          </Route>

          {/* Supplier Area */}
          <Route element={<RoleRoute allowedRoles={['SUPPLIER']} />}>
            <Route path="/supplier/dashboard" element={<SupplierDashboardPage />} />
            <Route path="/supplier/fleet" element={<FleetManagementPage />} />
            <Route path="/supplier/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
