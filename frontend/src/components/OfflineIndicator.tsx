import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import './OfflineIndicator.css';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      // Hide the "Reconnected" message after 3 seconds
      setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div className={`offline-indicator ${showReconnected ? 'reconnected' : 'offline'}`}>
      <div className="offline-content">
        {isOffline ? (
          <>
            <WifiOff size={16} />
            <span>Koneksi internet terputus. Mode offline aktif.</span>
          </>
        ) : (
          <>
            <span className="online-dot"></span>
            <span>Koneksi kembali normal.</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
