/**
 * Admin auth state — separate from regular user auth.
 *
 * Admin uses email+password login (not phone OTP).
 * Token + profile stored in Legend State with MMKV persistence.
 */

import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';

export interface AdminAuthState {
  isAuthenticated: boolean;
  token: string | null;
  id: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
  permissions: string[];
}

const initialState: AdminAuthState = {
  isAuthenticated: false,
  token: null,
  id: null,
  email: null,
  name: null,
  role: null,
  permissions: [],
};

export const adminAuth$ = observable<AdminAuthState>(initialState);

syncObservable(adminAuth$, {
  persist: {
    name: 'badhiya.admin-auth',
    plugin: ObservablePersistMMKV,
  },
});

export function hydrateAdminAuth(token: string, admin: {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}): void {
  adminAuth$.set({
    isAuthenticated: true,
    token,
    ...admin,
  });
}

export function adminLogout(): void {
  adminAuth$.set(initialState);
}
