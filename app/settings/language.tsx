/**
 * /settings/language — Bhasha (language) picker.
 *
 * Changes auth$.language in Legend State which triggers i18next
 * language switch globally. Purely client-side — no backend call.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

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
import { auth$, type UserLanguage } from '@/stores/auth';

const LANGUAGES: {
  code: UserLanguage;
  label: string;
  nativeLabel: string;
}[] = [
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hinglish', label: 'Hinglish', nativeLabel: 'Hinglish' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
];

export default function LanguageScreen() {
  const { i18n } = useTranslation();
  const current = auth$.language.get();

  function handleSelect(code: UserLanguage) {
    haptic('tap');
    auth$.language.set(code);
    i18n.changeLanguage(code);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Bhasha</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInUp delay={0}>
          <Text style={styles.hint}>
            App ki bhasha chuno. Hindi default hai — sab screens aur AI
            chat isi bhasha mein hoga.
          </Text>
        </FadeInUp>

        {LANGUAGES.map((lang, i) => {
          const isActive = current === lang.code;
          return (
            <FadeInUp key={lang.code} delay={40 + i * 20}>
              <Pressable
                onPress={() => handleSelect(lang.code)}
                style={({ pressed }) => [
                  styles.langRow,
                  isActive && styles.langRowActive,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langLabel, isActive && styles.langLabelActive]}>
                    {lang.nativeLabel}
                  </Text>
                  <Text style={styles.langSub}>{lang.label}</Text>
                </View>
                {isActive && (
                  <Check color={Colors.saffron[500]} size={20} strokeWidth={2.4} />
                )}
              </Pressable>
            </FadeInUp>
          );
        })}
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
  hint: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[400], lineHeight: 22, marginBottom: Spacing.lg },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  langRowActive: { borderColor: Colors.saffron[500], borderWidth: 1.5, backgroundColor: Colors.saffron[50] },
  langLabel: { fontFamily: FontFamily.heading, fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  langLabelActive: { color: Colors.saffron[600] },
  langSub: { fontFamily: FontFamily.body, fontSize: FontSize.micro, color: Colors.ink[400], marginTop: 2 },
});
