/**
 * /settings/biometric — Biometric lock toggle.
 *
 * Uses expo-local-authentication to check device capability.
 * Toggle is persisted in Legend State. The useAutoLock hook in
 * _layout.tsx reads this to enforce re-auth after idle.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Fingerprint, ShieldCheck } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@/theme';
import { haptic } from '@/lib/haptics';
import { FadeInUp } from '@/components/animations';

export default function BiometricScreen() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [authTypes, setAuthTypes] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(compatible && enrolled);
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setAuthTypes(
        types.map((t) => {
          if (t === LocalAuthentication.AuthenticationType.FINGERPRINT) return 'Fingerprint';
          if (t === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) return 'Face ID';
          if (t === LocalAuthentication.AuthenticationType.IRIS) return 'Iris';
          return 'Unknown';
        }),
      );
    })();
  }, []);

  async function handleToggle(value: boolean) {
    haptic('tap');
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Biometric lock enable karne ke liye verify karo',
        cancelLabel: 'Cancel',
      });
      if (result.success) {
        setIsEnabled(true);
      }
    } else {
      setIsEnabled(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Biometric Lock</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInUp delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Fingerprint color={Colors.saffron[500]} size={40} strokeWidth={2} />
            </View>
            <Text style={styles.heroTitle}>App Security</Text>
            <Text style={styles.heroBody}>
              Biometric lock ON karne se app kholne pe fingerprint ya Face
              ID maanga jayega. 10 minute idle rehne pe bhi lock hoga.
            </Text>
          </View>
        </FadeInUp>

        <FadeInUp delay={40}>
          <View style={styles.toggleCard}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Biometric Lock</Text>
                <Text style={styles.toggleHint}>
                  {isAvailable
                    ? `Available: ${authTypes.join(', ')}`
                    : 'Device mein biometric nahi hai'}
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleToggle}
                disabled={!isAvailable}
                trackColor={{ false: Colors.ink[300], true: Colors.saffron[500] }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </FadeInUp>

        <FadeInUp delay={80}>
          <View style={styles.infoCard}>
            <ShieldCheck color={Colors.profit[500]} size={18} strokeWidth={2.4} />
            <Text style={styles.infoText}>
              Aapka data phone pe encrypted rehta hai. Biometric lock ek
              extra layer of security add karta hai.
            </Text>
          </View>
        </FadeInUp>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: { fontFamily: FontFamily.heading, fontSize: FontSize.h2, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  scroll: { padding: Spacing.xl },
  heroCard: { alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing['2xl'], marginBottom: Spacing.lg, ...Shadow.sm },
  heroIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.saffron[50], alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  heroTitle: { fontFamily: FontFamily.heading, fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  heroBody: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[500], textAlign: 'center', lineHeight: 22, marginTop: Spacing.sm, maxWidth: 300 },
  toggleCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, ...Shadow.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  toggleLabel: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  toggleHint: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400], marginTop: 2 },
  infoCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', backgroundColor: Colors.profit[50], borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.lg },
  infoText: { flex: 1, fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[700], lineHeight: 20 },
});
