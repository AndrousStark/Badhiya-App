/**
 * ONDC Dashboard — main commerce screen.
 *
 * Two states:
 *   1. Not registered → "Register as ONDC seller" hero CTA
 *   2. Registered → stats KPIs, orders list, catalog link, go-live toggle
 *
 * Wires:
 *   - GET /ondc/config (to know which state to show)
 *   - GET /ondc/stats (KPIs)
 *   - GET /ondc/orders (recent 50)
 *   - POST /ondc/toggle (go live / pause)
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Globe,
  Package,
  Power,
  PowerOff,
  ChevronRight,
  ShoppingBag,
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
import { Card, SectionLabel, Skeleton, Button, Badge, Chip } from '@/components/ui';
import { KpiTile } from '@/components/dashboard';
import { useCurrency } from '@/hooks/useCurrency';
import {
  useOndcConfig,
  useOndcStats,
  useOndcOrders,
  useToggleOndcActive,
} from '@/features/ondc/hooks';
import { ORDER_STATE_META } from '@/features/ondc/schemas';
import { useSheets } from '@/components/sheets';

const STATE_FILTERS = [
  { value: undefined, label: 'Sab' },
  { value: 'Created', label: 'Naya' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'In-progress', label: 'Tayyari' },
  { value: 'Completed', label: 'Done' },
] as const;

export default function OndcDashboardScreen() {
  const { format } = useCurrency();
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);
  const configQ = useOndcConfig();
  const statsQ = useOndcStats();
  const ordersQ = useOndcOrders(stateFilter);
  const toggleMut = useToggleOndcActive();
  const { openRegisterOndc } = useSheets();

  const config = configQ.data;
  const isRegistered = config && 'registered' in config && config.registered === true;
  const isActive = isRegistered && config.isActive;

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([
      configQ.refetch(),
      statsQ.refetch(),
      ordersQ.refetch(),
    ]);
  }

  async function handleToggleLive() {
    if (!isRegistered) return;
    const next = !isActive;
    Alert.alert(
      next ? 'Go Live?' : 'Pause selling?',
      next
        ? 'ONDC pe customers aapko dekh sakenge aur orders aane lagenge.'
        : 'Naye orders aana band ho jayenge. Existing orders complete kar sakte ho.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Go Live' : 'Pause',
          onPress: async () => {
            try {
              await toggleMut.mutateAsync(next);
            } catch (err) {
              Alert.alert('Error', (err as Error).message);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>ONDC</Text>
          <Text style={styles.subtitle}>
            {isRegistered
              ? isActive
                ? `Live · ${config.storeName}`
                : `Paused · ${config.storeName}`
              : 'Bharat ka Open Commerce Network'}
          </Text>
        </View>
        {isRegistered && (
          <Badge
            label={isActive ? 'LIVE' : 'PAUSED'}
            tone={isActive ? 'profit' : 'warning'}
          />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={configQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {configQ.isLoading && !config ? (
          <Skeleton height={180} radius={20} />
        ) : !isRegistered ? (
          <NotRegisteredHero onRegister={() => {
            haptic('tap');
            openRegisterOndc();
          }} />
        ) : (
          <>
            {/* ─── Go live toggle ──────────────────────── */}
            <FadeInUp delay={0}>
              <Pressable
                onPress={handleToggleLive}
                style={({ pressed }) => [
                  styles.toggleCard,
                  isActive ? styles.toggleCardLive : styles.toggleCardPaused,
                  pressed && { opacity: 0.92 },
                ]}
              >
                {isActive ? (
                  <Power color={Colors.profit[500]} size={28} strokeWidth={2.4} />
                ) : (
                  <PowerOff color={Colors.warning[500]} size={28} strokeWidth={2.4} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {isActive ? 'Live on ONDC' : 'Currently paused'}
                  </Text>
                  <Text style={styles.toggleSub}>
                    {isActive
                      ? 'Tap to pause selling'
                      : 'Tap to go live'}
                  </Text>
                </View>
              </Pressable>
            </FadeInUp>

            {/* ─── Stats KPI bento ─────────────────────── */}
            <FadeInUp delay={40}>
              <View style={styles.bentoRow}>
                <KpiTile
                  label="Total orders"
                  value={statsQ.data?.totalOrders ?? 0}
                  tone="saffron"
                />
                <KpiTile
                  label="Revenue"
                  value={statsQ.data?.totalRevenue ?? 0}
                  prefix="₹"
                  tone="profit"
                />
              </View>
              <View style={[styles.bentoRow, { marginTop: Spacing.sm }]}>
                <KpiTile
                  label="Pending"
                  value={statsQ.data?.pendingOrders ?? 0}
                  tone="warning"
                />
                <KpiTile
                  label="Completed"
                  value={statsQ.data?.completedOrders ?? 0}
                  tone="profit"
                />
              </View>
            </FadeInUp>

            {/* ─── Catalog link ────────────────────────── */}
            <FadeInUp delay={80}>
              <Pressable
                onPress={() => {
                  haptic('tap');
                  router.push('/ondc/catalog');
                }}
                style={({ pressed }) => [
                  styles.catalogCard,
                  pressed && { opacity: 0.95 },
                ]}
              >
                <View style={styles.catalogLeft}>
                  <View style={styles.catalogIcon}>
                    <Package color={Colors.saffron[600]} size={20} strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={styles.catalogTitle}>ONDC Catalog</Text>
                    <Text style={styles.catalogSub}>
                      Sync products to ONDC network
                    </Text>
                  </View>
                </View>
                <ChevronRight color={Colors.ink[400]} size={20} strokeWidth={2.2} />
              </Pressable>
            </FadeInUp>

            {/* ─── State filter chips ──────────────────── */}
            <FadeInUp delay={120}>
              <SectionLabel label="Recent Orders" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {STATE_FILTERS.map((f) => (
                  <Chip
                    key={f.label}
                    label={f.label}
                    active={stateFilter === f.value}
                    onPress={() => setStateFilter(f.value)}
                  />
                ))}
              </ScrollView>
            </FadeInUp>

            {/* ─── Orders list ─────────────────────────── */}
            {ordersQ.isLoading ? (
              <>
                <Skeleton height={80} radius={12} style={{ marginBottom: 8 }} />
                <Skeleton height={80} radius={12} style={{ marginBottom: 8 }} />
                <Skeleton height={80} radius={12} style={{ marginBottom: 8 }} />
              </>
            ) : (ordersQ.data?.data ?? []).length === 0 ? (
              <View style={styles.empty}>
                <ShoppingBag color={Colors.ink[300]} size={48} strokeWidth={1.6} />
                <Text style={styles.emptyText}>
                  Abhi koi order nahi · Jab customer buy karega, yahan dikhega
                </Text>
              </View>
            ) : (
              (ordersQ.data?.data ?? []).map((order, i) => {
                const meta = ORDER_STATE_META[order.state] ?? {
                  label: order.state,
                  emoji: '📦',
                  tone: 'trust' as const,
                };
                return (
                  <FadeInUp key={order.id} delay={140 + i * 30}>
                    <Pressable
                      onPress={() => {
                        haptic('tap');
                        router.push(`/ondc/orders/${order.id}`);
                      }}
                      style={({ pressed }) => [
                        styles.orderCard,
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <Text style={styles.orderEmoji}>{meta.emoji}</Text>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderCustomer} numberOfLines={1}>
                          {order.customerName}
                        </Text>
                        <Text style={styles.orderMeta}>
                          {order.itemCount} items ·{' '}
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View style={styles.orderRight}>
                        <Text style={styles.orderAmt}>{format(order.total)}</Text>
                        <Badge label={meta.label} tone={meta.tone} />
                      </View>
                    </Pressable>
                  </FadeInUp>
                );
              })
            )}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Not registered hero ─────────────────────────────────
function NotRegisteredHero({ onRegister }: { onRegister: () => void }) {
  return (
    <FadeInUp delay={0}>
      <View style={styles.heroNot}>
        <View style={styles.heroIcon}>
          <Globe color={Colors.saffron[500]} size={48} strokeWidth={1.6} />
        </View>
        <Text style={styles.heroTitle}>India's Open Commerce Network</Text>
        <Text style={styles.heroBody}>
          ONDC ek Government of India ka network hai jo aapki dukan ko 100+
          buyer apps (Paytm, PhonePe, Magicpin) se connect karta hai. Ek baar
          register karo, sabhi platforms par bechain.
        </Text>
        <View style={styles.benefitsList}>
          <BenefitRow emoji="🛒" text="100+ buyer apps · zero commission" />
          <BenefitRow emoji="🚚" text="Self ya 3rd party logistics" />
          <BenefitRow emoji="💰" text="Direct UPI settlement" />
          <BenefitRow emoji="🆓" text="Government-backed · no platform fee" />
        </View>
        <Button
          label="Register as ONDC seller"
          onPress={onRegister}
          size="hero"
          fullWidth
          style={{ marginTop: Spacing.xl }}
          rightIcon={<ChevronRight color={Colors.white} size={18} strokeWidth={2.6} />}
        />
      </View>
    </FadeInUp>
  );
}

function BenefitRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.benefitRow}>
      <Text style={styles.benefitEmoji}>{emoji}</Text>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
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
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
  },
  scroll: { padding: Spacing.xl },

  // Not registered hero
  heroNot: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadow.sm,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.saffron[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsList: {
    width: '100%',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bg,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  benefitEmoji: { fontSize: 18 },
  benefitText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
  },

  // Toggle card
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  toggleCardLive: {
    backgroundColor: Colors.profit[50],
    borderWidth: 1.5,
    borderColor: Colors.profit[500],
  },
  toggleCardPaused: {
    backgroundColor: Colors.warning[50],
    borderWidth: 1.5,
    borderColor: Colors.warning[500],
  },
  toggleTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  toggleSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    marginTop: 2,
  },

  // Bento
  bentoRow: { flexDirection: 'row', gap: Spacing.sm },

  // Catalog link
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadow.sm,
  },
  catalogLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  catalogIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  catalogSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
  },

  // Orders
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[400],
    textAlign: 'center',
    marginTop: Spacing.md,
    maxWidth: 240,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  orderEmoji: { fontSize: 24 },
  orderInfo: { flex: 1, minWidth: 0 },
  orderCustomer: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  orderMeta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 2,
  },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmt: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },
});
