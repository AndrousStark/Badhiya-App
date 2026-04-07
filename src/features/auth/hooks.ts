/**
 * TanStack Query mutation hooks for the auth flow.
 *
 * On success, verifyOtp stores tokens via the api client and hydrates
 * the Legend State auth store with user + isNewUser flag. The caller
 * just decides where to navigate based on `data.isNewUser`.
 */

import { useMutation } from '@tanstack/react-query';
import { sendOtp, verifyOtp } from './api';
import { api } from '@/lib/api';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';
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

      haptic('confirm');
    },
    onError: () => {
      haptic('error');
    },
  });
}
