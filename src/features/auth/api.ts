/**
 * Auth API — thin wrapper around the shared REST client.
 *
 * Every response is Zod-validated at the boundary before being
 * returned. The caller never sees raw axios types.
 */

import { api } from '@/lib/api';
import {
  sendOtpResponseSchema,
  verifyOtpResponseSchema,
  refreshTokenResponseSchema,
  toE164,
  type SendOtpResponse,
  type VerifyOtpResponse,
} from './schemas';

/**
 * Send a 6-digit OTP to the given phone number.
 * @param rawPhone — 10 digits, starts with 6-9 (validated upstream)
 */
export async function sendOtp(rawPhone: string): Promise<SendOtpResponse> {
  const data = await api.post<unknown>('/auth/otp/send', { phone: rawPhone });
  return sendOtpResponseSchema.parse(data);
}

/**
 * Verify an OTP and exchange it for JWT + refresh token.
 * @param rawPhone — 10-digit phone as entered by user (no +91)
 * @param otp — 6-digit code from SMS/console
 */
export async function verifyOtp(
  rawPhone: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  const data = await api.post<unknown>('/auth/otp/verify', {
    phone: toE164(rawPhone),
    otp,
  });
  return verifyOtpResponseSchema.parse(data);
}

/**
 * Exchange a refresh token for a fresh access token.
 * Used by the axios interceptor in src/lib/api.ts on 401 responses.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string }> {
  const data = await api.post<unknown>('/auth/token/refresh', { refreshToken });
  return refreshTokenResponseSchema.parse(data);
}
