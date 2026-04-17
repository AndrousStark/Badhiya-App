/**
 * /settings/privacy — privacy policy + terms links.
 *
 * Play Store requires a privacy policy URL in the app and the store
 * listing. This screen links out to the canonical hosted copies and
 * lists the key data-handling commitments in plain Hindi/English so
 * shopkeepers understand what the app collects before they sign up.
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react-native';

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

const PRIVACY_URL = 'https://badhiya.store/privacy';
const TERMS_URL = 'https://badhiya.store/terms';

interface Commitment {
  title: string;
  body: string;
}

const commitments: Commitment[] = [
  {
    title: 'Aapka data aapka hai',
    body: 'Badhiya aapke business ka data kisi aur ko nahi bechega. Kabhi nahi.',
  },
  {
    title: 'Sirf kaam ke liye access',
    body: 'Camera barcode scan ke liye, microphone voice-entry ke liye, notifications reminders ke liye — iske alawa kuch nahi.',
  },
  {
    title: 'Biometric aap ke phone par rehta hai',
    body: 'Fingerprint Badhiya ke server par nahi jaata. Aapke phone ke Keystore mein secure rehta hai.',
  },
  {
    title: 'GST/Udyam data safe',
    body: 'Compliance numbers encrypted hai. Sirf loan/scheme apply karte samay NBFC / govt portal ke paas bheje jaate hain — aapki permission ke baad.',
  },
  {
    title: 'Delete kabhi bhi kar sakte hain',
    body: '"Account delete karo" button Settings mein hai. 30 din mein saara data hamare servers se hata diya jaata hai.',
  },
];

export default function PrivacyScreen() {
  async function openUrl(url: string) {
    haptic('tap');
    const supported = await Linking.canOpenURL(url);
    if (supported) void Linking.openURL(url);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityLabel="Back"
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Privacy & Terms</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInUp delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <ShieldCheck color={Colors.saffron[500]} size={28} strokeWidth={2.2} />
            </View>
            <Text style={styles.heroTitle}>Aapki privacy, humari responsibility</Text>
            <Text style={styles.heroBody}>
              Badhiya India ke DPDP Act 2023 ke hisaab se banaya gaya hai.
              Neeche panch waade hain jo hum aapse karte hain.
            </Text>
          </View>
        </FadeInUp>

        {commitments.map((c, i) => (
          <FadeInUp key={c.title} delay={40 + i * 25}>
            <View style={styles.row}>
              <View style={styles.rowNumber}>
                <Text style={styles.rowNumberText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{c.title}</Text>
                <Text style={styles.rowBody}>{c.body}</Text>
              </View>
            </View>
          </FadeInUp>
        ))}

        <FadeInUp delay={220}>
          <Pressable
            onPress={() => openUrl(PRIVACY_URL)}
            style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
            accessibilityRole="link"
            testID="settings-privacy-policy-link"
          >
            <ExternalLink color={Colors.saffron[600]} size={18} strokeWidth={2.4} />
            <Text style={styles.linkText}>Full privacy policy (English)</Text>
          </Pressable>
          <Pressable
            onPress={() => openUrl(TERMS_URL)}
            style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
            accessibilityRole="link"
            testID="settings-terms-link"
          >
            <ExternalLink color={Colors.saffron[600]} size={18} strokeWidth={2.4} />
            <Text style={styles.linkText}>Terms of service</Text>
          </Pressable>
        </FadeInUp>

        <Text style={styles.footer}>
          Last updated: {new Date().getFullYear()}-04 · SaveLIFE Foundation · Made in Bharat
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  heroCard: {
    backgroundColor: Colors.saffron[50],
    borderWidth: 1,
    borderColor: Colors.saffron[200],
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  heroBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rowNumber: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowNumberText: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.heavy,
    color: Colors.white,
  },
  rowTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  rowBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    marginTop: 2,
    lineHeight: 20,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  linkPressed: { backgroundColor: Colors.saffron[50] },
  linkText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.saffron[600],
  },
  footer: {
    textAlign: 'center',
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: Spacing['2xl'],
  },
});
