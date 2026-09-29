import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import StatusBadge from './StatusBadge';
import {
  TaxiIcon,
  BellIcon,
  XIcon,
  CheckIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  WhatsAppIcon,
  FlagIcon,
  MessageSquareIcon
} from './Icons';

const NotificationDetailModal = ({ notification, onClose, onRespond, onComplete }) => {
  const { bookingRequests, vehicles, suppliers, user } = useAuth();
  if (!notification) return null;

  const isSupplier = user?.roles?.includes('ROLE_SUPPLIER');
  const request = bookingRequests.find((r) => String(r.id) === String(notification.requestId));
  const vehicle = request && vehicles.find((v) => String(v.id) === String(request.vehicleId));
  const supplier = request && suppliers.find((s) => String(s.id) === String(request.supplierId));

  const isPending = request?.status === 'REQUESTED';
  const isOnDuty = request?.status === 'CONFIRMED';

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="edit-modal" role="dialog" aria-modal="true" style={{ maxWidth: '520px' }}>
        <div className="panel-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {notification.type === 'BOOKING_REQUEST' ? (
              <TaxiIcon size={24} color="#f59e0b" />
            ) : (
              <BellIcon size={24} color="#3b82f6" />
            )}
            <div>
              <span className="eyebrow">Notification Details</span>
              <h2 style={{ fontSize: '1.15rem', margin: 0 }}>{notification.title}</h2>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onClose} aria-label="Close modal">
            <XIcon size={16} />
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
          {/* Main message */}
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 500 }}>
              {notification.message}
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
              Received: {new Date(notification.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Full Duty & Vehicle Information */}
          {request ? (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Booking & Duty Details
                </span>
                <StatusBadge status={request.status} />
              </div>

              {vehicle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div className="plate-badge" style={{ fontSize: '0.9rem', padding: '0.2rem 0.5rem' }}>
                    <TaxiIcon size={14} color="#000000" />
                    <span>{vehicle.number}</span>
                  </div>
                  <strong style={{ fontSize: '0.95rem' }}>{vehicle.name} ({vehicle.model})</strong>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: 'var(--font-xs)', marginTop: '0.25rem' }}>
                <div>
                  <strong>Duty Package:</strong>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {request.dutyType}
                  </div>
                </div>
                <div>
                  <strong>Pickup Date & Time:</strong>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    <CalendarIcon size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
                    {request.pickupDate || 'Today'} {request.pickupTime ? `at ${request.pickupTime}` : ''}
                  </div>
                </div>
              </div>

              {request.passengerName && (
                <div style={{ fontSize: 'var(--font-xs)', background: '#fef3c7', padding: '0.45rem 0.65rem', borderRadius: '4px', border: '1px solid #fde68a' }}>
                  <strong>Passenger Details:</strong>
                  <div style={{ color: '#92400e', fontWeight: 600, marginTop: 2 }}>
                    👤 {request.passengerName} {request.passengerPhone ? `· 📞 ${request.passengerPhone}` : ''}
                  </div>
                </div>
              )}

              {request.pickupLocation && (
                <div style={{ fontSize: 'var(--font-xs)' }}>
                  <strong>Pickup Location:</strong>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>
                    <MapPinIcon size={13} color="#ef4444" style={{ display: 'inline', marginRight: 3, verticalAlign: -2 }} />
                    {request.pickupLocation}
                  </div>
                </div>
              )}

              {request.dropLocation && (
                <div style={{ fontSize: 'var(--font-xs)' }}>
                  <strong>Drop Location:</strong>
                  <div style={{ color: '#166534', fontWeight: 600, marginTop: 2 }}>
                    <span>🏁 </span>
                    {request.dropLocation}
                  </div>
                </div>
              )}

              {request.remarks && (
                <div style={{ fontSize: 'var(--font-xs)', background: '#fffbeb', padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid #fef3c7' }}>
                  <strong>
                    <MessageSquareIcon size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
                    Guest Remarks:
                  </strong>
                  <div style={{ color: '#92400e', marginTop: '0.15rem' }}>
                    {request.remarks}
                  </div>
                </div>
              )}

              {supplier && !isSupplier && (
                <div style={{ fontSize: 'var(--font-xs)', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.5rem' }}>
                  <strong>Assigned Supplier:</strong>
                  <div style={{ marginTop: 2 }}>
                    {supplier.fullName} ({supplier.companyName || supplier.city}) · 
                    <WhatsAppIcon size={12} color="#10b981" style={{ display: 'inline', marginLeft: 4, marginRight: 2, verticalAlign: -1 }} />
                    {supplier.whatsapp}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Action buttons if supplier needs to respond */}
          {isSupplier && isPending && onRespond && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <Button
                variant="success"
                size="lg"
                onClick={() => {
                  onRespond(request.id, 'CONFIRMED');
                  onClose();
                }}
              >
                <CheckIcon size={18} style={{ marginRight: 6 }} />
                <span>Accept Duty</span>
              </Button>
              <Button
                variant="danger"
                size="lg"
                onClick={() => {
                  onRespond(request.id, 'DECLINED');
                  onClose();
                }}
              >
                <XIcon size={18} style={{ marginRight: 6 }} />
                <span>Decline</span>
              </Button>
            </div>
          )}

          {isSupplier && isOnDuty && onComplete && (
            <Button
              variant="success"
              size="lg"
              fullWidth
              onClick={() => {
                onComplete(request.id, vehicle?.number);
                onClose();
              }}
            >
              <FlagIcon size={18} style={{ marginRight: 6 }} />
              <span>Duty Completed · Free Car</span>
            </Button>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NotificationDetailModal;
