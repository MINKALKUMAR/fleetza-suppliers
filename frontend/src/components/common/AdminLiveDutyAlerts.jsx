import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircleIcon,
  XCircleIcon,
  VolumeOnIcon,
  VolumeOffIcon,
  XIcon,
  TaxiIcon,
  BellIcon
} from './Icons';

// Web Audio API Synthesizer Chimes
const playChimeSound = (type = 'ACCEPT') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'ACCEPT') {
      // Pleasant bright two-tone chime for duty acceptance
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.55);
    } else {
      // Alert tone for duty decline
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.18); // E4

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (err) {
    console.warn('Audio playback not permitted yet (awaiting user gesture):', err);
  }
};

const AdminLiveDutyAlerts = () => {
  const { user, bookingRequests, vehicles, suppliers } = useAuth();
  const { showToast } = useToast();

  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const [activeAlert, setActiveAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('fleetza_admin_sound') !== 'muted';
  });

  const prevRequestsRef = useRef(new Map());
  const initialLoadRef = useRef(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('fleetza_admin_sound', next ? 'enabled' : 'muted');
    if (next) {
      playChimeSound('ACCEPT');
      showToast('Live duty alert audio enabled', 'info', 2000);
    } else {
      showToast('Live duty alert audio muted', 'info', 2000);
    }
  };

  useEffect(() => {
    if (!isAdmin || !Array.isArray(bookingRequests)) return;

    if (initialLoadRef.current) {
      bookingRequests.forEach((req) => {
        prevRequestsRef.current.set(String(req.id), req.status);
      });
      initialLoadRef.current = false;
      return;
    }

    // Inspect status changes live
    for (const req of bookingRequests) {
      const prevStatus = prevRequestsRef.current.get(String(req.id));
      const currentStatus = req.status;

      if (prevStatus && prevStatus !== currentStatus) {
        if (currentStatus === 'CONFIRMED' || currentStatus === 'DECLINED') {
          const isAccepted = currentStatus === 'CONFIRMED';
          const vehicle = vehicles.find((v) => String(v.id) === String(req.vehicleId));
          const supplier = suppliers.find((s) => String(s.id) === String(req.supplierId || vehicle?.supplierId));

          // EXACT user requirement:
          // "in short notifcation show supplier name city and vehicle group and vehicle number only"
          const supplierName = supplier?.fullName || 'Supplier';
          const city = supplier?.city || 'Punjab';
          const vehicleGroup = vehicle?.name || 'Taxi';
          const vehicleNumber = vehicle?.number || 'VEHICLE';

          const alertObj = {
            id: Date.now() + Math.random(),
            type: isAccepted ? 'ACCEPTED' : 'DECLINED',
            supplierName,
            city,
            vehicleGroup,
            vehicleNumber,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setActiveAlert(alertObj);

          if (soundEnabled) {
            playChimeSound(isAccepted ? 'ACCEPT' : 'DECLINE');
          }

          // Also trigger floating toast with the exact format
          showToast(
            `${isAccepted ? '🟢 ACCEPTED' : '🔴 DECLINED'} · ${supplierName} · ${city} · ${vehicleGroup} · ${vehicleNumber}`,
            isAccepted ? 'success' : 'error',
            6000
          );
        }
      }

      prevRequestsRef.current.set(String(req.id), currentStatus);
    }
  }, [bookingRequests, vehicles, suppliers, isAdmin, soundEnabled, showToast]);

  // Auto-dismiss short notification banner after 10 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  if (!isAdmin) return null;

  return (
    <>
      {activeAlert && (
        <div
          role="alert"
          style={{
            background: activeAlert.type === 'ACCEPTED' ? '#064e3b' : '#7f1d1d',
            color: '#ffffff',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            animation: 'fadeInAlert 0.25s ease',
            border: activeAlert.type === 'ACCEPTED' ? '1px solid #059669' : '1px solid #dc2626'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span
              style={{
                background: activeAlert.type === 'ACCEPTED' ? '#10b981' : '#ef4444',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.75rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                letterSpacing: '0.04em'
              }}
            >
              {activeAlert.type === 'ACCEPTED' ? '✓ ACCEPTED' : '✕ DECLINED'}
            </span>

            <strong style={{ fontSize: '0.95rem' }}>
              {activeAlert.supplierName}
            </strong>
            <span style={{ opacity: 0.85 }}>· {activeAlert.city}</span>
            <span style={{ opacity: 0.85 }}>· {activeAlert.vehicleGroup}</span>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {activeAlert.vehicleNumber}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>
              ({activeAlert.timestamp})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={toggleSound}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
              title={soundEnabled ? 'Mute alert sounds' : 'Unmute alert sounds'}
            >
              {soundEnabled ? <VolumeOnIcon size={14} /> : <VolumeOffIcon size={14} />}
              <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAlert(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.8
              }}
              aria-label="Dismiss"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminLiveDutyAlerts;
