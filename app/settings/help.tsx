/**
 * /settings/help — Help & support screen.
 *
 * FAQ items + contact options (WhatsApp, email).
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react-native';

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
import { useState } from 'react';

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Sale kaise record karein?',
    a: 'Home screen pe "Record Sale" button dabao ya voice button se bolo "Raju ko 500 ka saamaan diya".',
  },
  {
    q: 'Credit / Udhaar kaise track karein?',
    a: 'Khata tab mein jaake "+" button dabao. Customer ka naam aur amount daalo. WhatsApp reminder bhi bhej sakte ho.',
  },
  {
    q: 'ONDC pe kaise sell karein?',
    a: 'More > Commerce > ONDC Commerce mein jaake "Register as ONDC Seller" button dabao. 24-48 ghante mein verification ho jayega.',
  },
  {
    q: 'Attendance kaise lagayein?',
    a: 'More > Team > Attendance mein har member ke saamne Present/Absent/Half Day select karo aur Save dabao.',
  },
  {
    q: 'Loan kaise milega?',
    a: 'Paisa tab > Loans section mein pre-approved offers dikhenge. Ek tap mein apply kar sakte ho.',
  },
  {
    q: 'Data safe hai?',
    a: 'Haan, aapka data encrypted hai aur Indian servers pe stored hai. Biometric lock bhi laga sakte ho.',
  },
];

export default function HelpScreen() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function openWhatsApp() {
    haptic('tap');
    Linking.openURL('https://wa.me/919876543210?text=Badhiya%20app%20mein%20madad%20chahiye');
  }

  function openEmail() {
    haptic('tap');
    Linking.openURL('mailto:support@badhiya.app?subject=Help%20Request');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Madad chahiye?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Contact options */}
        <FadeInUp delay={0}>
          <View style={styles.contactRow}>
            <Pressable onPress={openWhatsApp} style={({ pressed }) => [styles.contactCard, pressed && { opacity: 0.92 }]}>
              <MessageCircle color={Colors.profit[500]} size={24} strokeWidth={2.2} />
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactHint}>Turant reply</Text>
            </Pressable>
            <Pressable onPress={openEmail} style={({ pressed }) => [styles.contactCard, pressed && { opacity: 0.92 }]}>
              <Mail color={Colors.trust[500]} size={24} strokeWidth={2.2} />
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactHint}>24 ghante mein</Text>
            </Pressable>
          </View>
        </FadeInUp>

        {/* FAQ */}
        <FadeInUp delay={40}>
          <Text style={styles.faqTitle}>Aksar Puche Jaane Wale Sawaal</Text>
          {FAQ.map((item, i) => {
            const isOpen = expandedIdx === i;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  haptic('tap');
                  setExpandedIdx(isOpen ? null : i);
                }}
                style={[styles.faqItem, isOpen && styles.faqItemOpen]}
              >
                <View style={styles.faqHeader}>
                  <HelpCircle color={Colors.saffron[500]} size={16} strokeWidth={2.2} />
                  <Text style={styles.faqQ}>{item.q}</Text>
                  {isOpen ? (
                    <ChevronUp color={Colors.ink[400]} size={16} strokeWidth={2.2} />
                  ) : (
                    <ChevronDown color={Colors.ink[400]} size={16} strokeWidth={2.2} />
                  )}
                </View>
                {isOpen && <Text style={styles.faqA}>{item.a}</Text>}
              </Pressable>
            );
          })}
        </FadeInUp>

        <FadeInUp delay={80}>
          <Text style={styles.version}>Badhiya v0.1.0 · Made with love for Bharat</Text>
        </FadeInUp>

        <View style={{ height: 60 }} />
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
  contactRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  contactCard: { flex: 1, alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.sm },
  contactLabel: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  contactHint: { fontFamily: FontFamily.body, fontSize: FontSize.micro, color: Colors.ink[400] },
  faqTitle: { fontFamily: FontFamily.heading, fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.ink[900], marginBottom: Spacing.md },
  faqItem: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  faqItemOpen: { borderColor: Colors.saffron[500] },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  faqQ: { flex: 1, fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  faqA: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[500], lineHeight: 22, marginTop: Spacing.sm, paddingLeft: 24 },
  version: { textAlign: 'center', fontFamily: FontFamily.body, fontSize: 10, color: Colors.ink[300], marginTop: Spacing['2xl'] },
});
