/**
 * /settings/notifications — Notification preferences.
 *
 * Client-side toggles stored in Legend State. Push notification
 * permission is managed via expo-notifications.
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, BellOff } from 'lucide-react-native';

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

export default function NotificationsScreen() {
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [promotions, setPromotions] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInUp delay={0}>
          <Text style={styles.hint}>
            Choose kaun se notifications chahiye. Critical alerts (jaise
            ONDC orders) hamesha aayenge.
          </Text>
        </FadeInUp>

        <FadeInUp delay={40}>
          <View style={styles.card}>
            <ToggleItem
              label="Order Alerts"
              hint="Naye ONDC orders aur status updates"
              value={orderAlerts}
              onToggle={setOrderAlerts}
            />
            <ToggleItem
              label="Payment Alerts"
              hint="Payment received, credit reminders"
              value={paymentAlerts}
              onToggle={setPaymentAlerts}
            />
            <ToggleItem
              label="Stock Alerts"
              hint="Low stock aur reorder reminders"
              value={stockAlerts}
              onToggle={setStockAlerts}
            />
            <ToggleItem
              label="Promotions & Tips"
              hint="Badhiya tips, offers, new features"
              value={promotions}
              onToggle={setPromotions}
              isLast
            />
          </View>
        </FadeInUp>

        <FadeInUp delay={80}>
          <View style={styles.infoCard}>
            <Bell color={Colors.trust[500]} size={18} strokeWidth={2.4} />
            <Text style={styles.infoText}>
              Push notifications ke liye phone settings mein Badhiya app
              ko notification permission deni hogi.
            </Text>
          </View>
        </FadeInUp>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleItem({
  label,
  hint,
  value,
  onToggle,
  isLast,
}: {
  label: string;
  hint: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, !isLast && styles.toggleBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          haptic('tap');
          onToggle(v);
        }}
        trackColor={{ false: Colors.ink[300], true: Colors.saffron[500] }}
        thumbColor={Colors.white}
      />
    </View>
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
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, ...Shadow.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  toggleBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  toggleLabel: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  toggleHint: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400], marginTop: 2 },
  infoCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', backgroundColor: Colors.trust[50], borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.lg },
  infoText: { flex: 1, fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[700], lineHeight: 20 },
});
