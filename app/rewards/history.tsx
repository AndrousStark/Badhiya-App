/**
 * /rewards/history — Badhiya Coins transaction history.
 *
 * Wires:
 *   - usePointsHistory({ type, source }) → paginated transactions
 *
 * Layout:
 *   - Header: total earned / spent today
 *   - Type filter chips (All / Earned / Bonus / Spent / Penalty)
 *   - Source filter pills (sale / credit_paid / streak / spin / etc.)
 *   - List grouped by date (Today / Yesterday / older dates)
 */

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertCircle,
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
import { Skeleton, Chip, EmptyState } from '@/components/ui';
import { usePointsHistory } from '@/features/gamification/hooks';
import {
  POINT_SOURCE_LABELS,
  type PointTransaction,
} from '@/features/gamification/schemas';

const TYPE_FILTERS = [
  { value: undefined, label: 'Sab' },
  { value: 'earned', label: 'Earned' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'spent', label: 'Spent' },
  { value: 'penalty', label: 'Penalty' },
] as const;

export default function PointsHistoryScreen() {
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const historyQ = usePointsHistory({ type: typeFilter });

  const transactions = historyQ.data?.data ?? [];

  // Group by relative date
  const groups = useMemo(() => groupByDate(transactions), [transactions]);

  // Today summary
  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let earned = 0;
    let spent = 0;
    transactions.forEach((t) => {
      if (!t.createdAt.startsWith(today)) return;
      if (t.type === 'earned' || t.type === 'bonus') earned += t.points;
      else if (t.type === 'spent' || t.type === 'penalty') spent += Math.abs(t.points);
    });
    return { earned, spent };
  }, [transactions]);

  async function handleRefresh() {
    haptic('tap');
    await historyQ.refetch();
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
          <Text style={styles.title}>Coin History</Text>
          <Text style={styles.subtitle}>
            {historyQ.data?.total ?? 0} transactions
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={historyQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Today summary ─────────────────────────── */}
        <FadeInUp delay={0}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <TrendingUp
                  color={Colors.profit[500]}
                  size={18}
                  strokeWidth={2.4}
                />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Aaj earned</Text>
                <Text style={[styles.summaryValue, { color: Colors.profit[500] }]}>
                  +{summary.earned} 🪙
                </Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: Colors.loss[50] }]}>
                <TrendingDown
                  color={Colors.loss[500]}
                  size={18}
                  strokeWidth={2.4}
                />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Aaj spent</Text>
                <Text style={[styles.summaryValue, { color: Colors.loss[500] }]}>
                  −{summary.spent} 🪙
                </Text>
              </View>
            </View>
          </View>
        </FadeInUp>

        {/* ─── Type chips ────────────────────────────── */}
        <FadeInUp delay={40}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {TYPE_FILTERS.map((f) => (
              <Chip
                key={f.label}
                label={f.label}
                active={typeFilter === f.value}
                onPress={() => {
                  haptic('tap');
                  setTypeFilter(f.value);
                }}
              />
            ))}
          </ScrollView>
        </FadeInUp>

        {/* ─── List ──────────────────────────────────── */}
        {historyQ.isLoading && transactions.length === 0 ? (
          <>
            <Skeleton height={60} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={60} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={60} radius={12} />
          </>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Sparkles color={Colors.ink[300]} size={40} strokeWidth={1.6} />}
            title="Koi transaction nahi"
            body="Sale record karte hi yahan transaction dikhega"
          />
        ) : (
          groups.map((group, gi) => (
            <FadeInUp key={group.label} delay={80 + gi * 40}>
              <Text style={styles.groupHeader}>{group.label}</Text>
              {group.items.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </FadeInUp>
          ))
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Transaction row ─────────────────────────────────────
function TransactionRow({ tx }: { tx: PointTransaction }) {
  const isPositive = tx.type === 'earned' || tx.type === 'bonus';
  const isPenalty = tx.type === 'penalty';
  const sourceLabel = POINT_SOURCE_LABELS[tx.source] ?? tx.source;
  const time = formatTime(tx.createdAt);

  return (
    <View style={styles.txRow}>
      <View
        style={[
          styles.txIcon,
          isPositive ? styles.txIconEarn : styles.txIconSpend,
        ]}
      >
        {isPositive ? (
          <TrendingUp color={Colors.profit[500]} size={16} strokeWidth={2.4} />
        ) : isPenalty ? (
          <AlertCircle color={Colors.loss[500]} size={16} strokeWidth={2.4} />
        ) : (
          <TrendingDown color={Colors.loss[500]} size={16} strokeWidth={2.4} />
        )}
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>
          {tx.description || sourceLabel}
        </Text>
        <Text style={styles.txMeta}>
          {sourceLabel} · {time}
        </Text>
      </View>
      <Text
        style={[
          styles.txAmt,
          { color: isPositive ? Colors.profit[500] : Colors.loss[500] },
        ]}
      >
        {isPositive ? '+' : '−'}
        {Math.abs(tx.points)} 🪙
      </Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────
function groupByDate(
  txs: PointTransaction[],
): { label: string; items: PointTransaction[] }[] {
  const groups = new Map<string, PointTransaction[]>();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  for (const tx of txs) {
    const key = tx.createdAt.slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const result: { label: string; items: PointTransaction[] }[] = [];
  for (const [key, items] of groups.entries()) {
    let label: string;
    if (key === todayKey) label = 'Aaj';
    else if (key === yesterdayKey) label = 'Kal';
    else {
      const d = new Date(key);
      label = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    }
    result.push({ label, items });
  }
  return result;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
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

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.profit[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // Group header
  groupHeader: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  // Tx row
  txRow: {
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
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconEarn: { backgroundColor: Colors.profit[50] },
  txIconSpend: { backgroundColor: Colors.loss[50] },
  txInfo: { flex: 1, minWidth: 0 },
  txDesc: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  txMeta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 2,
  },
  txAmt: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
  },
});
