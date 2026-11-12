import React, { useState, useEffect } from 'react';
import Download from 'lucide-react/dist/esm/icons/download.mjs';
import Check from 'lucide-react/dist/esm/icons/check.mjs';
import Share from 'lucide-react/dist/esm/icons/share.mjs';
import PlusSquare from 'lucide-react/dist/esm/icons/plus-square.mjs';
import Monitor from 'lucide-react/dist/esm/icons/monitor.mjs';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone.mjs';
import X from 'lucide-react/dist/esm/icons/x.mjs';
import { isIosDevice, isStandalonePwa } from '../../utils/notificationSound';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandalonePwa());
  const [showGuideModal, setShowGuideModal] = useState(false);
  const isIos = isIosDevice();

  useEffect(() => {
    if (isStandalonePwa()) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuideModal(false);
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
      try {
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch {}
      setDeferredPrompt(null);
      return;
    }

    // Show rich device-specific install instructions modal (iPhone Safari 16.4+, Chrome/Edge address bar)
    setShowGuideModal(true);
  };

  if (isInstalled) {
    return (
      <span
        className="pwa-installed-badge"
        title="Fleetza PWA is installed on this device"
      >
        <Check size={12} />
        <span>App Installed</span>
      </span>
    );
  }

  return (
    <>
      <div className="navbar-pwa-install-wrap">
        <button
          type="button"
          className="pwa-install-btn"
          onClick={handleInstallClick}
          title="Install Fleetza as a standalone PWA on Android, iPhone, Windows, or Mac"
        >
          <Download size={13} color="#ffffff" />
          <span>Install App</span>
        </button>
      </div>

      {showGuideModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowGuideModal(false);
          }}
          style={{ zIndex: 10000 }}
        >
          <section
            className="edit-modal edit-modal--compact"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-header-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isIos ? <Smartphone size={18} /> : <Monitor size={18} />}
                </div>
                <div>
                  <span className="eyebrow" style={{ display: 'block', marginBottom: '2px' }}>PWA Quick Install</span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                    {isIos ? 'Install on iPhone / iPad (Safari)' : 'Install Fleetza App'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close install guide"
              >
                <X size={16} />
              </button>
            </div>

            {isIos ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#334155' }}>
                <p style={{ margin: 0, lineHeight: 1.5 }}>
                  Install Fleetza on your iPhone Home Screen (iOS 16.4+) for full-screen mode and instant Web Push notifications:
                </p>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <Share size={17} color="#2563eb" />
                    <span><strong>1.</strong> Tap the <strong>Share</strong> icon in Safari&apos;s bottom bar.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <PlusSquare size={17} color="#2563eb" />
                    <span><strong>2.</strong> Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <Check size={17} color="#16a34a" />
                    <span><strong>3.</strong> Open the <strong>Fleetza</strong> icon on your Home Screen and tap Allow Notifications.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#334155' }}>
                <p style={{ margin: 0, lineHeight: 1.5 }}>
                  Run Fleetza like a native desktop or Android app — no Play Store or download required:
                </p>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div>
                    <strong>Android (Chrome):</strong> Tap the browser menu (<strong>&#8942;</strong>) &rarr; <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.
                  </div>
                  <div>
                    <strong>Windows / Mac (Chrome or Edge):</strong> Click the <strong>Install icon</strong> on the right side of the address bar, then pin Fleetza to your taskbar or dock.
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                style={{
                  background: '#1e40af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Got It
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default PwaInstallPrompt;
