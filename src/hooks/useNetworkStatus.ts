/**
 * useNetworkStatus — reactive network connectivity hook.
 *
 * Wraps expo-network to give components a reactive `isConnected`
 * boolean. Polls every 5 seconds (lightweight) and listens to AppState
 * changes to refresh on foreground.
 *
 * Used by:
 *   - Sync engine to know when to push pending mutations
 *   - UI status pill (red banner when offline)
 *   - Voice sheet to disable mic when no internet
 */

import { useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';

const POLL_INTERVAL_MS = 5_000;

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });

  const refresh = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: (state.type as string | null) ?? null,
      });
    } catch {
      // expo-network can fail on emulators — assume connected
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [refresh]);

  return status;
}
