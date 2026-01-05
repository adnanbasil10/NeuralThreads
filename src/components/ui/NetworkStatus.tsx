'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, CloudOff } from 'lucide-react';

interface NetworkContextValue {
  isOnline: boolean;
  wasOffline: boolean;
  pendingActions: number;
  addPendingAction: (action: () => Promise<void>) => void;
  retryPendingActions: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

// Network Provider
export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingActions, setPendingActions] = useState<Array<() => Promise<void>>>([]);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check initial status (only on client)
    if (typeof window === 'undefined') return;
    
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Auto-hide reconnected message after 3s
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Retry pending actions when back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      retryPendingActions();
    }
  }, [isOnline]);

  const addPendingAction = useCallback((action: () => Promise<void>) => {
    setPendingActions((prev) => [...prev, action]);
  }, []);

  const retryPendingActions = useCallback(async () => {
    const actions = [...pendingActions];
    setPendingActions([]);

    for (const action of actions) {
      try {
        await action();
      } catch (error) {
        console.error('Failed to retry action:', error);
        // Re-add failed action
        setPendingActions((prev) => [...prev, action]);
      }
    }
  }, [pendingActions]);

  return (
    <NetworkContext.Provider 
      value={{ 
        isOnline, 
        wasOffline, 
        pendingActions: pendingActions.length,
        addPendingAction,
        retryPendingActions,
      }}
    >
      {children}
      
      {/* Offline Banner */}
      {!isOnline && showBanner && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gray-900 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm animate-slide-down">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features may be unavailable.</span>
        </div>
      )}

      {/* Reconnected Banner */}
      {isOnline && wasOffline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm animate-slide-down">
          <Wifi className="w-4 h-4" />
          <span>Back online!</span>
          {pendingActions.length > 0 && (
            <button 
              onClick={retryPendingActions}
              className="ml-2 flex items-center gap-1 underline"
            >
              <RefreshCw className="w-3 h-3" />
              Sync {pendingActions.length} pending changes
            </button>
          )}
        </div>
      )}

    </NetworkContext.Provider>
  );
}

// Network Hook
export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

// Offline-aware fetch wrapper
export async function offlineFetch(
  url: string, 
  options?: RequestInit,
  onOffline?: () => void
): Promise<Response> {
  if (!navigator.onLine) {
    onOffline?.();
    throw new Error('You are offline. Please check your internet connection.');
  }

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (!navigator.onLine) {
      onOffline?.();
      throw new Error('Connection lost. Please check your internet connection.');
    }
    throw error;
  }
}

// Offline indicator component
export function OfflineIndicator() {
  const { isOnline, pendingActions } = useNetwork();

  if (isOnline && pendingActions === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-lg ${
        isOnline 
          ? 'bg-amber-100 text-amber-800'
          : 'bg-gray-800 text-white'
      }`}>
        {isOnline ? (
          <>
            <CloudOff className="w-4 h-4" />
            {pendingActions} pending
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            Offline
          </>
        )}
      </div>
    </div>
  );
}

export default NetworkProvider;

