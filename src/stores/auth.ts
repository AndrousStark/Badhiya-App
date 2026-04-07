/**
 * Auth state via Legend State v3.
 *
 * Non-secret user profile data is persisted to MMKV (fast sync KV).
 * JWT / refresh tokens themselves live in expo-secure-store
 * (Keystore/Keychain) — see src/lib/api.ts.
 */

import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';

export type UserLanguage =
  | 'hi'      // Hindi — default
  | 'en'      // English
  | 'hinglish'
  | 'mr'      // Marathi
  | 'ta'      // Tamil
  | 'te'      // Telugu
  | 'gu'      // Gujarati
  | 'kn'      // Kannada
  | 'bn'      // Bengali
  | 'pa'      // Punjabi
  | 'ml'      // Malayalam
  | 'or';     // Odia

export type HealthTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  phone: string | null;
  name: string | null;
  language: UserLanguage;

  // Active business context (user may own multiple)
  businessId: string | null;
  businessName: string | null;
  businessType: string | null;
  businessCity: string | null;

  // Health score cached from last dashboard fetch
  healthScore: number | null;
  healthTier: HealthTier | null;

  // Gamification cached
  streakDays: number;
  badhiyaCoins: number;
}

const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  phone: null,
  name: null,
  language: 'hi',
  businessId: null,
  businessName: null,
  businessType: null,
  businessCity: null,
  healthScore: null,
  healthTier: null,
  streakDays: 0,
  badhiyaCoins: 0,
};

export const auth$ = observable<AuthState>(initialState);

// Persist to MMKV. Tokens are NOT persisted here — they go to SecureStore.
syncObservable(auth$, {
  persist: {
    name: 'badhiya.auth',
    plugin: ObservablePersistMMKV,
  },
});

/**
 * Clear auth state. Called on logout.
 * Caller is responsible for also clearing tokens via `api.clearAuthTokens()`.
 */
export function logout(): void {
  auth$.set(initialState);
}

/**
 * Hydrate auth state after a successful login/OTP verification.
 */
export function hydrateAuth(payload: Partial<AuthState> & { isAuthenticated: true }): void {
  auth$.set({
    ...auth$.get(),
    ...payload,
  });
}
