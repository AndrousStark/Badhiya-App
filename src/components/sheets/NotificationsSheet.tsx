/**
 * NotificationsSheet — bell icon dropdown.
 *
 * Wires GET /businesses/:id/notifications. Each notification has a tone
 * (profit/loss/warning/saffron/trust) which colors the left bar, and an
 * emoji icon. Tap an item navigates to the relevant screen (stock → Dukan,
 * credit → Khata, sale → Home).
 *
 * Bell button on Home renders an unread count badge based on the query
 * length (no read/unread tracking yet — Phase 10 polish).
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Bell, X } from 'lucide-react-native';

import { BottomSheet } from './BottomSheet';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '@theme';
import { haptic } from '@/lib/haptics';
import { useNotifications } from '@/features/notifications/hooks';
import type { Notification } from '@/features/notifications/schemas';
import { Skeleton } from '@/components/ui';

export interface NotificationsSheetProps {
  visible: boolean;
  onClose: () => void;
}

const TONE_COLORS: Record<string, { left: string; bg: string }> = {
  profit: { left: Colors.profit[500], bg: Colors.profit[50] },
  loss: { left: Colors.loss[500], bg: Colors.loss[50] },
  warning: { left: Colors.warning[500], bg: Colors.warning[50] },
  saffron: { left: Colors.saffron[500], bg: Colors.saffron[50] },
  trust: { left: Colors.trust[500], bg: Colors.trust[50] },
};

export function NotificationsSheet({
  visible,
  onClose,
}: NotificationsSheetProps) {
  const notifQ = useNotifications();
  const notifications = notifQ.data ?? [];

  function handleItemPress(n: Notification) {
    haptic('tap');
    onClose();
    // Route based on notification type
    switch (n.type) {
      case 'stock':
        router.push('/(tabs)/dukan');
        break;
      case 'credit':
        router.push('/(tabs)/khata');
        break;
      case 'sale':
        router.push('/(tabs)');
        break;
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Bell color={Colors.saffron[500]} size={22} strokeWidth={2.4} />
          <Text style={styles.title}>Notifications</Text>
          {notifications.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{notifications.length}</Text>
            </View>
          )}
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
          <X color={Colors.ink[700]} size={20} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {notifQ.isLoading ? (
          <>
            <Skeleton height={64} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={64} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={64} radius={12} style={{ marginBottom: 8 }} />
          </>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔕</Text>
            <Text style={styles.emptyTitle}>Sab badhiya hai!</Text>
            <Text style={styles.emptyBody}>
              Koi alert nahi · Aapka business ekdum theek chal raha hai
            </Text>
          </View>
        ) : (
          notifications.map((n) => {
            const tone = TONE_COLORS[n.tone] ?? TONE_COLORS.trust!;
            return (
              <Pressable
                key={n.id}
                onPress={() => handleItemPress(n)}
                style={({ pressed }) => [
                  styles.row,
                  { borderLeftColor: tone.left, backgroundColor: tone.bg },
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.rowEmoji}>{n.icon}</Text>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowMessage} numberOfLines={2}>
                    {n.message}
                  </Text>
                  <Text style={styles.rowTime}>{n.time}</Text>
                </View>
                <Text style={styles.rowArrow}>›</Text>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  countBadge: {
    backgroundColor: Colors.loss[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: 480,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    marginBottom: Spacing.xs,
  },
  emptyBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    marginBottom: Spacing.sm,
  },
  rowPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  rowEmoji: { fontSize: 22 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowMessage: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.ink[900],
    lineHeight: 18,
  },
  rowTime: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
    marginTop: 2,
  },
  rowArrow: {
    fontSize: 22,
    color: Colors.ink[300],
  },
});
