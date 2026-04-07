/**
 * Khata (Credit Book) — Phase 5 real data + actions.
 *
 * Replaces the Phase 2 mock with:
 *   - useCreditSummary() — header KPIs (total outstanding, urgent count)
 *   - useCustomers() — full list with status mapping
 *   - useSendBulkReminders() — bulk WhatsApp via backend
 *   - openWhatsAppReminder() — single-customer wa.me deep link
 *   - openGiveCredit() — global sheet
 *
 * Pull-to-refresh, filter chips work, FAB to add credit, bulk-remind
 * action in the header when >0 overdue. WhatsApp reminder is the
 * killer interaction — tap → wa.me opens with pre-filled Hindi message.
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
import { Search, MessageCircle, Plus, Send } from 'lucide-react-native';

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
import { haptic } from '../../src/lib/haptics';
import { openWhatsAppReminder } from '../../src/lib/whatsapp';
import { FadeInUp } from '../../src/components/animations';
import { Badge, Chip } from '../../src/components/ui';
import { useCurrency } from '../../src/hooks/useCurrency';
import {
  useCustomers,
  useCreditSummary,
  useSendBulkReminders,
} from '../../src/features/customers/hooks';
import type {
  Customer,
  CustomerStatus,
} from '../../src/features/customers/schemas';
import { useSheets } from '../../src/components/sheets';

type Filter = 'all' | 'urgent' | 'aging' | 'ok';

export default function KhataScreen() {
  const { format } = useCurrency();
  const [filter, setFilter] = useState<Filter>('all');

  const customersQ = useCustomers();
  const summaryQ = useCreditSummary();
  const bulkRemindMut = useSendBulkReminders();
  const { openGiveCredit, openSearch } = useSheets();

  const customers = customersQ.data ?? [];

  const counts = useMemo(() => {
    return {
      all: customers.length,
      urgent: customers.filter((c) => c.status === 'urgent').length,
      aging: customers.filter((c) => c.status === 'aging').length,
      ok: customers.filter((c) => c.status === 'ok').length,
      paid: customers.filter((c) => c.status === 'paid').length,
    };
  }, [customers]);

  const filtered = useMemo(() => {
    if (filter === 'all') return customers;
    return customers.filter((c) => c.status === filter);
  }, [customers, filter]);

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([customersQ.refetch(), summaryQ.refetch()]);
  }

  async function handleBulkRemind() {
    haptic('tap');
    try {
      const result = await bulkRemindMut.mutateAsync();
      console.log(
        `Bulk reminded: ${result.sent} sent, ${result.failed} failed`,
      );
    } catch (err) {
      console.warn('Bulk remind failed:', err);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ──────────────────────────────────── */}
      <FadeInUp delay={0}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Khata</Text>
            <Text style={styles.subtitle}>
              {customers.length} customers ·{' '}
              {format(summaryQ.data?.totalOutstanding ?? 0)} pending
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
            onPress={() => {
              haptic('tap');
              openSearch();
            }}
            accessibilityLabel="Search customers"
          >
            <Search color={Colors.ink[700]} size={20} strokeWidth={2.2} />
          </Pressable>
        </View>
      </FadeInUp>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={customersQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Summary card ───────────────────────────── */}
        <FadeInUp delay={40}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Total Pending</Text>
                <Text style={styles.summaryAmt}>
                  {format(summaryQ.data?.totalOutstanding ?? 0)}
                </Text>
              </View>
              {(summaryQ.data?.overdue60Plus ?? 0) > 0 && (
                <View style={styles.urgentBox}>
                  <Text style={styles.urgentLabel}>60+ days overdue</Text>
                  <Text style={styles.urgentAmt}>
                    {format(summaryQ.data!.overdue60Plus)}
                  </Text>
                </View>
              )}
            </View>
            {counts.urgent > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.bulkBtn,
                  pressed && styles.bulkBtnPressed,
                ]}
                onPress={handleBulkRemind}
                disabled={bulkRemindMut.isPending}
              >
                <Send color={Colors.white} size={16} strokeWidth={2.4} />
                <Text style={styles.bulkBtnText}>
                  {bulkRemindMut.isPending
                    ? 'Bhej raha hoon…'
                    : `Sab ${counts.urgent} ko reminder bhejo`}
                </Text>
              </Pressable>
            )}
          </View>
        </FadeInUp>

        {/* ─── Filter chips ───────────────────────────── */}
        <FadeInUp delay={80}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <Chip
              label="Sab"
              count={counts.all}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <Chip
              label="Urgent"
              count={counts.urgent}
              active={filter === 'urgent'}
              onPress={() => setFilter('urgent')}
            />
            <Chip
              label="Aging"
              count={counts.aging}
              active={filter === 'aging'}
              onPress={() => setFilter('aging')}
            />
            <Chip
              label="OK"
              count={counts.ok}
              active={filter === 'ok'}
              onPress={() => setFilter('ok')}
            />
            <Chip label="Paid" count={counts.paid} active={false} />
          </ScrollView>
        </FadeInUp>

        {/* ─── Customer list ──────────────────────────── */}
        {customersQ.isLoading && customers.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Loading customers…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Abhi koi customer nahi'
                : 'Is filter mein koi nahi'}
            </Text>
          </View>
        ) : (
          filtered.map((c, i) => (
            <FadeInUp key={c.id} delay={120 + i * 30}>
              <CustomerCard customer={c} />
            </FadeInUp>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── + FAB ──────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => {
          haptic('tap');
          openGiveCredit();
        }}
        accessibilityLabel="Give credit"
      >
        <Plus color={Colors.white} size={28} strokeWidth={2.6} />
      </Pressable>
    </SafeAreaView>
  );
}

