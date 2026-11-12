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
    <div className="offline-banner" role="status">
      <span style={{ fontSize: '1.1rem' }}>📡</span>
      <span>No Internet Connection. Duty updates paused until reconnected.</span>
    </div>
  );
};

export default OfflineBanner;
