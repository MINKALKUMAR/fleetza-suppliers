// ============================================================================
// FLEETZA AUDIO ENGINE
// 1. Supplier Duty Dispatch Chime: Pleasant, melodic, modern dispatch chime (replaces loud sirens)
// 2. Notification Chime: Distinct, subtle single-ping for general system & ops notifications
// ============================================================================

let dutyAlertInterval = null;
let titleInterval = null;
let originalTitle = typeof document !== 'undefined' ? document.title : 'Fleetza';
let sharedAudioContext = null;
let audioUnlocked = false;
let dutyAudioElement = null;
let notifAudioElement = null;
let isDutyAlertActive = false;
let isSoundMuted = false;

// 1. In-memory PCM WAV generator for pleasant 4-note melodic chime (HTML5 Audio fallback)
function generateChimeWavDataUri() {
  const sampleRate = 22050;
  const duration = 1.2;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples);

  // RIFF Header
  buffer.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  const fileSize = 36 + numSamples;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  buffer.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"
  buffer.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  buffer.set([16, 0, 0, 0], 16); // Subchunk1Size (16 for PCM)
  buffer.set([1, 0], 20); // AudioFormat (1 = PCM)
  buffer.set([1, 0], 22); // NumChannels (1 = mono)
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  buffer[28] = sampleRate & 0xff; // ByteRate
  buffer[29] = (sampleRate >> 8) & 0xff;
  buffer[30] = (sampleRate >> 16) & 0xff;
  buffer[31] = (sampleRate >> 24) & 0xff;
  buffer.set([1, 0], 32); // BlockAlign
  buffer.set([8, 0], 34); // BitsPerSample
  buffer.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;

  // Synthesize smooth, warm sine waves: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
  const notes = [
    { start: 0.00, end: 0.35, freq: 523.25 },
    { start: 0.18, end: 0.50, freq: 659.25 },
    { start: 0.36, end: 0.70, freq: 783.99 },
    { start: 0.54, end: 1.15, freq: 1046.50 }
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sampleVal = 0;

    for (const note of notes) {
      if (t >= note.start && t < note.end) {
        const noteT = t - note.start;
        const noteDur = note.end - note.start;
        // Smooth attack and natural exponential-like decay
        const env = Math.min(noteT / 0.02, 1) * Math.pow(1 - noteT / noteDur, 1.8);
        sampleVal += Math.sin(2 * Math.PI * note.freq * noteT) * env * 45;
      }
    }

    // 8-bit unsigned PCM center is 128
    const clamped = Math.max(0, Math.min(255, Math.floor(128 + sampleVal)));
    buffer[44 + i] = clamped;
  }

  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// 2. In-memory PCM WAV generator for crisp subtle notification ping (HTML5 Audio fallback)
function generateNotificationPingWavDataUri() {
  const sampleRate = 22050;
  const duration = 0.35;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples);

  // RIFF Header
  buffer.set([0x52, 0x49, 0x46, 0x46], 0);
  const fileSize = 36 + numSamples;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  buffer.set([0x57, 0x41, 0x56, 0x45], 8);
  buffer.set([0x66, 0x6d, 0x74, 0x20], 12);
  buffer.set([16, 0, 0, 0], 16);
  buffer.set([1, 0], 20);
  buffer.set([1, 0], 22);
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  buffer[28] = sampleRate & 0xff;
  buffer[29] = (sampleRate >> 8) & 0xff;
  buffer[30] = (sampleRate >> 16) & 0xff;
  buffer[31] = (sampleRate >> 24) & 0xff;
  buffer.set([1, 0], 32);
  buffer.set([8, 0], 34);
  buffer.set([0x64, 0x61, 0x74, 0x61], 36);
  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;

  // Subtle two-tone bell chime: D5 (587Hz) -> A5 (880Hz)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sampleVal = 0;
    if (t < 0.08) {
      const env = Math.min(t / 0.01, 1) * Math.pow(1 - t / 0.08, 1.2);
      sampleVal += Math.sin(2 * Math.PI * 587.33 * t) * env * 35;
    }
    if (t >= 0.05) {
      const t2 = t - 0.05;
      const dur2 = 0.30;
      const env = Math.min(t2 / 0.015, 1) * Math.pow(1 - t2 / dur2, 2.0);
      sampleVal += Math.sin(2 * Math.PI * 880.00 * t2) * env * 40;
    }

    const clamped = Math.max(0, Math.min(255, Math.floor(128 + sampleVal)));
    buffer[44 + i] = clamped;
  }

  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// 3. Audio Element Getters
function getDutyAudio() {
  if (typeof window === 'undefined') return null;
  if (!dutyAudioElement) {
    try {
      const uri = generateChimeWavDataUri();
      dutyAudioElement = new Audio(uri);
      dutyAudioElement.loop = false;
      dutyAudioElement.volume = 0.45;
      dutyAudioElement.preload = 'auto';
    } catch {
      dutyAudioElement = null;
    }
  }
  return dutyAudioElement;
}