// ─── Customer card ────────────────────────────────────────
function CustomerCard({ customer }: { customer: Customer }) {
  const { format } = useCurrency();

  const avatarColor = avatarColorFor(customer.status);
  const badgeTone = badgeToneFor(customer.status);
  const badgeLabel = badgeLabelFor(customer.status);

  async function handleWhatsApp() {
    haptic('confirm');
    await openWhatsAppReminder(
      customer.phone,
      customer.name,
      customer.totalOutstanding,
      customer.daysAging,
    );
  }

  function handleCardPress() {
    haptic('tap');
    router.push(`/khata/${customer.id}`);
  }

  return (
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{customer.initial}</Text>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {customer.name}
        </Text>
        <Text style={styles.cardMeta}>{customer.lastPaymentText}</Text>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.cardAmt}>{format(customer.totalOutstanding)}</Text>
        <Badge label={badgeLabel} tone={badgeTone} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.waBtn, pressed && styles.waBtnPressed]}
        onPress={handleWhatsApp}
        accessibilityLabel={`Send WhatsApp reminder to ${customer.name}`}
        hitSlop={8}
      >
        <MessageCircle color={Colors.profit[500]} size={18} strokeWidth={2.4} />
      </Pressable>
    </Pressable>
  );
}

// ─── Status → UI mappers ─────────────────────────────────
function avatarColorFor(s: CustomerStatus): string {
  switch (s) {
    case 'urgent':
      return Colors.loss[500];
    case 'aging':
      return Colors.warning[500];
    case 'ok':
      return Colors.profit[500];
    case 'paid':
      return Colors.ink[400];
  }
}
function badgeToneFor(
  s: CustomerStatus,
): 'loss' | 'warning' | 'profit' | 'neutral' {
  switch (s) {
    case 'urgent':
      return 'loss';
    case 'aging':
      return 'warning';
    case 'ok':
      return 'profit';
    case 'paid':
      return 'neutral';
  }
}
function badgeLabelFor(s: CustomerStatus): string {
  switch (s) {
    case 'urgent':
      return 'URGENT';
    case 'aging':
      return 'AGING';
    case 'ok':
      return 'OK';
    case 'paid':
      return 'PAID';
  }
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: Colors.saffron[50] },
  scroll: { padding: Spacing.xl },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmt: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    marginTop: 4,
  },
  urgentBox: {
    backgroundColor: Colors.loss[50],
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'flex-end',
  },
  urgentLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 9,
    color: Colors.loss[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urgentAmt: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    color: Colors.loss[500],
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.profit[500],
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  bulkBtnPressed: { backgroundColor: Colors.profit[700] },
  bulkBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  empty: {
    padding: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[400],
  },
  card: {
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
  cardPressed: { transform: [{ scale: 0.99 }], opacity: 0.96 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  cardMeta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 2,
  },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardAmt: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },
  waBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.profit[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  waBtnPressed: { backgroundColor: Colors.profit[400] },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: 84,
    width: TouchTarget.voiceFAB,
    height: TouchTarget.voiceFAB,
    borderRadius: TouchTarget.voiceFAB / 2,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.saffronGlow,
  },
  fabPressed: { backgroundColor: Colors.saffron[600] },
});
