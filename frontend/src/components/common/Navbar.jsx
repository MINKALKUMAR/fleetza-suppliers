import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import PwaInstallPrompt from './PwaInstallPrompt';
import { TaxiIcon, BellIcon, LogoutIcon } from './Icons';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout, getNotifications, markNotificationRead, markAllNotificationsRead } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef(null);

  const notifications = user ? getNotifications(user.id) : [];
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  const getDisplayRole = () => {
    if (!user || !user.roles) return 'User';
    if (user.roles.includes('ROLE_SUPER_ADMIN') || user.roles.includes('ROLE_ADMIN') || user.roles.includes('ADMIN')) {
      return 'Operations Admin';
    }
    if (user.roles.includes('ROLE_DISPATCHER')) return 'Duty Dispatcher';
    if (user.roles.includes('ROLE_SUPPLIER') || user.roles.includes('SUPPLIER')) return 'Fleet Supplier';
    return user.roles[0].replace('ROLE_', '');
  };

  const isSupplier = user?.roles?.includes('ROLE_SUPPLIER');
  const notificationsLink = isSupplier ? '/supplier/notifications' : '/admin/notifications';

  return (
    <header className="app-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {toggleSidebar && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSidebar();
            }}
            className="navbar-mobile-toggle"
            aria-label="Toggle Navigation"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-dark)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <TaxiIcon size={20} color="#f59e0b" />
          <span>FLEETZA</span>
          <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.7rem', background: '#eff6ff', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
            OPERATIONS
          </span>
        </div>
      </div>

      <div className="navbar-user" ref={menuRef}>
        <PwaInstallPrompt />

        {user && (
          <div className="navbar-user-info-text" style={{ textAlign: 'right' }}>
            <div className="user-greeting" style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
              <strong>{user.fullName || user.username}</strong>
            </div>
            <span className="user-badge" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>{getDisplayRole()}</span>
          </div>
        )}

        <div className="navbar-notification-wrap">
          <button
            type="button"
            className="navbar-notification-button"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notifications"
          >
            <BellIcon size={18} color="var(--color-primary)" />
            {unreadNotifications > 0 && (
              <span className="navbar-notification-count">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="navbar-notification-menu compact-notif-menu">
              <div className="navbar-notification-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BellIcon size={14} color="var(--color-primary)" />
                  <strong style={{ fontSize: '0.82rem' }}>Alerts ({unreadNotifications} new)</strong>
                </div>
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    style={{ fontSize: '0.72rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => {
                      if (user?.id) markAllNotificationsRead(user.id);
                      setNotificationsOpen(false);
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="navbar-notification-empty" style={{ fontSize: '0.78rem', padding: '0.85rem' }}>No recent notifications.</p>
              ) : (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.slice(0, 7).map((notification) => {
                    const isAccepted = notification.title?.toLowerCase().includes('accept') || notification.message?.toLowerCase().includes('accept');
                    const isDeclined = notification.title?.toLowerCase().includes('declin') || notification.title?.toLowerCase().includes('reject');

                    return (
                      <Link
                        to={notificationsLink}
                        key={notification.id}
                        className={`navbar-notification-item ${notification.read ? '' : 'unread'}`}
                        style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}
                        onClick={() => {
                          if (!notification.read) markNotificationRead(notification.id);
                          setNotificationsOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '0.1rem 0.35rem',
                              borderRadius: '3px',
                              background: isAccepted ? '#dcfce7' : isDeclined ? '#fee2e2' : '#eff6ff',
                              color: isAccepted ? '#15803d' : isDeclined ? '#b91c1c' : '#1d4ed8'
                            }}
                          >
                            {isAccepted ? '✓ ACCEPTED' : isDeclined ? '✕ DECLINED' : 'ALERT'}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                          </span>
                        </div>
                        <strong style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-primary)', lineHeight: 1.25 }}>
                          {notification.title}
                        </strong>
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.15rem', lineHeight: 1.3 }}>
                          {notification.message}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <Link
                to={notificationsLink}
                className="navbar-notification-footer"
                style={{ fontSize: '0.75rem', padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}
                onClick={() => setNotificationsOpen(false)}
              >
                View all notifications (up to 100) →
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
