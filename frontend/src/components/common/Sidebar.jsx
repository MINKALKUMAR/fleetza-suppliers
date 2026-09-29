import React, { useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  TaxiIcon,
  CarIcon,
  DashboardIcon,
  ZapIcon,
  UsersIcon,
  BellIcon,
  KeyIcon,
  SlidersIcon,
  LogoutIcon,
  MapPinIcon,
  WhatsAppIcon,
  XIcon
} from './Icons';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const {
    user,
    hasRole,
    logout,
    bookingRequests,
    notifications
  } = useAuth();

  const navigate = useNavigate();
  const isSupplier = hasRole('SUPPLIER');

  // Badges for Admin
  const adminPendingBookings = bookingRequests.filter((r) => r.status === 'REQUESTED').length;
  const adminUnreadResponses = notifications.filter(
    (n) => n.type !== 'BOOKING_REQUEST' && !n.read
  ).length;

  // Badges for Supplier
  const supplierPending = bookingRequests.filter(
    (r) => String(r.supplierId) === String(user?.id) && r.status === 'REQUESTED'
  ).length;

  const supplierUnread = useMemo(() => {
    if (!user?.id) return 0;
    return notifications.filter((n) => String(n.recipientId) === String(user.id) && !n.read).length;
  }, [notifications, user?.id]);

  const adminNav = [
    { to: '/admin/dashboard', icon: <DashboardIcon size={18} />, label: 'Overview' },
    {
      to: '/admin/requests',
      icon: <ZapIcon size={18} />,
      label: 'Dispatch Desk',
      badge: adminPendingBookings > 0 ? `${adminPendingBookings} waiting` : null
    },
    { to: '/admin/suppliers', icon: <UsersIcon size={18} />, label: 'Manage Suppliers' },
    { to: '/admin/fleet', icon: <CarIcon size={18} />, label: 'Fleet Register' },
    {
      to: '/admin/notifications',
      icon: <BellIcon size={18} />,
      label: 'Notifications',
      badge: adminUnreadResponses > 0 ? `${adminUnreadResponses}` : null
    },
    { to: '/change-password', icon: <KeyIcon size={18} />, label: 'Change Password' }
  ];

  const supplierNav = [
    {
      to: '/supplier/dashboard',
      icon: <TaxiIcon size={18} />,
      label: 'My Vehicles (Home)',
      badge: supplierPending > 0 ? `${supplierPending} duty` : null
    },
    {
      to: '/supplier/fleet',
      icon: <SlidersIcon size={18} />,
      label: 'Manage Vehicles'
    },
    {
      to: '/supplier/notifications',
      icon: <BellIcon size={18} />,
      label: 'Notifications',
      badge: supplierUnread > 0 ? `${supplierUnread}` : null
    },
    {
      to: '/change-password',
      icon: <KeyIcon size={18} />,
      label: 'Change Password'
    }
  ];

  const navItems = isSupplier ? supplierNav : adminNav;

  const getDisplayRole = () => {
    if (!user || !user.roles) return 'Fleetza Member';
    if (user.roles.includes('ROLE_SUPER_ADMIN') || user.roles.includes('ROLE_ADMIN') || user.roles.includes('ADMIN')) {
      return 'Operations Admin';
    }
    if (user.roles.includes('ROLE_SUPPLIER') || user.roles.includes('SUPPLIER')) {
      return 'Fleet Supplier';
    }
    return user.roles[0].replace('ROLE_', '');
  };

  const location = useLocation();

  // Close mobile sidebar automatically on route change
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  const handleNavClick = (e, to) => {
    if (e) e.preventDefault();
    closeSidebar();
    navigate(to);
  };

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    closeSidebar();
    logout();
    navigate('/login');
  };

  const homePath = isSupplier ? '/supplier/dashboard' : '/admin/dashboard';

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Top Header */}
        <div className="sidebar-header">
          <div
            className="sidebar-brand"
            onClick={(e) => handleNavClick(e, homePath)}
            style={{ cursor: 'pointer' }}
          >
            <TaxiIcon size={24} color="#f59e0b" />
            <span className="brand-text">FLEETZA</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              closeSidebar();
            }}
            aria-label="Close menu"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* User Profile Card */}
        {user && (
          <div
            className="sidebar-user-card"
            onClick={(e) => handleNavClick(e, homePath)}
            style={{ cursor: 'pointer' }}
            title="Go to dashboard"
          >
            <div className="sidebar-user-avatar">
              {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.fullName || user.companyName || user.username}</span>
              <span className="sidebar-user-role">{getDisplayRole()}</span>
              {user.city && (
                <span className="sidebar-user-meta">
                  <MapPinIcon size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
                  {user.city}
                </span>
              )}
              {(!isSupplier ? '+91 8264083932' : user.whatsapp) && (
                <a
                  href={`https://wa.me/${(!isSupplier ? '918264083932' : (user.whatsapp || '')).replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="sidebar-user-meta"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
                  onClick={(e) => e.stopPropagation()}
                  title={!isSupplier ? 'Admin Business WhatsApp: 8264083932' : 'WhatsApp'}
                >
                  <WhatsAppIcon size={12} color="#4ade80" style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
                  {!isSupplier ? '+91 8264083932' : user.whatsapp}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="sidebar-nav-title">MENU</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => handleNavClick(e, item.to)}
                className={`nav-link ${isActive ? 'active' : ''}`}
                role="button"
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="sidebar-nav-badge">{item.badge}</span>}
              </a>
            );
          })}
        </nav>

        {/* Supplier Help & Admin WhatsApp Desk */}
        {isSupplier && (
          <div style={{ padding: '0 0.85rem', marginBottom: '0.65rem' }}>
            <a
              href="https://wa.me/918264083932?text=Hello%20Fleetza%20Operations%20Admin%2C%20I%20need%20support%20with%20my%20supplier%20fleet."
              target="_blank"
              rel="noreferrer noopener"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                background: '#25d366',
                color: '#ffffff',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-sm, 6px)',
                fontSize: '0.78rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)'
              }}
            >
              <WhatsAppIcon size={14} color="#ffffff" />
              <span>Admin Desk (8264083932)</span>
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <LogoutIcon size={18} />
            <span>Logout</span>
          </button>
          <div className="sidebar-app-info">Fleetza Operations Portal · v1.0</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
