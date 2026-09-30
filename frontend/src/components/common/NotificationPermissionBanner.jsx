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

  // Only relevant for suppliers when notification permission is not yet granted
  if (!isSupplier || permissionState === 'granted') {
    return null;
  }

  const handleEnableAlerts = async () => {
    unlockAudioContext();
    const result = await requestNotificationPermission();
    setPermissionState(result);
    setTested(true);
    playSupplierDutyChime();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '1.5rem',
          maxWidth: '440px',
          width: '100%',
          border: '1.5px solid #3b82f6',
          boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.7)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.5)'
          }}
        >
          <BellIcon size={26} color="#ffffff" />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#ffffff' }}>
          Enable Duty Sound & Notifications
        </h3>

        <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          To receive duty requests with loud sound alerts and vibration when your app is in the background or screen is off, please tap <strong>Allow</strong> below.
        </p>

        <button
          type="button"
          onClick={handleEnableAlerts}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}
        >
          <VolumeOnIcon size={18} />
          <span>ALLOW SOUND & NOTIFICATIONS</span>
        </button>

        <div style={{ marginTop: '0.85rem', fontSize: '0.72rem', color: '#94a3b8' }}>
          🔒 Required once by Fleetza to ring mobile speaker on incoming duties
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;

