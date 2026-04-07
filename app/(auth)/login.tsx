/**
 * Login — real 2-step phone + OTP flow.
 *
 *   Step 1: phone entry → POST /auth/otp/send → advance to OTP
 *   Step 2: OTP entry   → POST /auth/otp/verify → route based on isNewUser
 *
 * New users → /(auth)/onboarding · Returning users → /(tabs)
 *
 * Dev bypass button still exists as a fallback for when the backend
 * isn't reachable — hidden in production builds.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@/theme';
import { Button, PhoneInput, OtpInput } from '@/components/ui';
import { FadeInUp } from '@/components/animations';
import { haptic } from '@/lib/haptics';
import { useSendOtp, useVerifyOtp } from '@/features/auth/hooks';
import { phoneRawSchema } from '@/features/auth/schemas';
import { auth$ } from '@/stores/auth';

type Step = 'phone' | 'otp';

const RESEND_COOLDOWN_S = 30;

export default function LoginScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('phone');
  const [rawPhone, setRawPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const sendOtpMut = useSendOtp();
  const verifyOtpMut = useVerifyOtp();

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSendOtp() {
    setPhoneError(null);
    const parsed = phoneRawSchema.safeParse(rawPhone);
    if (!parsed.success) {
      setPhoneError(parsed.error.issues[0]?.message ?? 'Invalid phone');
      haptic('error');
      return;
    }
    try {
      await sendOtpMut.mutateAsync(rawPhone);
      setStep('otp');
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setPhoneError(friendlyError(err));
    }
  }

  async function handleVerifyOtp(code: string) {
    setOtpError(null);
    try {
      const result = await verifyOtpMut.mutateAsync({
        rawPhone,
        otp: code,
      });
      // Route based on whether this is a new user or returning.
      if (result.isNewUser) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      setOtpError(friendlyError(err));
      setOtp('');
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return;
    await handleSendOtp();
  }

  function handleBack() {
    haptic('tap');
    setStep('phone');
    setOtp('');
    setOtpError(null);
  }

  function handleDevBypass() {
    haptic('confirm');
    auth$.set({
      ...auth$.get(),
      isAuthenticated: true,
      userId: 'dev-user',
      phone: '+919319788556',
      name: 'Rajesh ji',
      businessId: 'dev-business',
      businessName: 'Sharma General Store',
      businessType: 'kirana',
      businessCity: 'Noida',
      healthScore: 644,
      healthTier: 'gold',
      streakDays: 47,
      badhiyaCoins: 2840,
    });
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'otp' ? (
            <Pressable
              style={styles.backBtn}
              onPress={handleBack}
              accessibilityLabel="Go back"
            >
              <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
            </Pressable>
          ) : null}

          <FadeInUp delay={0}>
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <Text style={styles.brandB}>B</Text>
              </View>
              <Text style={styles.brandName}>BADHIYA</Text>
              <Text style={styles.brandNameHi}>बढ़िया</Text>
              <Text style={styles.tagline}>{t('auth.tagline')}</Text>
            </View>
          </FadeInUp>

          {step === 'phone' ? (
            <FadeInUp delay={80}>
              <View style={styles.formBlock}>
                <Text style={styles.formTitle}>{t('auth.enterPhone')}</Text>
                <Text style={styles.formSubtitle}>
                  Aapke number pe 6-digit OTP bhejenge
                </Text>
                <PhoneInput
                  value={rawPhone}
                  onChangeText={(v) => {
                    setPhoneError(null);
                    setRawPhone(v);
                  }}
                  onSubmitEditing={handleSendOtp}
                  error={phoneError ?? undefined}
                  autoFocus
                  style={styles.input}
                  testID="login-phone"
                />
                <Button
                  label={t('auth.sendOtp')}
                  onPress={handleSendOtp}
                  size="hero"
                  fullWidth
                  loading={sendOtpMut.isPending}
                  disabled={rawPhone.length !== 10}
                  hapticPattern="confirm"
                  style={styles.btn}
                  testID="login-send-otp"
                />
              </View>
            </FadeInUp>
          ) : (
            <FadeInUp delay={80}>
              <View style={styles.formBlock}>
                <Text style={styles.formTitle}>{t('auth.enterOtp')}</Text>
                <Text style={styles.formSubtitle}>
                  +91 {rawPhone.slice(0, 5)} {rawPhone.slice(5)} pe bheja
                </Text>
                <View style={styles.otpWrap}>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    onComplete={handleVerifyOtp}
                    error={!!otpError}
                  />
                </View>
                {otpError ? (
                  <Text style={styles.errorText}>{otpError}</Text>
                ) : null}
                <Button
                  label={t('auth.verify')}
                  onPress={() => handleVerifyOtp(otp)}
                  size="hero"
                  fullWidth
                  loading={verifyOtpMut.isPending}
                  disabled={otp.length !== 6}
                  hapticPattern="confirm"
                  style={styles.btn}
                  testID="login-verify"
                />
                <Pressable
                  onPress={handleResendOtp}
                  disabled={cooldown > 0}
                  style={styles.resendWrap}
                >
                  <Text
                    style={[
                      styles.resendText,
                      cooldown > 0 && styles.resendDisabled,
                    ]}
                  >
                    {cooldown > 0
                      ? `Resend OTP in ${cooldown}s`
                      : 'OTP nahi aaya? Dobara bhejo'}
                  </Text>
                </Pressable>
              </View>
            </FadeInUp>
          )}

          <FadeInUp delay={200}>
            <View style={styles.footer}>
              <View style={styles.tricolor} />
              <Text style={styles.footerText}>Made for Bharat · 100% Indian</Text>
              {__DEV__ ? (
                <Pressable
                  onPress={handleDevBypass}
                  style={styles.devBypass}
                  accessibilityLabel="Dev bypass"
                >
                  <Text style={styles.devBypassText}>
                    Dev Bypass → Dashboard
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </FadeInUp>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function friendlyError(err: unknown): string {
  const e = err as { status?: number; code?: string; message?: string };
  if (e?.status === 0 || (e?.code === 'NETWORK' && !e?.status)) {
    return 'Internet nahi hai. Check karein aur dobara try karein.';
  }
  if (e?.status === 401) return 'OTP galat hai. Dobara try karo.';
  if (e?.status === 429) return 'Zyada requests. Thodi der ruko.';
  if (e?.status && e.status >= 500) return 'Server issue. Thodi der baad try karein.';
  return e?.message ?? 'Kuch gadbad hui. Dobara try karein.';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  brand: {
    alignItems: 'center',
    marginTop: Spacing['3xl'],
    marginBottom: Spacing['4xl'],
  },
  brandMark: {
    width: 80,
    height: 80,
    borderRadius: Radius['3xl'],
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.saffronGlow,
  },
  brandB: {
    color: Colors.white,
    fontSize: 44,
    fontWeight: FontWeight.heavy,
    fontFamily: FontFamily.heading,
  },
  brandName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    letterSpacing: 2,
  },
  brandNameHi: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.h3,
    color: Colors.saffron[600],
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.xs,
  },
  tagline: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  formBlock: { marginBottom: Spacing['3xl'] },
  formTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    marginBottom: Spacing.xl,
  },
  input: { marginBottom: Spacing.xl },
  otpWrap: { marginBottom: Spacing.lg },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  btn: { marginTop: Spacing.md },
  resendWrap: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  resendText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    color: Colors.saffron[600],
    fontWeight: FontWeight.semibold,
  },
  resendDisabled: { color: Colors.ink[400] },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: Spacing['4xl'],
  },
  tricolor: {
    height: 3,
    width: 80,
    borderRadius: 2,
    backgroundColor: Colors.saffron[500],
    marginBottom: Spacing.sm,
  },
  footerText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
  },
  devBypass: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  devBypassText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: Colors.ink[300],
    textDecorationLine: 'underline',
  },
});