function getNotificationAudio() {
  if (typeof window === 'undefined') return null;
  if (!notifAudioElement) {
    try {
      const uri = generateNotificationPingWavDataUri();
      notifAudioElement = new Audio(uri);
      notifAudioElement.loop = false;
      notifAudioElement.volume = 0.35;
      notifAudioElement.preload = 'auto';
    } catch {
      notifAudioElement = null;
    }
  }
  return notifAudioElement;
}

// 4. Web Audio Context Unlock
export const unlockAudioContext = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioContextClass();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().then(() => {
        audioUnlocked = true;
        if (isDutyAlertActive && !isSoundMuted) {
          playSupplierDutyChime();
        }
      }).catch(() => {});
    } else {
      audioUnlocked = true;
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
};

export const isAudioBlocked = () => {
  if (!sharedAudioContext) return true;
  return sharedAudioContext.state === 'suspended';
};

// 5. Global user gesture listener to unlock audio on first interaction
if (typeof window !== 'undefined') {
  const unlockEvents = ['click', 'touchstart', 'pointerdown', 'keydown'];
  const handleUserInteract = () => {
    unlockAudioContext();
  };
  unlockEvents.forEach((ev) => window.addEventListener(ev, handleUserInteract, { passive: true }));
}

// 6. System Notification Permissions & Dispatch
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') return 'denied';
  
  // Proactively unlock AudioContext on this call
  unlockAudioContext();

  // 6A. Native Capacitor Android FCM Push Registration
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    if (PushNotifications) {
      const permStatus = await PushNotifications.checkPermissions();
      let receive = permStatus.receive;
      if (receive === 'prompt' || receive === 'prompt-with-rationale') {
        const req = await PushNotifications.requestPermissions();
        receive = req.receive;
      }

      if (receive === 'granted') {
        // Create high-priority duty notification channel on Android with loud system alert sound
        try {
          await PushNotifications.createChannel({
            id: 'fleetza_duty_channel',
            name: 'Fleetza Duty Dispatches',
            description: 'High-priority urgent alerts for taxi duty requests',
            importance: 5, // IMPORTANCE_HIGH (makes sound and displays as heads-up notification)
            visibility: 1, // VISIBILITY_PUBLIC (shows on lockscreen)
            sound: 'default',
            vibration: true,
            lights: true,
            lightColor: '#f59e0b'
          });
        } catch {}

        await PushNotifications.register();

        PushNotifications.removeAllListeners();

        PushNotifications.addListener('registration', async (token) => {
          if (token && token.value) {
            try {
              const { authApi } = await import('../api/authApi');
              await authApi.updateFcmToken(token.value);
            } catch {}
          }
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          // Play continuous melodic chime when notification arrives
          playSupplierDutyChime();
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          if (typeof window !== 'undefined') {
            window.location.href = '/supplier/dashboard';
          }
        });

        return 'granted';
      }
    }
  } catch (nativeErr) {
    // Falls back to Web Notifications if running on standard web browser
  }

  // 6B. Standard Web Browser Notifications Fallback
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        const result = await Notification.requestPermission();
        return result;
      } catch {
        return Notification.permission;
      }
    }
    return Notification.permission;
  }
  return 'unsupported';
};

export const showDutySystemNotification = (requestData = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title = '🚕 New Duty Dispatch Available!';
  const body = requestData.dutyType
    ? `Duty: ${requestData.dutyType} | Date: ${requestData.pickupDate || 'Today'} ${requestData.pickupTime || ''} | Tap to view & respond`
    : 'New duty assigned to your vehicle! Review details in your Fleetza portal.';

  // Attempt to deliver via Service Worker for background persistence on mobile
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      try {
        reg.showNotification(title, {
          body,
          icon: '/pwa-icon.svg',
          badge: '/pwa-icon.svg',
          vibrate: [500, 200, 500, 200, 500],
          data: { url: '/supplier/dashboard' },
          requireInteraction: true,
          tag: 'fleetza-duty-alert',
          renotify: true
        });
      } catch (e) {
        // Fallback to postMessage
        if (reg.active) {
          reg.active.postMessage({ type: 'DUTY_ALERT', title, body });
        }
      }
    }).catch(() => {
      try {
        new Notification(title, {
          body,
          icon: '/pwa-icon.svg',
          badge: '/pwa-icon.svg',
          vibrate: [500, 200, 500, 200, 500],
          requireInteraction: true,
          tag: 'fleetza-duty-alert',
          renotify: true
        });
      } catch {}
    });
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: '/pwa-icon.svg',
      badge: '/pwa-icon.svg',
      vibrate: [500, 200, 500, 200, 500],
      requireInteraction: true,
      tag: 'fleetza-duty-alert',
      renotify: true
    });
  } catch {}
};

