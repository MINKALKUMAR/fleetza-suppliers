import React, { useState, useEffect } from 'react';
import { Download, Check, Sparkles } from 'lucide-react';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction for browser
      alert(
        'To install Fleetza shortcut:\n\n' +
        '• On Chrome/Edge: Click the install icon (🖥️ or ➕) in the address bar, or Menu (⋮) > "Install Fleetza" or "Add to Home Screen".\n' +
        '• On Mobile: Tap browser menu (⋮) > "Add to Home screen".'
      );
    }
  };

  if (isInstalled) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: '0.72rem',
          color: '#10b981',
          fontWeight: 600,
          background: '#ecfdf5',
          padding: '0.2rem 0.55rem',
          borderRadius: '9999px'
        }}
        title="Fleetza is installed as App Shortcut on this device"
      >
        <Check size={12} />
        <span>App Installed</span>
      </span>
    );
  }

  return (
    <div className="navbar-pwa-install-wrap">
      <button
        type="button"
        onClick={handleInstallClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          padding: '0.3rem 0.65rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
          transition: 'all 0.15s ease'
        }}
        title="Install Fleetza as standalone app on Desktop or Mobile home screen"
      >
        <Download size={12} color="#ffffff" />
        <span>Install App</span>
      </button>
    </div>
  );
};

export default PwaInstallPrompt;
