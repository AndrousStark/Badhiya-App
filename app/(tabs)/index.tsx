/**
 * Home (Ghar) — Morning Briefing dashboard.
 *
 * Phase 4 wires this screen to real backend data via TanStack Query
 * and connects the mic FAB to the global voice → NLU → record-sale
 * sheet flow. Mock data is only used as a fallback when offline.
 *
 * This is THE reference screen for the app — every other screen follows
 * its layout rules: FadeInUp entry, warm header, bento KPIs, section
 * labels, WhatsApp-style list rows, AiPill above the tab bar.
 */

import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import { Mic, Bell, Search, Bug, WifiOff } from 'lucide-react-native';
import { useNotifications } from '../../src/features/notifications/hooks';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
  TouchTarget,
} from '../../src/theme';
import { auth$ } from '../../src/stores/auth';
import { haptic } from '../../src/lib/haptics';
import { mockTransactions } from '../../src/lib/mock-data';
import { useGreeting } from '../../src/hooks/useGreeting';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { FadeInUp } from '../../src/components/animations';
import { KpiTile, TxnRow, AiPill } from '../../src/components/dashboard';
import { SectionLabel } from '../../src/components/ui';
import { useSheets } from '../../src/components/sheets';
import { useDashboard } from '../../src/features/businesses/hooks';
import { useTransactions } from '../../src/features/transactions/hooks';
import { syncStatus$, syncPendingTransactions } from '../../src/services/sync';