// ============================================================================
// SOUND SYSTEM 1: SUPPLIER DUTY DISPATCH CHIME (Gentle, Harmonious, Modern)
// Polyphonic melodic chord: C5 -> E5 -> G5 -> C6 (comfortably smooth sine waves)
// ============================================================================
export const playSupplierDutyChime = () => {
  if (isSoundMuted) return;

  try {
    const ctx = unlockAudioContext();
    if (ctx && ctx.state === 'running') {
      const now = ctx.currentTime;

      // Master output gain (soft & pleasant, calibrated around 0.28 peak)
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.28, now);
      masterGain.connect(ctx.destination);

      // 4 Harmonious Chime Notes (C Major Arpeggio: C5, E5, G5, C6)
      const melody = [
        { freq: 523.25, time: now + 0.00, duration: 0.40 }, // C5
        { freq: 659.25, time: now + 0.16, duration: 0.40 }, // E5
        { freq: 783.99, time: now + 0.32, duration: 0.45 }, // G5
        { freq: 1046.50, time: now + 0.48, duration: 0.75 } // C6
      ];

      melody.forEach(({ freq, time, duration }) => {
        // Fundamental tone (smooth pure sine)
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        // Soft attack (prevents clicks) and natural acoustic decay
        noteGain.gain.setValueAtTime(0.0001, time);
        noteGain.gain.exponentialRampToValueAtTime(0.65, time + 0.025);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(time);
        osc.stop(time + duration);

        // Warm subtle overtone for bell richness
        const overtone = ctx.createOscillator();
        const overGain = ctx.createGain();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(freq * 2, time);

        overGain.gain.setValueAtTime(0.0001, time);
        overGain.gain.exponentialRampToValueAtTime(0.12, time + 0.02);
        overGain.gain.exponentialRampToValueAtTime(0.0001, time + (duration * 0.6));

        overtone.connect(overGain);
        overGain.connect(masterGain);

        overtone.start(time);
        overtone.stop(time + duration * 0.6);
      });
    } else {
      // HTML5 Audio fallback
      const audio = getDutyAudio();
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    }

    // Gentle haptic feedback on mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 100, 150]);
    }
  } catch (err) {
    console.debug('Duty chime playback:', err);
  }
};

// Continuous dispatch chime loop (repeats periodically while duty is pending)
export const startSupplierDutyAlert = (requestData = null, intervalMs = 3500) => {
  isDutyAlertActive = true;
  stopSupplierDutyAlert(false);
  isDutyAlertActive = true;

  unlockAudioContext();
  playSupplierDutyChime();

  // Periodic reminder chime
  dutyAlertInterval = window.setInterval(playSupplierDutyChime, intervalMs);

  // Gentle tab title indicator
  if (typeof document !== 'undefined') {
    originalTitle = document.title.replace(/🚕\s*NEW DUTY!\s*/g, '');
    let isFlashed = false;
    titleInterval = window.setInterval(() => {
      document.title = isFlashed ? `🚕 New Duty Available!` : originalTitle;
      isFlashed = !isFlashed;
    }, 1200);
  }

  // System notification
  if (requestData) {
    showDutySystemNotification(requestData);
  }

  return stopSupplierDutyAlert;
};

export const stopSupplierDutyAlert = (resetActiveState = true) => {
  if (resetActiveState) {
    isDutyAlertActive = false;
  }

  if (dutyAlertInterval) {
    window.clearInterval(dutyAlertInterval);
    dutyAlertInterval = null;
  }

  if (titleInterval) {
    window.clearInterval(titleInterval);
    titleInterval = null;
    if (typeof document !== 'undefined') {
      document.title = originalTitle;
    }
  }

  if (dutyAudioElement) {
    try {
      dutyAudioElement.pause();
      dutyAudioElement.currentTime = 0;
    } catch {}
  }

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(0);
  }
};

// ============================================================================
// SOUND SYSTEM 2: GENERAL NOTIFICATION CHIME (Distinct, Crisp Single-Ping)
// Two-tone glass chime: D5 (587Hz) -> A5 (880Hz) - distinct from duty arpeggio
// ============================================================================
export const playNotificationChime = () => {
  if (isSoundMuted) return;

  try {
    const ctx = unlockAudioContext();
    if (ctx && ctx.state === 'running') {
      const now = ctx.currentTime;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.22, now);
      masterGain.connect(ctx.destination);

      // Tone 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(0.5, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Tone 2: A5 (880 Hz) - higher bell ping
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.06);

      gain2.gain.setValueAtTime(0.0001, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.65, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.38);
    } else {
      const audio = getNotificationAudio();
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(80);
    }
  } catch (err) {
    console.debug('Notification chime playback:', err);
  }
};

// Sound preference helpers
export const toggleSoundMute = () => {
  isSoundMuted = !isSoundMuted;
  if (isSoundMuted) {
    stopSupplierDutyAlert(false);
  }
  return isSoundMuted;
};

export const isMuted = () => isSoundMuted;
export const setSoundMuted = (muted) => {
  isSoundMuted = !!muted;
  if (isSoundMuted) {
    stopSupplierDutyAlert(false);
  }
};

// Aliases for seamless backward compatibility across the entire application
export const playNotificationSound = playNotificationChime;
export const startNotificationSound = startSupplierDutyAlert;
export const stopNotificationSound = stopSupplierDutyAlert;
export const playSupplierDutySound = playSupplierDutyChime;
export const startDutyAlarm = startSupplierDutyAlert;
export const stopDutyAlarm = stopSupplierDutyAlert;
export const isRingtonePlaying = () => isDutyAlertActive;
