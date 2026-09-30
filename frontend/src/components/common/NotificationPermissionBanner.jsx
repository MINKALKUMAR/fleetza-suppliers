import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  requestNotificationPermission,
  unlockAudioContext,
  playSupplierDutyChime
} from '../../utils/notificationSound';
import { BellIcon, VolumeOnIcon, CheckIcon, TaxiIcon } from './Icons';

const NotificationPermissionBanner = () => {
  const { user, hasRole } = useAuth();
  const isSupplier = hasRole('SUPPLIER');

  const [permissionState, setPermissionState] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'granted';
  });

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fleetza_notif_banner_dismissed') === 'true';
    }
    return false;
  });

  const [tested, setTested] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Only relevant for suppliers
  if (!isSupplier || permissionState === 'granted' || dismissed) {
    return null;
  }

  const handleEnableAlerts = async () => {
    unlockAudioContext();
    const result = await requestNotificationPermission();
    setPermissionState(result);
    setTested(true);
    playSupplierDutyChime();
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fleetza_notif_banner_dismissed', 'true');
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '0.75rem 1rem',
        marginBottom: '0.85rem',
        border: '1.5px solid #3b82f6',
        boxShadow: '0 4px 14px rgba(30, 58, 138, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '240px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
          }}
        >
          <BellIcon size={18} color="#ffffff" />
        </div>
        <div>
          <strong style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 4, color: '#fde047' }}>
            <span>Enable Mobile Notifications & Sound Alerts</span>
          </strong>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.35 }}>
            Allow notifications and audio so you get instant sound alerts and vibration when duty is dispatched, even when your phone screen is off or app is closed.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleEnableAlerts}
          style={{
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
          }}
        >
          {tested ? <CheckIcon size={14} /> : <VolumeOnIcon size={14} />}
          <span>{tested ? 'Alerts Activated!' : 'Allow Sound & Alerts'}</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid #475569',
            borderRadius: '6px',
            padding: '0.45rem 0.65rem',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