export default observer(function HomeScreen() {
  const greet = useGreeting();
  const name = auth$.name.get() ?? 'Rajesh ji';
  const shop = auth$.businessName.get() ?? 'Sharma General Store';
  const network = useNetworkStatus();
  const { openVoice, openRecordSale, openNotifications, openSearch } =
    useSheets();
  const pendingCount = syncStatus$.pendingCount.get();
  const notifQ = useNotifications();
  const notifCount = notifQ.data?.length ?? 0;

  // ─── Real backend data ──────────────────────────
  const dashboardQ = useDashboard();
  const txnsQ = useTransactions({ limit: 6 });
  const dash = dashboardQ.data;

  // ─── Auto-sync on network reconnect ─────────────
  const wasOffline = useRef(false);
  useEffect(() => {
    if (!network.isConnected) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current && pendingCount > 0) {
      // Just came back online with pending mutations — push them
      void syncPendingTransactions().then(() => {
        dashboardQ.refetch();
        txnsQ.refetch();
      });
      wasOffline.current = false;
    }
  }, [network.isConnected, pendingCount, dashboardQ, txnsQ]);

  function handleMicPress() {
    haptic('voiceStart');
    // Open voice sheet → on confirm, open record-sale sheet pre-filled
    openVoice({
      onConfirm: (parsed) => {
        openRecordSale({ initial: parsed });
      },
    });
  }

  function handleAiPillPress() {
    haptic('tap');
    router.push('/chat');
  }

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([dashboardQ.refetch(), txnsQ.refetch()]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* ─── Warm header ─────────────────────────── */}
        <FadeInUp delay={0}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.greet}>
                {greet.hi} · {formatClock()}
              </Text>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.shop}>{shop}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                onPress={() => {
                  haptic('tap');
                  openSearch();
                }}
                accessibilityLabel="Search"
              >
                <Search color={Colors.ink[700]} size={20} strokeWidth={2.2} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                onPress={() => {
                  haptic('tap');
                  openNotifications();
                }}
                accessibilityLabel="Notifications"
              >
                <Bell color={Colors.ink[700]} size={20} strokeWidth={2.2} />
                {notifCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {notifCount > 9 ? '9+' : notifCount}
                    </Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.micFab, pressed && styles.micFabPressed]}
                onPress={handleMicPress}
                accessibilityLabel="Voice command"
              >
                <Mic color={Colors.white} size={22} strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>
        </FadeInUp>

        {/* ─── Network / sync status pill ────────────── */}
        {(!network.isConnected || pendingCount > 0) && (
          <View
            style={[
              styles.statusPill,
              network.isConnected
                ? styles.statusPillSyncing
                : styles.statusPillOffline,
            ]}
          >
            <WifiOff color={Colors.white} size={14} strokeWidth={2.4} />
            <Text style={styles.statusPillText}>
              {!network.isConnected
                ? `Offline · ${pendingCount} entries pending sync`
                : `Syncing ${pendingCount} entries…`}
            </Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={dashboardQ.isFetching}
              onRefresh={handleRefresh}
              tintColor={Colors.saffron[500]}
            />
          }
        >
          {/* ─── KPI bento (real data) ───────────────── */}
          <FadeInUp delay={60}>
            <View style={styles.bentoRow}>
              <KpiTile
                label="Aaj ki Bikri"
                value={dash?.todayRevenue ?? 0}
                prefix="₹"
                delta={dash ? `${dash.transactionCount} txns` : 'loading…'}
                deltaDirection="flat"
                tone="saffron"
              />
              <KpiTile
                label="Munafa"
                value={dash?.todayProfit ?? 0}
                prefix="₹"
                delta={dash && dash.todayProfit > 0 ? 'positive' : 'breakeven'}
                deltaDirection={dash && dash.todayProfit > 0 ? 'up' : 'flat'}
                tone="profit"
              />
            </View>
            <View style={[styles.bentoRow, { marginTop: Spacing.sm }]}>
              <KpiTile
                label="Udhaar Baaki"
                value={dash?.totalOutstanding ?? 0}
                prefix="₹"
                delta="all customers"
                deltaDirection="flat"
                tone="neutral"
              />
              <KpiTile
                label="Health Score"
                value={dash?.healthScore ?? 0}
                suffix="/900"
                delta={dash?.healthLevel ?? '—'}
                deltaDirection="flat"
                tone="warning"
              />
            </View>
          </FadeInUp>

          {/* ─── Recent transactions (real data) ─────── */}
          <FadeInUp delay={120}>
            <SectionLabel
              label="Aaj ke Transactions"
              actionLabel="Sab dekho"
              onActionPress={() => {
                haptic('tap');
                router.push('/(tabs)/khata');
              }}
            />
            <View style={styles.txnCard}>
              {(txnsQ.data?.data ?? []).slice(0, 6).map((t) => (
                <TxnRow
                  key={t.id}
                  name={t.item ?? t.customerName ?? 'Transaction'}
                  meta={`${formatTime(t.createdAt)} · ${t.recordedVia}`}
                  amount={t.amount}
                  type={t.type}
                  onPress={() => haptic('tap')}
                />
              ))}
              {/* Empty state — show mock transactions if no real data yet */}
              {!txnsQ.isLoading &&
                (!txnsQ.data || txnsQ.data.data.length === 0) &&
                mockTransactions.map((t) => (
                  <TxnRow
                    key={t.id}
                    name={t.name}
                    meta={t.meta}
                    amount={t.amount}
                    type={t.type}
                    onPress={() => haptic('tap')}
                  />
                ))}
            </View>
          </FadeInUp>

          {/* ─── Sprint 1 debug links (temporary) ────── */}
          <FadeInUp delay={180}>
            <SectionLabel label="Sprint 1 De-risk" />
            <Pressable
              style={({ pressed }) => [styles.debugLink, pressed && styles.debugLinkPressed]}
              onPress={() => router.push('/_debug/voice')}
            >
              <Bug color={Colors.saffron[500]} size={18} strokeWidth={2.4} />
              <Text style={styles.debugText}>Voice round-trip test</Text>
              <Text style={styles.debugArrow}>›</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.debugLink, pressed && styles.debugLinkPressed]}
              onPress={() => router.push('/_debug/sync')}
            >
              <Bug color={Colors.saffron[500]} size={18} strokeWidth={2.4} />
              <Text style={styles.debugText}>Offline sync test</Text>
              <Text style={styles.debugArrow}>›</Text>
            </Pressable>
          </FadeInUp>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ─── AI pill (above tab bar) ─────────────── */}
        <View style={styles.aiPillWrap}>
          <AiPill onPress={handleAiPillPress} />
        </View>
      </SafeAreaView>
    </View>
  );
});

function formatClock(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.saffron[50],
  },
  headerInfo: { flex: 1 },
  greet: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    fontWeight: FontWeight.medium,
  },
  name: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    marginTop: 2,
  },
  shop: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: Colors.saffron[50] },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.loss[500],
    borderWidth: 1.5,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  micFab: {
    width: TouchTarget.comfort,
    height: TouchTarget.comfort,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.saffronGlow,
  },
  micFabPressed: { backgroundColor: Colors.saffron[600] },
  scroll: {
    padding: Spacing.xl,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  txnCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    ...Shadow.sm,
  },
  debugLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  debugLinkPressed: { backgroundColor: Colors.saffron[50] },
  debugText: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
  },
  debugArrow: {
    fontSize: 20,
    color: Colors.ink[300],
  },
  aiPillWrap: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: 84,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  statusPillOffline: {
    backgroundColor: Colors.loss[500],
  },
  statusPillSyncing: {
    backgroundColor: Colors.warning[500],
  },
  statusPillText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
