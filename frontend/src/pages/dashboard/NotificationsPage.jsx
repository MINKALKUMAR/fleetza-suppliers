import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import {
  BellIcon,
  TaxiIcon,
  CheckIcon,
  XIcon,
  FlagIcon,
  ClockIcon,
  MapPinIcon
} from '../../components/common/Icons';
import { stopNotificationSound, playNotificationChime, playSupplierDutyChime } from '../../utils/notificationSound';

const NotificationsPage = () => {
  const {
    user,
    notifications: allNotifications,
    bookingRequests,
    vehicles,
    markNotificationRead,
    markAllNotificationsRead,
    setBookingRequestStatus,
    completeBookingDuty
  } = useAuth();

  const notifications = allNotifications.filter((n) => String(n.recipientId) === String(user?.id));
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleRead = (notificationId) => {
    markNotificationRead(notificationId);
  };

  const handleReadAll = () => {
    if (user?.id) {
      markAllNotificationsRead(user.id);
    }
  };

  return (
    <div className="dco-container">
      <div className="admin-hero-card">
        <div className="admin-hero-copy">
          <div className="admin-live-badge">
            <span className="admin-pulse-dot" />
            <span>ALERTS & DISPATCH NOTICES</span>
          </div>
          <h1>Duty & System Notifications</h1>
          <p>Real-time booking dispatch notices, trip updates, and operations messages.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={playNotificationChime}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              fontSize: '0.74rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
            title="Play gentle 2-tone notification ping"
          >
            <BellIcon size={13} color="#93c5fd" />
            <span>Test Notification Ping</span>
          </button>

          <button
            type="button"
            onClick={playSupplierDutyChime}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#fef08a',
              fontSize: '0.74rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
            title="Play melodious 4-note taxi dispatch chime"
          >
            <TaxiIcon size={13} color="#fde047" />
            <span>Test Supplier Duty Chime</span>
          </button>

          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleReadAll}>
              Mark all read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <div className="dco-empty-state">
            <BellIcon size={42} color="#94a3b8" />
            <strong className="dco-empty-title">All caught up!</strong>
            <p className="dco-empty-desc">New duty dispatch requests and admin updates will appear here.</p>
          </div>
        ) : (
          <div className="admin-ops-tracker-list">
            {notifications.map((n) => {
              const isBooking = n.type === 'BOOKING_REQUEST';
              const req = isBooking && bookingRequests.find((r) => String(r.id) === String(n.requestId));
              const veh = req && vehicles.find((v) => String(v.id) === String(req.vehicleId));
              const isPending = req?.status === 'REQUESTED';
              const isOngoing = req?.status === 'CONFIRMED';

              return (
                <div
                  key={n.id}
                  className={`admin-tracker-row ${isPending ? 'requested' : !n.read ? 'requested' : ''}`}
                  style={{
                    cursor: 'pointer',
                    background: isPending ? '#fffdf0' : !n.read ? '#f8fafc' : '#ffffff'
                  }}
                  onClick={() => handleRead(n.id)}
                >
                  <div className="admin-tracker-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {isBooking ? (
                        <TaxiIcon size={18} color="#f59e0b" />
                      ) : (
                        <BellIcon size={18} color="#3b82f6" />
                      )}
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{n.title}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {req?.status && <StatusBadge status={req.status} />}
                      <span
                        style={{
                          fontSize: 'var(--font-xs)',
                          color: !n.read ? '#b45309' : 'var(--text-muted)',
                          fontWeight: 700
                        }}
                      >
                        {!n.read ? '● NEW' : 'Read'}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: '0.25rem 0', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                    {n.message}
                  </p>

                  {/* Trip Details Chip */}
                  {req && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginTop: '0.35rem',
                        fontSize: 'var(--font-xs)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {veh && (
                        <span className="admin-tag cars" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <TaxiIcon size={12} />
                          <span>{veh.number} ({veh.name})</span>
                        </span>
                      )}
                      {req.pickupDate && (
                        <span className="admin-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <ClockIcon size={12} color="#64748b" />
                          <span>{req.pickupDate} {req.pickupTime || ''}</span>
                        </span>
                      )}
                      {req.passengerName && (
                        <span className="admin-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#fef3c7', color: '#92400e' }}>
                          <span>👤</span>
                          <span>{req.passengerName}{req.passengerPhone ? ` (${req.passengerPhone})` : ''}</span>
                        </span>
                      )}
                      {req.pickupLocation && (
                        <span className="admin-tag city" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <MapPinIcon size={12} />
                          <span>{req.pickupLocation}</span>
                        </span>
                      )}
                      {req.dropLocation && (
                        <span className="admin-tag city" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#f0fdf4', color: '#166534' }}>
                          <span>🏁</span>
                          <span>{req.dropLocation}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Direct Action Buttons for Pending or Ongoing Duty */}
                  {isPending && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
                      <button
                        type="button"
                        className="btn-top-accept"
                        style={{ minHeight: '38px', minWidth: '120px', padding: '0.35rem 0.85rem', fontSize: '0.825rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          stopNotificationSound();
                          setBookingRequestStatus(req.id, 'CONFIRMED');
                        }}
                      >
                        <CheckIcon size={15} />
                        <span>ACCEPT DUTY</span>
                      </button>
                      <button
                        type="button"
                        className="btn-top-decline"
                        style={{ minHeight: '38px', minWidth: '90px', padding: '0.35rem 0.85rem', fontSize: '0.825rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          stopNotificationSound();
                          setBookingRequestStatus(req.id, 'DECLINED');
                        }}
                      >
                        <XIcon size={15} />
                        <span>DECLINE</span>
                      </button>
                    </div>
                  )}

                  {isOngoing && (
                    <div style={{ marginTop: '0.65rem' }}>
                      <button
                        type="button"
                        className="btn-top-accept"
                        style={{
                          minHeight: '38px',
                          padding: '0.35rem 0.95rem',
                          fontSize: '0.825rem',
                          background: '#2563eb',
                          borderColor: '#1d4ed8'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          completeBookingDuty(req.id);
                        }}
                      >
                        <FlagIcon size={15} />
                        <span>DUTY COMPLETED · FREE CAR</span>
                      </button>
                    </div>
                  )}

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
