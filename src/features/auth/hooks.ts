/**
 * TanStack Query mutation hooks for the auth flow.
 *
 * On success, verifyOtp stores tokens via the api client and hydrates
 * the Legend State auth store with user + isNewUser flag. The caller
 * just decides where to navigate based on `data.isNewUser`.
 */

import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendOtp, verifyOtp } from './api';
import { api } from '@/lib/api';
import { auth$, logout as clearAuthState } from '@/stores/auth';
import { haptic } from '@/lib/haptics';
import {
  identify as identifyObservability,
  resetIdentity,
  track,
} from '@/lib/observability';
import type { SendOtpResponse, VerifyOtpResponse } from './schemas';

export function useSendOtp() {
  return useMutation<SendOtpResponse, Error, string>({
    mutationFn: (rawPhone: string) => sendOtp(rawPhone),
    onSuccess: () => {
      haptic('confirm');
    },
    onError: () => {
      haptic('error');
    },
  });
}

interface VerifyArgs {
  rawPhone: string;
  otp: string;
}

export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, Error, VerifyArgs>({
    mutationFn: ({ rawPhone, otp }) => verifyOtp(rawPhone, otp),
    onSuccess: async (data, { rawPhone }) => {
      // Store tokens in Keychain/Keystore via expo-secure-store.
      await api.setAuthTokens(data.accessToken, data.refreshToken);

      // Hydrate the client-side auth store with user info.
      // Business info is null here; onboarding wizard or a later
      // dashboard fetch fills it in.
      auth$.set({
        ...auth$.get(),
        isAuthenticated: true,
        userId: data.user.id,
        phone: data.user.phone,
        name: data.user.name,
        // Business fields stay null until onboarding creates one.
        businessId: null,
        businessName: null,
        businessType: null,
        businessCity: null,
      });

      identifyObservability(data.user.id, data.user.phone);
      track(data.isNewUser ? 'signup_completed' : 'login_completed', {
        isNewUser: data.isNewUser,
      });
      haptic('confirm');
    },
    onError: () => {
      haptic('error');
    },
  });
}

/**
 * Full logout flow — clears tokens, auth state, TanStack cache, and
 * routes back to the login screen. Shows a native confirm dialog by
 * default; pass `{ confirm: false }` to skip (e.g. for forced logouts
 * after refresh failure).
 */
export function useLogout() {
  const queryClient = useQueryClient();

  async function perform(): Promise<void> {
    haptic('error');
    try {
      await api.clearAuthTokens();
    } catch {
      // SecureStore can fail silently on simulator — don't block logout
    }
    track('logout');
    resetIdentity();
    clearAuthState();
    queryClient.clear();
    router.replace('/(auth)/login');
  }

  function logout(options: { confirm?: boolean } = {}): void {
    const shouldConfirm = options.confirm ?? true;
    if (!shouldConfirm) {
      void perform();
      return;
    }
    Alert.alert(
      'Logout karna hai?',
      'Aap wapas login screen par jayenge.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Haan, logout',
          style: 'destructive',
          onPress: () => {
            void perform();
          },
        },
      ],
      { cancelable: true },
    );
  }

  return logout;
}
