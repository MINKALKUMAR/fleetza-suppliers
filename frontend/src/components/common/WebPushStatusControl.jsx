import React, { useEffect, useState } from 'react';
import BellRing from 'lucide-react/dist/esm/icons/bell-ring.mjs';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2.mjs';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle.mjs';
import Send from 'lucide-react/dist/esm/icons/send.mjs';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone.mjs';
import { useToast } from '../../context/ToastContext';
import { pushApi } from '../../api/pushApi';
import {
  getExistingPushSubscription,
  isIosDevice,
  isPushSupported,
  isStandalonePwa,
  subscribeToWebPush,
  unsubscribeFromWebPush
} from '../../utils/notificationSound';

const WebPushStatusControl = ({ compact = false }) => {
  const { showToast } = useToast();
  const [permission, setPermission] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [subscribed, setSubscribed] = useState(false);
  const [serverConfigured, setServerConfigured] = useState(true);
  const [deviceCount, setDeviceCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const refreshStatus = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    const existing = await getExistingPushSubscription();
    setSubscribed(Boolean(existing));
    try {
      const res = await pushApi.getStatus();
      if (res?.success && res.data) {
        setServerConfigured(Boolean(res.data.configured));
        setDeviceCount(Number(res.data.subscribedDevices || 0));
      }
    } catch {}
  };

  useEffect(() => {
    refreshStatus();
    const handler = () => refreshStatus();
    window.addEventListener('fleetza:push-status-changed', handler);
    return () => window.removeEventListener('fleetza:push-status-changed', handler);
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    const res = await subscribeToWebPush({ interactive: true });
    setBusy(false);

    if (res.status === 'ios-install-required') {
      showToast('iPhone Safari: Tap Share -> Add to Home Screen first, then open the installed app.', 'info', 6000);
      return;
    }

    await refreshStatus();

    if (res.status === 'granted' && res.subscribed) {
      showToast('Web Push (VAPID) activated for this device!', 'success', 3500);
    } else if (res.status === 'granted' && !res.configured) {
      showToast('Browser permission granted. Add VAPID keys in /etc/fleetza/supplier.env on VPS.', 'info', 5000);
    } else if (res.status === 'denied') {
      showToast('Notifications are blocked in your browser site settings.', 'warning', 5000);
    } else if (res.reason) {
      showToast(res.reason, 'info', 4000);
    }
  };

  const handleTestPush = async () => {
    setBusy(true);
    try {
      const res = await pushApi.sendTestPush();
      const data = res?.data || {};
      if (!data.configured) {
        showToast('Server VAPID keys not configured yet in /etc/fleetza/supplier.env.', 'warning', 5000);
      } else if ((data.sent || 0) > 0) {
        showToast(`Test Web Push delivered to ${data.sent} device(s)!`, 'success', 4000);
      } else {
        showToast('No active push subscription delivered. Try clicking Enable Push first.', 'warning', 4500);
      }
    } catch {
      showToast('Could not send test push notification.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    await unsubscribeFromWebPush();
    await refreshStatus();
    setBusy(false);
    showToast('Web Push disabled on this browser.', 'info', 3000);
  };

  const needsIosInstall = isIosDevice() && !isStandalonePwa();
  const pushSupported = isPushSupported();

  if (compact) {
    return (
      <div className={`webpush-compact-row ${subscribed ? 'is-subscribed' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: subscribed ? '#166534' : '#334155', fontWeight: 700, minWidth: 0 }}>
          {subscribed ? <CheckCircle2 size={14} color="#16a34a" /> : <BellRing size={14} color="#2563eb" />}
          <span>
            {needsIosInstall
              ? 'Add to Home Screen for iOS Push'
              : subscribed
              ? 'Web Push Active'
              : permission === 'denied'
              ? 'Push Blocked in Browser'
              : 'Web Push Off'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {subscribed ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleTestPush}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.55rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Test Push
            </button>
          ) : pushSupported && permission !== 'denied' ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleEnable}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.55rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {busy ? '...' : 'Enable'}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`webpush-banner ${subscribed ? 'is-subscribed' : ''}`}>
      <div className="webpush-banner-info">
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: subscribed ? '#dcfce7' : '#dbeafe',
            color: subscribed ? '#15803d' : '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {needsIosInstall ? <Smartphone size={18} /> : subscribed ? <CheckCircle2 size={18} /> : <BellRing size={18} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>
            {needsIosInstall
              ? 'iPhone / iPad PWA Push Setup'
              : subscribed
              ? `Zero-Cost Web Push (VAPID) Active · ${deviceCount || 1} device(s) linked`
              : permission === 'denied'
              ? 'Browser Notifications Blocked'
              : 'Background Web Push Notifications (Free VAPID)'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px', lineHeight: 1.45 }}>
            {needsIosInstall
              ? 'Tap Share -> "Add to Home Screen" in Safari (iOS 16.4+), then launch Fleetza from your Home Screen.'
              : !serverConfigured
              ? 'Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to /etc/fleetza/supplier.env on your Hostinger VPS.'
              : permission === 'denied'
              ? 'Click the lock/site-info icon next to supplier.fleetza.in in your browser address bar and allow Notifications.'
              : 'Works on Android Chrome, Windows/Mac Chrome & Edge, and iOS 16.4+ PWA even when browser tabs are closed.'}
          </div>
        </div>
      </div>

      <div className={`webpush-banner-actions ${subscribed ? 'has-two' : ''}`}>
        {!subscribed && pushSupported && permission !== 'denied' && (
          <button
            type="button"
            className="webpush-btn-primary"
            disabled={busy}
            onClick={handleEnable}
          >
            <BellRing size={14} />
            <span>{busy ? 'Subscribing...' : 'Enable Web Push'}</span>
          </button>
        )}

        {subscribed && (
          <>
            <button
              type="button"
              className="webpush-btn-success"
              disabled={busy}
              onClick={handleTestPush}
            >
              <Send size={13} />
              <span>{busy ? 'Sending...' : 'Send Test Push'}</span>
            </button>
            <button
              type="button"
              className="webpush-btn-secondary"
              disabled={busy}
              onClick={handleDisable}
            >
              <span>Pause This Device</span>
            </button>
          </>
        )}

        {permission === 'denied' && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: '#b91c1c',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            <AlertTriangle size={14} />
            <span>Reset in Browser Site Settings</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default WebPushStatusControl;
