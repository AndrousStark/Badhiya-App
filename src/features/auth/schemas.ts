/**
 * Zod schemas that mirror the backend auth contracts exactly.
 *
 * Backend contracts (backend/src/modules/auth/dto/auth.schemas.ts):
 *   sendOtp:    { phone: /^[6-9]\d{9}$/ } → transformed to +91XXXXXXXXXX server-side
 *   verifyOtp:  { phone: /^\+91[6-9]\d{9}$/, otp: /^\d{6}$/ }
 *   refresh:    { refreshToken: string }
 *
 * The mobile client sends the 10-digit phone to /otp/send and the
 * +91-prefixed phone to /otp/verify — matching the backend.
 */

import { z } from 'zod';

// ─── 10-digit phone (input on LoginScreen) ────────────────
export const phoneRawSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number');

// ─── +91-prefixed phone (internal) ────────────────────────
export const phoneE164Schema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Invalid phone format');

// ─── 6-digit OTP ──────────────────────────────────────────
export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d+$/, 'OTP must be numeric');

// ─── API request/response shapes ──────────────────────────
export const sendOtpRequestSchema = z.object({
  phone: phoneRawSchema,
});

export const sendOtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const verifyOtpRequestSchema = z.object({
  phone: phoneE164Schema,
  otp: otpSchema,
});

export const userSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
});

export const verifyOtpResponseSchema = z.object({
  accessToken: z.string().min(10),
  refreshToken: z.string().min(10),
  user: userSchema,
  isNewUser: z.boolean(),
});

export const refreshTokenResponseSchema = z.object({
  accessToken: z.string().min(10),
});

// ─── Helpers ──────────────────────────────────────────────
export function toE164(rawPhone: string): string {
  return `+91${rawPhone}`;
}

// ─── Type exports ─────────────────────────────────────────
export type PhoneRaw = z.infer<typeof phoneRawSchema>;
export type SendOtpRequest = z.infer<typeof sendOtpRequestSchema>;
export type SendOtpResponse = z.infer<typeof sendOtpResponseSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpRequestSchema>;
export type VerifyOtpResponse = z.infer<typeof verifyOtpResponseSchema>;
export type User = z.infer<typeof userSchema>;
