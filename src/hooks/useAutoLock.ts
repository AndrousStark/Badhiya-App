/**
 * useAutoLock — biometric gate after idle timeout.
 *
 * Tracks AppState. When the app goes to background, records the
 * timestamp in MMKV. When it comes back to foreground:
 *   - If < IDLE_TIMEOUT_MS since background → allow
 *   - Else → navigate to /lock (biometric challenge screen)
 *
 * Only runs if the user is authenticated (no point locking the login
 * screen). The preference to enable/disable auto-lock is read from
 * the settings store (not implemented in Phase 3 — defaults to ON).
 *
 * Wire this hook once at the root layout so it listens throughout the
 * app lifetime.
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import { storage, StorageKeys } from '@/lib/storage';
import { auth$ } from '@/stores/auth';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const BACKGROUND_AT_KEY = 'autolock.backgroundedAt';

export function useAutoLock(enabled: boolean = true) {
  const prevState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    const sub = AppState.addEventListener('change', (next) => {
      const prev = prevState.current;
      prevState.current = next;

      // Going to background → record timestamp
      if (
        (prev === 'active' || prev === 'inactive') &&
        (next === 'background' || next === 'inactive')
      ) {
        if (auth$.isAuthenticated.get()) {
          storage.set(BACKGROUND_AT_KEY, Date.now());
        }
      }

      // Coming back to foreground → check idle
      if (next === 'active' && prev !== 'active') {
        if (!auth$.isAuthenticated.get()) return;
        const bgAt = storage.getNumber(BACKGROUND_AT_KEY);
        if (bgAt && Date.now() - bgAt > IDLE_TIMEOUT_MS) {
          storage.delete(BACKGROUND_AT_KEY);
          // Navigate to the biometric lock screen.
          router.replace('/lock');
        }
      }
    });

    return () => sub.remove();
  }, [enabled]);
}

// Expose for Settings screen to read/write the pref in a later sprint
export const autoLockPrefs = {
  getEnabled(): boolean {
    return storage.getBoolean(StorageKeys.debugMode) ?? true;
  },
  setEnabled(enabled: boolean) {
    storage.set(StorageKeys.debugMode, enabled);
  },
};
