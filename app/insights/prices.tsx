/**
 * /insights/prices — Competitor price tracker.
 *
 * Wires:
 *   - useTrackedProducts() — products being tracked
 *   - usePriceAlerts() — active alerts
 *   - useTrackProduct() — start tracking
 *   - useUntrackProduct() — stop tracking
 *   - useMarkAlertRead() — dismiss alert
 *   - useRefreshPrices() — force refresh
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  X,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
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
import { Button, Skeleton, SectionLabel, Badge, EmptyState } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import {
  useTrackedProducts,
  usePriceAlerts,
  useTrackProduct,
  useUntrackProduct,
  useMarkAlertRead,
  useRefreshPrices,
} from '@/features/intelligence/hooks';
import {
  PLATFORM_META,
  SEVERITY_META,
  type TrackedProduct,
  type PriceAlert,
} from '@/features/intelligence/schemas';

export default function PriceTrackerScreen() {
  const { format } = useCurrency();
  const trackedQ = useTrackedProducts();
  const alertsQ = usePriceAlerts();
  const trackMut = useTrackProduct();
  const untrackMut = useUntrackProduct();
  const readMut = useMarkAlertRead();
  const refreshMut = useRefreshPrices();

  const tracked = trackedQ.data ?? [];
  const alerts = alertsQ.data ?? [];
  const unreadAlerts = alerts.filter((a) => !a.isRead);

  const [showTrack, setShowTrack] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([trackedQ.refetch(), alertsQ.refetch()]);
  }

  async function handleTrack() {
    if (trackQuery.trim().length < 2) {
      Alert.alert('Product name daalo', 'Kam se kam 2 characters');
      return;
    }
    try {
      await trackMut.mutateAsync({
        searchQuery: trackQuery.trim(),
        platforms: ['blinkit', 'zepto', 'bigbasket'],
      });
      setTrackQuery('');
      setShowTrack(false);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  function handleUntrack(id: string, name: string) {
    Alert.alert(`"${name}" track band karein?`, '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: () => untrackMut.mutate(id),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Price Tracker</Text>
          <Text style={styles.subtitle}>
            {tracked.length} tracked · {unreadAlerts.length} alerts
          </Text>
        </View>
        <Pressable
          onPress={() => {
            haptic('tap');
            refreshMut.mutate();
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <RefreshCw color={Colors.ink[700]} size={18} strokeWidth={2.2} />
        </Pressable>
        <Pressable
          onPress={() => setShowTrack(true)}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
        >
          <Plus color={Colors.saffron[500]} size={20} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={trackedQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Alerts ────────────────────────────────── */}
        {unreadAlerts.length > 0 && (
          <FadeInUp delay={0}>
            <SectionLabel label={`Alerts · ${unreadAlerts.length}`} />
            {unreadAlerts.map((alert) => {
              const sev = SEVERITY_META[alert.severity] ?? SEVERITY_META.medium;
              const plat = PLATFORM_META[alert.platform];
              return (
                <Pressable
                  key={alert.id}
                  onPress={() => readMut.mutate(alert.id)}
                  style={({ pressed }) => [
                    styles.alertCard,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <Text style={styles.alertEmoji}>{sev.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertName} numberOfLines={1}>
                      {alert.productName}
                    </Text>
                    <Text style={styles.alertMeta}>
                      {plat?.label ?? alert.platform}: {format(alert.competitorPrice)} vs {format(alert.yourPrice)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.alertDiff,
                      {
                        color:
                          alert.priceDifference < 0
                            ? Colors.loss[500]
                            : Colors.profit[500],
                      },
                    ]}
                  >
                    {alert.priceDifference > 0 ? '+' : ''}{format(alert.priceDifference)}
                  </Text>
                </Pressable>
              );
            })}
          </FadeInUp>
        )}

        {/* ─── Tracked products ──────────────────────── */}
        <FadeInUp delay={40}>
          <SectionLabel label={`Tracked Products · ${tracked.length}`} />
        </FadeInUp>

        {trackedQ.isLoading && tracked.length === 0 ? (
          <>
            <Skeleton height={120} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={120} radius={12} />
          </>
        ) : tracked.length === 0 ? (
          <EmptyState
            icon={<Eye color={Colors.ink[300]} size={40} strokeWidth={1.6} />}
            title="Koi product track nahi ho raha"
            body="'+' tap karke Blinkit/Zepto/BigBasket pe kisi bhi product ka price track karo"
            actionLabel="Track a Product"
            onAction={() => setShowTrack(true)}
          />
        ) : (
          tracked.map((tp, i) => (
            <FadeInUp key={tp.id} delay={60 + i * 25}>
              <View style={styles.trackedCard}>
                <View style={styles.trackedHeader}>
                  <Text style={styles.trackedName} numberOfLines={1}>
                    {tp.searchQuery}
                  </Text>
                  <Pressable
                    onPress={() => handleUntrack(tp.id, tp.searchQuery)}
                    hitSlop={8}
                  >
                    <Trash2
                      color={Colors.loss[500]}
                      size={16}
                      strokeWidth={2.2}
                    />
                  </Pressable>
                </View>
                <View style={styles.trackedPlatforms}>
                  {tp.platforms.map((p) => {
                    const meta = PLATFORM_META[p];
                    return (
                      <View key={p} style={styles.platformPill}>
                        <Text style={styles.platformEmoji}>
                          {meta?.emoji ?? '📦'}
                        </Text>
                        <Text style={styles.platformLabel}>
                          {meta?.label ?? p}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                {tp.latestPrices.length > 0 && (
                  <View style={styles.pricesRow}>
                    {tp.latestPrices.slice(0, 4).map((lp) => {
                      const pm = PLATFORM_META[lp.platform];
                      return (
                        <View key={lp.id} style={styles.priceChip}>
                          <Text style={styles.priceChipPlat}>
                            {pm?.emoji ?? '📦'} {pm?.label ?? lp.platform}
                          </Text>
                          <Text style={styles.priceChipAmt}>
                            {format(lp.price)}
                          </Text>
                          {!lp.available && (
                            <EyeOff
                              color={Colors.ink[400]}
                              size={10}
                              strokeWidth={2}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
                {tp.lastCheckedAt && (
                  <Text style={styles.trackedTime}>
                    Last checked: {formatTime(tp.lastCheckedAt)}
                  </Text>
                )}
              </View>
            </FadeInUp>
          ))
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ─── Track product modal ─────────────────────── */}
      <Modal
        visible={showTrack}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTrack(false)}
      >
        <Pressable
          style={styles.modalBg}
          onPress={() => setShowTrack(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Track New Product</Text>
              <Pressable onPress={() => setShowTrack(false)} hitSlop={8}>
                <X color={Colors.ink[400]} size={22} strokeWidth={2.2} />
              </Pressable>
            </View>
            <Text style={styles.modalHint}>
              Product ka naam likhiye — Blinkit, Zepto, BigBasket pe price
              automatically check hoga
            </Text>
            <TextInput
              value={trackQuery}
              onChangeText={setTrackQuery}
              placeholder="Tata Salt, Amul Butter, Maggi…"
              placeholderTextColor={Colors.ink[300]}
              style={styles.modalInput}
              autoFocus
            />
            <Button
              label="Start Tracking"
              onPress={handleTrack}
              loading={trackMut.isPending}
              size="lg"
              fullWidth
              style={{ marginTop: Spacing.lg }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: {
    fontFamily: FontFamily.heading, fontSize: FontSize.h2,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  subtitle: {
    fontFamily: FontFamily.body, fontSize: FontSize.micro,
    color: Colors.ink[400], marginTop: 2,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: Colors.saffron[50], borderWidth: 1,
    borderColor: Colors.saffron[500],
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: Spacing.xl },

  // Alerts
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  alertEmoji: { fontSize: 18 },
  alertName: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  alertMeta: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400], marginTop: 2,
  },
  alertDiff: {
    fontFamily: FontFamily.monoBold, fontSize: FontSize.label, fontWeight: FontWeight.heavy,
  },

  // Tracked
  trackedCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  trackedHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  trackedName: {
    flex: 1, fontFamily: FontFamily.bodyBold, fontSize: FontSize.label,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  trackedPlatforms: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm,
  },
  platformPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.bg, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  platformEmoji: { fontSize: 11 },
  platformLabel: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[500],
  },
  pricesRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  priceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.saffron[50], borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  priceChipPlat: {
    fontFamily: FontFamily.body, fontSize: 10, color: Colors.ink[500],
  },
  priceChipAmt: {
    fontFamily: FontFamily.monoBold, fontSize: 12, fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  trackedTime: {
    fontFamily: FontFamily.body, fontSize: 10, color: Colors.ink[400],
    marginTop: Spacing.sm,
  },

  // Modal
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: FontFamily.heading, fontSize: FontSize.h3,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  modalHint: {
    fontFamily: FontFamily.body, fontSize: FontSize.caption,
    color: Colors.ink[400], lineHeight: 20, marginBottom: Spacing.md,
  },
  modalInput: {
    fontFamily: FontFamily.body, fontSize: FontSize.body,
    color: Colors.ink[900], backgroundColor: Colors.bg,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4,
  },
});
