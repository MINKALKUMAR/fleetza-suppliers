import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TaxiIcon,
  BellIcon,
  CheckCircleIcon,
  FlagIcon,
  AlertTriangleIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  FileTextIcon,
  RefreshIcon,
  CheckIcon
} from '../../components/common/Icons';

const AdminNotificationsPage = () => {
  const {
    user,
    notifications: rawNotifications,
    bookingRequests: requests,
    vehicles,
    suppliers,
    markNotificationRead,
    markAllNotificationsRead,
    refreshAllData
  } = useAuth();

  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UNREAD, ALERT, ACCEPTED, DECLINED
  const [searchTerm, setSearchTerm] = useState('');

  // Last 100 notifications (supports up to 100 messages)
  const last100Notifications = useMemo(() => {
    const list = [...(rawNotifications || [])];
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list.slice(0, 100);
  }, [rawNotifications]);

  const unreadCount = useMemo(() => {
    return last100Notifications.filter((n) => !n.read).length;
  }, [last100Notifications]);

  const alertCount = useMemo(() => {
    return last100Notifications.filter((n) => {
      const isAccepted = n.title?.toLowerCase().includes('accept') || n.message?.toLowerCase().includes('accept');
      const isDeclined = n.title?.toLowerCase().includes('declin') || n.title?.toLowerCase().includes('reject');
      return !isAccepted && !isDeclined;
    }).length;
  }, [last100Notifications]);

  const acceptedCount = useMemo(() => {
    return last100Notifications.filter((n) => {
      return n.title?.toLowerCase().includes('accept') || n.message?.toLowerCase().includes('accept');
    }).length;
  }, [last100Notifications]);

  const declinedCount = useMemo(() => {
    return last100Notifications.filter((n) => {
      return n.title?.toLowerCase().includes('declin') || n.title?.toLowerCase().includes('reject');
    }).length;
  }, [last100Notifications]);

  const handleRead = (id) => markNotificationRead(id);
  const handleReadAll = () => {
    if (user?.id) {
      markAllNotificationsRead(user.id);
    }
  };

  const getResponseDetails = (notification) => {
    const request = requests.find((item) => String(item.id) === String(notification.requestId));
    const vehicle = request && vehicles.find((item) => String(item.id) === String(request.vehicleId));
    const supplier = request && suppliers.find((item) => String(item.id) === String(request.supplierId));
    return { request, vehicle, supplier };
  };

  const filteredNotifications = useMemo(() => {
    return last100Notifications.filter((n) => {
      const isAccepted = n.title?.toLowerCase().includes('accept') || n.message?.toLowerCase().includes('accept');
      const isDeclined = n.title?.toLowerCase().includes('declin') || n.title?.toLowerCase().includes('reject');
      const isAlert = !isAccepted && !isDeclined;

      if (activeTab === 'UNREAD' && n.read) return false;
      if (activeTab === 'ALERT' && !isAlert) return false;
      if (activeTab === 'ACCEPTED' && !isAccepted) return false;
      if (activeTab === 'DECLINED' && !isDeclined) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          n.title?.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q) ||
          n.type?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [last100Notifications, activeTab, searchTerm]);

  return (
    <div className="admin-container" style={{ padding: '0.75rem' }}>
      {/* Compact Header */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--border-color, #e2e8f0)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}
          >
            <BellIcon size={16} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--color-dark)' }}>
              Notifications & Activity Feed
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Showing latest {last100Notifications.length} operational events & responses ({unreadCount} unread)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            className="admin-card-btn"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
            onClick={() => refreshAllData()}
            title="Refresh notifications"
          >
            <RefreshIcon size={12} />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              className="admin-card-btn primary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
              onClick={handleReadAll}
            >
              <CheckIcon size={12} />
              <span>Mark all read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.65rem'
        }}
      >
        <div className="filter-chips-scroll">
          <button
            type="button"
            className={`filter-chip ${activeTab === 'ALL' ? 'active' : ''}`}
            style={{ fontSize: '0.73rem', padding: '0.25rem 0.65rem', whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('ALL')}
          >
            All (Last 100)
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'UNREAD' ? 'active' : ''}`}
            style={{ fontSize: '0.73rem', padding: '0.25rem 0.65rem', whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('UNREAD')}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'ALERT' ? 'active' : ''}`}
            style={{
              fontSize: '0.73rem',
              padding: '0.25rem 0.65rem',
              whiteSpace: 'nowrap',
              background: activeTab === 'ALERT' ? '#f59e0b' : undefined,
              borderColor: activeTab === 'ALERT' ? '#d97706' : undefined,
              color: activeTab === 'ALERT' ? '#ffffff' : undefined
            }}
            onClick={() => setActiveTab('ALERT')}
          >
            ⚠️ Alerts ({alertCount})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'ACCEPTED' ? 'active' : ''}`}
            style={{ fontSize: '0.73rem', padding: '0.25rem 0.65rem', whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('ACCEPTED')}
          >
            ✓ Accepted ({acceptedCount})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'DECLINED' ? 'active' : ''}`}
            style={{ fontSize: '0.73rem', padding: '0.25rem 0.65rem', whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('DECLINED')}
          >
            ✕ Declined ({declinedCount})
          </button>
        </div>

        <div style={{ flex: '1 1 180px', maxWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notifications..."
            style={{ height: '32px', fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
          />
        </div>
      </div>

      {/* Notifications List (Small UI) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {filteredNotifications.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.82rem'
            }}
          >
            <BellIcon size={24} color="#94a3b8" style={{ margin: '0 auto 0.4rem', display: 'block' }} />
            No notifications matching your filter.
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const { request, vehicle, supplier } = getResponseDetails(notification);
            const isAccepted = notification.title?.toLowerCase().includes('accept') || notification.message?.toLowerCase().includes('accept');
            const isDeclined = notification.title?.toLowerCase().includes('declin') || notification.title?.toLowerCase().includes('reject');
            const isUnread = !notification.read;

            return (
              <div
                key={notification.id}
                onClick={() => handleRead(notification.id)}
                style={{
                  background: isUnread ? '#f8fafc' : '#ffffff',
                  border: isUnread ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                  borderLeft: isAccepted
                    ? '3px solid #10b981'
                    : isDeclined
                    ? '3px solid #ef4444'
                    : '3px solid #3b82f6',
                  borderRadius: '6px',
                  padding: '0.55rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Left Content */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', flex: 1, minWidth: '240px' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.12rem 0.4rem',
                      borderRadius: '3px',
                      background: isAccepted ? '#dcfce7' : isDeclined ? '#fee2e2' : '#eff6ff',
                      color: isAccepted ? '#15803d' : isDeclined ? '#b91c1c' : '#1d4ed8'
                    }}
                  >
                    {isAccepted ? '✓ ACCEPTED' : isDeclined ? '✕ DECLINED' : 'ALERT'}
                  </span>

                  <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                    {notification.title}
                  </strong>

                  {/* Important inline metadata: Supplier name, City, Vehicle */}
                  {(supplier || vehicle) && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      <span>•</span>
                      {supplier && (
                        <span>
                          <UserIcon size={11} style={{ display: 'inline', verticalAlign: -1, marginRight: 2 }} />
                          {supplier.fullName} ({supplier.city || 'Punjab'})
                        </span>
                      )}
                      {vehicle && (
                        <span
                          style={{
                            background: '#f1f5f9',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            color: '#0f172a'
                          }}
                        >
                          <TaxiIcon size={10} style={{ display: 'inline', verticalAlign: -1, marginRight: 2 }} />
                          {vehicle.name} · {vehicle.number}
                        </span>
                      )}
                    </div>
                  )}

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {notification.message}
                  </span>
                </div>

                {/* Right Content: Time and Read Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Just now'}
                  </span>
                  {isUnread && (
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        display: 'inline-block'
                      }}
                      title="Unread"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;