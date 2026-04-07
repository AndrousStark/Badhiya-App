/**
 * /settings/gst — GST & Udyam registration info.
 *
 * Displays business compliance details. Currently read-only from
 * auth$ store — editing would use the businesses API.
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
import { ArrowLeft, FileCheck, Building2 } from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@/theme';
import { FadeInUp } from '@/components/animations';
import { Badge } from '@/components/ui';

export default function GstScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>GST & Udyam</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInUp delay={0}>
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <FileCheck color={Colors.saffron[500]} size={24} strokeWidth={2.2} />
            </View>
            <Text style={styles.cardTitle}>GST Registration</Text>
            <Text style={styles.cardBody}>
              Agar aapke paas GST number hai toh ONDC registration aur
              invoicing mein automatically use hoga. GST number ONDC
              seller registration ke time diya tha.
            </Text>
            <View style={styles.statusRow}>
              <Badge label="ONDC MEIN SAVED" tone="profit" />
            </View>
          </View>
        </FadeInUp>

        <FadeInUp delay={40}>
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Building2 color={Colors.trust[500]} size={24} strokeWidth={2.2} />
            </View>
            <Text style={styles.cardTitle}>Udyam Registration</Text>
            <Text style={styles.cardBody}>
              Udyam registration karke government schemes aur subsidies
              ka benefit le sakte ho. Registration free hai aur online
              hota hai udyamregistration.gov.in pe.
            </Text>
            <Text style={styles.infoText}>
              Badhiya app mein aane wale updates mein hum Udyam
              registration mein directly madad karenge.
            </Text>
          </View>
        </FadeInUp>

        <FadeInUp delay={80}>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>
              GST return filing aur compliance reminders jald aayenge
              Badhiya app mein. Stay tuned!
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
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadow.sm },
  cardIcon: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  cardTitle: { fontFamily: FontFamily.heading, fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.ink[900], marginBottom: Spacing.sm },
  cardBody: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[500], lineHeight: 22 },
  statusRow: { flexDirection: 'row', marginTop: Spacing.md },
  infoText: { fontFamily: FontFamily.body, fontSize: FontSize.micro, color: Colors.ink[400], marginTop: Spacing.md, fontStyle: 'italic' },
  tipCard: { flexDirection: 'row', gap: Spacing.md, backgroundColor: Colors.saffron[50], borderRadius: Radius.lg, padding: Spacing.lg },
  tipEmoji: { fontSize: 20 },
  tipText: { flex: 1, fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[700], lineHeight: 20 },
});
