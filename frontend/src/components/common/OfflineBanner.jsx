import React, { useState, useEffect } from 'react';

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: '#dc2626',
        color: '#ffffff',
        padding: '0.65rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: 600,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>📡</span>
      <span>No Internet Connection. Duty updates paused until reconnected.</span>
    </div>
  );
};

export default OfflineBanner;
