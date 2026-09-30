import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import SupplierDutyTopBanner from '../components/common/SupplierDutyTopBanner';
import AdminLiveDutyAlerts from '../components/common/AdminLiveDutyAlerts';
import NotificationPermissionBanner from '../components/common/NotificationPermissionBanner';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="app-content">
          <NotificationPermissionBanner />
          <SupplierDutyTopBanner />
          <AdminLiveDutyAlerts />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
