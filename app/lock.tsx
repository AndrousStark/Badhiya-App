/**
 * Lock screen — biometric gate triggered by useAutoLock after 10 min idle.
 *
 * Uses expo-local-authentication (Keystore/Keychain) to prompt for
 * fingerprint / Face ID. On success → back to /(tabs). On cancel or
 * failure → user can retry, or logout entirely.
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { Fingerprint, ShieldCheck } from 'lucide-react-native';
import { observer } from '@legendapp/state/react';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@/theme';
import { Button } from '@/components/ui';
import { FadeInUp } from '@/components/animations';
import { auth$, logout } from '@/stores/auth';
import { haptic } from '@/lib/haptics';
import { api } from '@/lib/api';

export default observer(function LockScreen() {
  const [error, setError] = useState<string | null>(null);
  const [attempting, setAttempting] = useState(false);
  const name = auth$.name.get() ?? 'Wapas aapka swagat hai';

  useEffect(() => {
    // Auto-trigger biometric prompt on mount
    void attempt();
  }, []);

  async function attempt() {
    setError(null);
    setAttempting(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !enrolled) {
        // Device doesn't support biometric — fall through to PIN
        // (Phase 3 doesn't implement PIN yet, so we just allow through)
        haptic('confirm');
        router.replace('/(tabs)');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Badhiya kholne ke liye fingerprint lagao',
        cancelLabel: 'Cancel',
        fallbackLabel: 'PIN use karo',
        disableDeviceFallback: false,
      });

      if (result.success) {
        haptic('confirm');
        router.replace('/(tabs)');
      } else if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        setError('Cancel kiya. Dobara try karo.');
      } else {
        setError('Authentication fail hua. Dobara try karein.');
        haptic('error');
      }
    } catch (err) {
      setError((err as Error).message || 'Unknown error');
      haptic('error');
    } finally {
      setAttempting(false);
    }
  }

  async function handleLogout() {
    haptic('tap');
    await api.clearAuthTokens();
    logout();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <FadeInUp delay={0}>
          <View style={styles.iconWrap}>
            <ShieldCheck
              color={Colors.saffron[500]}
              size={80}
              strokeWidth={1.6}
            />
          </View>

          <Text style={styles.greeting}>{name}</Text>
          <Text style={styles.subtitle}>
            Badhiya lock ho gaya hai — fingerprint lagao
          </Text>
        </FadeInUp>

        <FadeInUp delay={80}>
          <Pressable
            onPress={attempt}
            disabled={attempting}
            style={({ pressed }) => [
              styles.fingerprintBtn,
              pressed && styles.fingerprintPressed,
            ]}
            accessibilityLabel="Authenticate with biometric"
          >
            <Fingerprint color={Colors.saffron[500]} size={64} strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.tapHint}>
            Sensor ko touch karo ya button dabao
          </Text>
        </FadeInUp>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={{ flex: 1 }} />

        <FadeInUp delay={160}>
          <Button
            label="Dobara koshish karo"
            onPress={attempt}
            variant="secondary"
            size="lg"
            fullWidth
            disabled={attempting}
          />
          <Pressable onPress={handleLogout} style={styles.logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </FadeInUp>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: {
    flex: 1,
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  iconWrap: {
    marginTop: Spacing['5xl'],
    marginBottom: Spacing['2xl'],
  },
  greeting: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  fingerprintBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.saffron[200],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    ...Shadow.md,
  },
  fingerprintPressed: {
    backgroundColor: Colors.saffron[50],
    borderColor: Colors.saffron[500],
  },
  tapHint: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  errorText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  logout: {
    marginTop: Spacing.xl,
    alignSelf: 'center',
    padding: Spacing.sm,
  },
  logoutText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
    fontWeight: FontWeight.bold,
  },
});
