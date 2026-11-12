import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  subscribeToWebPush,
  getExistingPushSubscription,
  isPushSupported,
  isIosDevice,
  isStandalonePwa,
  unlockAudioContext,
  playSupplierDutyChime,
  playNotificationChime
} from '../../utils/notificationSound';
import { pushApi } from '../../api/pushApi';
import { BellIcon, VolumeOnIcon, CheckIcon } from './Icons';

const DISMISS_KEY = 'fleetza_notif_banner_dismissed';

const NotificationPermissionBanner = () => {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const isSupplier = hasRole('SUPPLIER');

  const [permissionState, setPermissionState] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(DISMISS_KEY) === 'true';
    }
    return false;
  });

  const syncState = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
    const sub = await getExistingPushSubscription();
    setIsSubscribed(Boolean(sub));
  };

  useEffect(() => {
    if (!user?.id) return;
    syncState();

    const handler = () => syncState();
    window.addEventListener('fleetza:push-status-changed', handler);
    return () => window.removeEventListener('fleetza:push-status-changed', handler);
  }, [user?.id]);

  // Hide modal if not logged in, already granted & subscribed, unsupported, or dismissed this session
  const needsIosInstall = isIosDevice() && !isStandalonePwa();
  if (!user || dismissed) return null;
  if (permissionState === 'granted' && (isSubscribed || !isPushSupported())) return null;
  if (permissionState === 'denied' || permissionState === 'unsupported') return null;

  const handleEnableAlerts = async () => {
    setLoading(true);
    try {
      unlockAudioContext();
      if (isSupplier) {
        playSupplierDutyChime();
      } else {
        playNotificationChime();
      }
    } catch {}

    const res = await subscribeToWebPush({ interactive: true });
    setLoading(false);

    if (res.status === 'ios-install-required') {
      showToast('On iPhone/iPad, tap Share -> Add to Home Screen first to enable Push Alerts.', 'info', 6000);
      return;
    }

    await syncState();

    if (res.status === 'granted') {
      if (res.subscribed) {
        showToast('Web Push notifications enabled on this device!', 'success', 4000);
        try {
          await pushApi.sendTestPush();
        } catch {}
      } else if (!res.configured) {
        showToast('Browser notifications allowed. Server VAPID keys pending in /etc/fleetza/supplier.env.', 'info', 5000);
      } else {
        showToast('Browser notifications enabled!', 'success', 3500);
      }
      setDismissed(true);
      sessionStorage.setItem(DISMISS_KEY, 'true');
    } else if (res.status === 'denied') {
      showToast('Notifications blocked in browser settings. Enable them in site permissions anytime.', 'warning', 5000);
      setDismissed(true);
      sessionStorage.setItem(DISMISS_KEY, 'true');
    }
  };

  const handleClose = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '1.35rem 1.2rem',
          maxWidth: '440px',
          width: '100%',
          maxHeight: '90dvh',
          overflowY: 'auto',
          border: '1.5px solid #3b82f6',
          boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.7)',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          aria-label="Close"
        >
          ✕
        </button>

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

        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#ffffff' }}>
          {needsIosInstall ? 'Install App for iPhone Push Alerts' : 'Enable Instant Web Push Alerts'}
        </h3>

        <p style={{ margin: '0 0 1.2rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          {needsIosInstall ? (
            <>
              On iPhone Safari (iOS 16.4+), tap <strong>Share</strong> &rarr; <strong>Add to Home Screen</strong>, then open the installed Fleetza icon to receive background alerts.
            </>
          ) : isSupplier ? (
            <>
              Receive incoming taxi duty dispatches instantly on your phone or desktop — even when the browser tab is closed or your screen is locked.
            </>
          ) : (
            <>
              Get instant desktop and mobile Web Push alerts whenever a supplier accepts, declines, or completes a dispatched duty.
            </>
          )}
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={needsIosInstall ? handleClose : handleEnableAlerts}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: loading ? 'wait' : 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}
        >
          {needsIosInstall ? <CheckIcon size={18} /> : <VolumeOnIcon size={18} />}
          <span>
            {needsIosInstall
              ? 'GOT IT'
              : loading
              ? 'ENABLING WEB PUSH...'
              : 'ALLOW PUSH & SOUND ALERTS'}
          </span>
        </button>

        <div style={{ marginTop: '0.85rem', fontSize: '0.72rem', color: '#94a3b8' }}>
          Zero-cost secured Web Push (VAPID) · Works on Android, Windows, Mac &amp; iOS PWA
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
