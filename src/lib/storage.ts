/**
 * MMKV instance — single source for key-value storage.
 *
 * react-native-mmkv is ~30x faster than AsyncStorage, synchronous,
 * and AES-256 encryption capable. Used for:
 *   - Legend State persistence (via ObservablePersistMMKV)
 *   - Non-secret user preferences
 *   - Cached API responses (short-lived)
 *
 * DO NOT store secrets here. Use `expo-secure-store` for tokens,
 * PIN hashes, refresh tokens — anything in a Keystore/Keychain.
 */

import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'badhiya.main',
  // Encrypt the whole store with a device-specific key.
  // encryptionKey: 'TODO: derive from expo-secure-store on first launch'
});

/**
 * Typed helpers so feature modules don't sprinkle string keys everywhere.
 */
export const StorageKeys = {
  // Auth store (managed by Legend State persistence plugin)
  authState: 'badhiya.auth',

  // UI prefs
  hapticLevel:     'ui.haptics.level',
  language:        'ui.language',
  theme:           'ui.theme',

  // Sync state
  lastSyncedAt:    'sync.lastSyncedAt',
  pendingMutations: 'sync.pendingMutations',

  // Debug flags
  debugMode:       'debug.enabled',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
