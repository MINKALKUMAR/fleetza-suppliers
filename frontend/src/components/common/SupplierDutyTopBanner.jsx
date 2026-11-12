import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  startNotificationSound,
  stopNotificationSound,
  playNotificationSound,
  unlockAudioContext,
  isAudioBlocked
} from '../../utils/notificationSound';
import {
  SirenIcon,
  CheckIcon,
  XIcon,
  TaxiIcon,
  ClockIcon,
  MapPinIcon,
  VolumeOnIcon,
  VolumeOffIcon,
  UserIcon
} from './Icons';

const SupplierDutyTopBanner = () => {
  const { user, hasRole, bookingRequests, vehicles, setBookingRequestStatus } = useAuth();
  const { showToast } = useToast();
  const isSupplier = hasRole('SUPPLIER');

  // Supplier-specific pending duty requests
  const pendingRequests = useMemo(() => {
    if (!isSupplier || !user?.id) return [];
    return bookingRequests.filter(
      (r) => String(r.supplierId) === String(user.id) && r.status === 'REQUESTED'
    );
  }, [isSupplier, user?.id, bookingRequests]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [audioNeedsTap, setAudioNeedsTap] = useState(false);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= pendingRequests.length && pendingRequests.length > 0) {
      setCurrentIndex(pendingRequests.length - 1);
    }
  }, [pendingRequests.length, currentIndex]);

  const activeRequest = pendingRequests[currentIndex] || pendingRequests[0];
  const vehicle = vehicles.find((v) => String(v.id) === String(activeRequest?.vehicleId));

  // Sound alarm triggers continuously until supplier Accepts or Declines
  useEffect(() => {
    if (pendingRequests.length > 0 && activeRequest) {
      // Start continuous siren alarm engine
      startNotificationSound({
        dutyType: activeRequest.dutyType,
        pickupDate: activeRequest.pickupDate,
        pickupTime: activeRequest.pickupTime,
        vehicleNumber: vehicle?.number,
        location: activeRequest.pickupLocation
      }, 1400);

      // Check if browser suspended audio context due to lack of prior user gesture
      if (isAudioBlocked()) {
        setAudioNeedsTap(true);
      } else {
        setAudioNeedsTap(false);
      }
    } else {
      stopNotificationSound();
      setAudioNeedsTap(false);
    }

    return () => {
      stopNotificationSound();
    };
  }, [pendingRequests.length, activeRequest?.id, vehicle?.number]);

  // Global screen tap unblocks audio if browser had suspended it
  const handleUserScreenTap = () => {
    unlockAudioContext();
    if (activeRequest) {
      startNotificationSound({
        dutyType: activeRequest.dutyType,
        pickupDate: activeRequest.pickupDate,
        pickupTime: activeRequest.pickupTime,
        vehicleNumber: vehicle?.number,
        location: activeRequest.pickupLocation
      }, 1400);
    } else {
      playNotificationSound();
    }
    setAudioNeedsTap(false);
  };

  const handleRespond = async (requestId, status) => {
    setActionLoading(true);
    // STOP sound immediately upon Accept or Decline
    stopNotificationSound();

    const res = await setBookingRequestStatus(requestId, status);
    setActionLoading(false);

    if (res.success) {
      showToast(
        status === 'CONFIRMED' ? 'Duty accepted successfully!' : 'Duty declined.',
        status === 'CONFIRMED' ? 'success' : 'info'
      );
    } else {
      showToast(res.message || 'Failed to update duty status', 'error');
    }
  };

  if (!isSupplier || pendingRequests.length === 0) {
    return null;
  }

  return (
    <div
      onClick={handleUserScreenTap}
      className="top-duty-urgent-card"
    >
      {/* Top Banner Row: Alarm Indicator & Audio Unblock Alert */}
      <div className="top-duty-urgent-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981',
              display: 'inline-block',
              animation: 'admin-dot-pulse 1.2s infinite'
            }}
          />
          <TaxiIcon size={18} color="#f59e0b" />
          <strong style={{ fontSize: '0.88rem', letterSpacing: '0.02em', color: '#fef08a' }}>
            NEW DUTY DISPATCH {pendingRequests.length > 1 && `(${currentIndex + 1}/${pendingRequests.length})`}
          </strong>
        </div>

        {audioNeedsTap ? (
          <button
            type="button"
            onClick={handleUserScreenTap}
            style={{
              background: '#f59e0b',
              color: '#000000',
              border: 'none',
              borderRadius: '4px',
              padding: '0.25rem 0.6rem',
              fontWeight: 800,
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              animation: 'pulse 1.2s infinite'
            }}
          >
            <VolumeOnIcon size={14} />
            <span>TAP TO ENABLE CHIME</span>
          </button>
        ) : (
          <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <VolumeOnIcon size={13} />
            <span>DISPATCH CHIME ACTIVE</span>
          </span>
        )}
      </div>

      {/* Middle Row: Duty Details & Vehicle Information */}
      <div className="top-duty-urgent-body">
        <div className="top-duty-urgent-info">
          <div className="plate-badge" style={{ fontSize: '0.78rem', padding: '0.15rem 0.45rem' }}>
            <TaxiIcon size={13} color="#000000" />
            <span>{vehicle?.number || 'ASSIGNED TAXI'}</span>
          </div>

          <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>
            {vehicle?.name || vehicle?.model || 'Vehicle'} · {activeRequest?.dutyType || '8/80'}
          </strong>

          <span style={{ color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <ClockIcon size={12} color="#f59e0b" />
            <span>{activeRequest?.pickupDate || 'Today'} {activeRequest?.pickupTime ? `at ${activeRequest.pickupTime}` : ''}</span>
          </span>

          {activeRequest?.passengerName && (
            <span style={{ color: '#fef08a', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <UserIcon size={12} color="#fef08a" />
              <span>{activeRequest.passengerName}{activeRequest.passengerPhone ? ` (${activeRequest.passengerPhone})` : ''}</span>
            </span>
          )}

          {activeRequest?.pickupLocation && (
            <span className="top-duty-route-pill" style={{ color: '#93c5fd' }}>
              <MapPinIcon size={12} color="#60a5fa" />
              <span>{activeRequest.pickupLocation}</span>
            </span>
          )}

          {activeRequest?.dropLocation && (
            <span className="top-duty-route-pill" style={{ color: '#a7f3d0' }}>
              <span>🏁</span>
              <span>{activeRequest.dropLocation}</span>
            </span>
          )}

          {activeRequest?.remarks && (
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1', fontStyle: 'italic' }}>
              ({activeRequest.remarks})
            </span>
          )}
        </div>

        {/* Right Action Buttons: Big Touch-Friendly Accept & Decline */}
        <div className="top-duty-urgent-actions">
          {pendingRequests.length > 1 && (
            <div className="top-duty-urgent-pager">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev > 0 ? prev - 1 : pendingRequests.length - 1));
                }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '4px', padding: '0.3rem 0.55rem', cursor: 'pointer', fontSize: '0.74rem' }}
                title="Previous Duty"
              >
                ◀ Prev
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev < pendingRequests.length - 1 ? prev + 1 : 0));
                }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '4px', padding: '0.3rem 0.55rem', cursor: 'pointer', fontSize: '0.74rem' }}
                title="Next Duty"
              >
                Next ▶
              </button>
            </div>
          )}

          <button
            type="button"
            className="top-duty-accept-btn"
            disabled={actionLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleRespond(activeRequest.id, 'CONFIRMED');
            }}
          >
            <CheckIcon size={15} />
            <span>ACCEPT DUTY</span>
          </button>

          <button
            type="button"
            className="top-duty-decline-btn"
            disabled={actionLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleRespond(activeRequest.id, 'DECLINED');
            }}
          >
            <XIcon size={15} />
            <span>DECLINE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierDutyTopBanner;
