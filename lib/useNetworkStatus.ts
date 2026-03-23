/**
 * React Hook for Network Status Monitoring
 * Provides real-time network connectivity status and error handling
 * 
 * **Validates: Requirement 18.7 - Add network error handling**
 */

import { useState, useEffect, useCallback } from 'react';
import { monitorNetworkStatus, isOnline } from './networkErrorHandler';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: isOnline(),
    wasOffline: false,
    lastOnlineTime: null,
    lastOfflineTime: null
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({
        isOnline: true,
        wasOffline: prev.wasOffline || !prev.isOnline,
        lastOnlineTime: new Date(),
        lastOfflineTime: prev.lastOfflineTime
      }));
    };

    const handleOffline = () => {
      setStatus(prev => ({
        isOnline: false,
        wasOffline: true,
        lastOnlineTime: prev.lastOnlineTime,
        lastOfflineTime: new Date()
      }));
    };

    const cleanup = monitorNetworkStatus(handleOnline, handleOffline);

    return cleanup;
  }, []);

  const resetWasOffline = useCallback(() => {
    setStatus(prev => ({ ...prev, wasOffline: false }));
  }, []);

  return {
    ...status,
    resetWasOffline
  };
}
