/**
 * Customer Ledger — paper-cream khata page metaphor.
 *
 * Routed at /khata/[customerId]. Header shows the customer's name, phone,
 * status. The big amber/green hero card shows total outstanding. Filter
 * chips toggle credit/payment views. The list is rendered like a hand-
 * written ledger: cream background, dotted ruled lines, monospace
 * right-aligned amounts.
 *
 * Bottom action bar:
 *   "+ Udhaar"  → opens GiveCreditSheet pre-filled with this customer's name
 *   "+ Paise mile" → opens ReceivePaymentSheet bound to this customerId
 *
 * Top-right WhatsApp icon → opens wa.me with the polite Hindi reminder.
 */

import { useMemo, useState } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Plus,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
  TouchTarget,
} from '@/theme';
import { haptic } from '@/lib/haptics';
import { openWhatsAppReminder } from '@/lib/whatsapp';
import { FadeInUp } from '@/components/animations';
import { Badge, Chip } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import { useCustomerLedger } from '@/features/customers/hooks';
import type {
  CustomerStatus,
  LedgerEntry,
  Customer,
} from '@/features/customers/schemas';
import { useSheets } from '@/components/sheets';

type Filter = 'all' | 'credit' | 'payment';

export default function CustomerLedgerScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const ledgerQ = useCustomerLedger(customerId);
  const { format } = useCurrency();
  const { openGiveCredit, openReceivePayment } = useSheets();
  const [filter, setFilter] = useState<Filter>('all');

  const customer = ledgerQ.data?.customer;
  const entries = ledgerQ.data?.entries ?? [];

  const filtered = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((e) => e.type === filter);
  }, [entries, filter]);

  const counts = useMemo(
    () => ({
      all: entries.length,
      credit: entries.filter((e) => e.type === 'credit').length,
      payment: entries.filter((e) => e.type === 'payment').length,
    }),
    [entries],
  );

  async function handleWhatsApp() {
    if (!customer) return;
    haptic('confirm');
    const ok = await openWhatsAppReminder(
      customer.phone,
      customer.name,
      customer.totalOutstanding,
      customer.daysAging,
    );
    if (!ok) return;
  }

  function handleGiveCredit() {
    if (!customer) return;
    haptic('tap');
    openGiveCredit({
      initialCustomerName: customer.name,
      initialCustomerPhone: customer.phone ?? undefined,
    });
  }

  function handleReceivePayment() {
    if (!customer) return;
    if (customer.totalOutstanding <= 0) {
      Alert.alert(
        'Sab paid hai',
        `${customer.name} ka koi outstanding nahi hai.`,
      );
      return;
    }
    haptic('tap');
    openReceivePayment({
      customerId: customer.id,
      customerName: customer.name,
      outstanding: customer.totalOutstanding,
    });
  }

  if (ledgerQ.isLoading && !customer) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Khata khol raha hoon…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Customer nahi mila</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = customer.status;
  const isPaid = status === 'paid' || customer.totalOutstanding <= 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text style={styles.headerSub}>{customer.lastPaymentText}</Text>
        </View>
        {customer.phone ? (
          <Pressable
            onPress={handleWhatsApp}
            style={({ pressed }) => [
              styles.headerWa,
              pressed && styles.headerWaPressed,
            ]}
            accessibilityLabel="Send WhatsApp reminder"
          >
            <MessageCircle color={Colors.profit[500]} size={20} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={ledgerQ.isFetching}
            onRefresh={() => ledgerQ.refetch()}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Hero outstanding card ──────────────────── */}
        <FadeInUp delay={0}>
          <View
            style={[
              styles.hero,
              isPaid ? styles.heroPaid : styles.heroOutstanding,
            ]}
          >
            <Text
              style={[
                styles.heroLabel,
                isPaid ? styles.heroLabelPaid : styles.heroLabelOutstanding,
              ]}
            >
              {isPaid ? 'Sab paid' : 'Total Outstanding'}
            </Text>
            <Text style={styles.heroAmt}>
              {format(customer.totalOutstanding)}
            </Text>
            <View style={styles.heroMetaRow}>
              <Badge
                label={statusLabel(status)}
                tone={statusBadgeTone(status)}
              />
              {customer.phone ? (
                <View style={styles.phoneRow}>
                  <Phone color={Colors.ink[500]} size={12} strokeWidth={2.2} />
                  <Text style={styles.phoneText}>+91 {customer.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </FadeInUp>

        {/* ─── Filter chips ───────────────────────────── */}
        <FadeInUp delay={60}>
          <View style={styles.chipRow}>
            <Chip
              label="Sab"
              count={counts.all}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <Chip
              label="Udhaar"
              count={counts.credit}
              active={filter === 'credit'}
              onPress={() => setFilter('credit')}
            />
            <Chip
              label="Payment"
              count={counts.payment}
              active={filter === 'payment'}
              onPress={() => setFilter('payment')}
            />
          </View>
        </FadeInUp>

        {/* ─── Ledger entries (paper-cream metaphor) ─── */}
        <FadeInUp delay={120}>
          <View style={styles.ledger}>
            <View style={styles.ledgerHeaderRow}>
              <Text style={styles.ledgerHeaderText}>Date</Text>
              <Text style={styles.ledgerHeaderText}>Detail</Text>
              <Text style={[styles.ledgerHeaderText, { textAlign: 'right' }]}>
                Amount
              </Text>
            </View>
            {filtered.length === 0 ? (
              <Text style={styles.ledgerEmpty}>
                Is filter mein koi entry nahi
              </Text>
            ) : (
              filtered.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))
            )}
          </View>
        </FadeInUp>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Bottom action bar ──────────────────────────── */}
      <View style={styles.actionBar}>
        <Pressable
          onPress={handleReceivePayment}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnGreen,
            pressed && styles.actionBtnPressed,
          ]}
          accessibilityLabel="Receive payment"
        >
          <Minus color={Colors.white} size={18} strokeWidth={2.6} />
          <Text style={styles.actionBtnText}>Paise mile</Text>
        </Pressable>
        <Pressable
          onPress={handleGiveCredit}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnSaffron,
            pressed && styles.actionBtnPressed,
          ]}
          accessibilityLabel="Give credit"
        >
          <Plus color={Colors.white} size={18} strokeWidth={2.6} />
          <Text style={styles.actionBtnText}>Udhaar do</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Ledger row ──────────────────────────────────────────
function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const isCredit = entry.type === 'credit';
  return (
    <View style={[styles.ledgerRow, !isCredit && styles.ledgerRowPayment]}>
      <View style={styles.ledgerDate}>
        <Text style={styles.ledgerDateText}>{formatDate(entry.createdAt)}</Text>
      </View>
      <View style={styles.ledgerDetail}>
        <View style={styles.ledgerDetailRow}>
          {isCredit ? (
            <TrendingDown
              color={Colors.loss[500]}
              size={14}
              strokeWidth={2.4}
            />
          ) : (
            <TrendingUp
              color={Colors.profit[500]}
              size={14}
              strokeWidth={2.4}
            />
          )}
          <Text style={styles.ledgerDetailText} numberOfLines={2}>
            {entry.description ?? (isCredit ? 'Udhaar diya' : 'Paise mile')}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.ledgerAmt,
          isCredit ? styles.ledgerAmtCredit : styles.ledgerAmtPayment,
        ]}
      >
        {isCredit ? '+' : '−'}₹{entry.amount.toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
  } catch {
    return '';
  }
}

function statusLabel(s: CustomerStatus): string {
  switch (s) {
    case 'urgent':
      return 'URGENT · 60+ DAYS';
    case 'aging':
      return 'AGING · 30+ DAYS';
    case 'ok':
      return 'CURRENT';
    case 'paid':
      return 'PAID UP ✓';
  }
}
function statusBadgeTone(
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
      return 'profit';
  }
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  loadingText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[500],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
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
  headerInfo: { flex: 1 },
  headerName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  headerSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    marginTop: 1,
  },
  headerWa: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.profit[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerWaPressed: { backgroundColor: Colors.profit[400] },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['5xl'] },

  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  heroOutstanding: {
    backgroundColor: Colors.warning[50],
    borderWidth: 1.5,
    borderColor: Colors.warning[500],
  },
  heroPaid: {
    backgroundColor: Colors.profit[50],
    borderWidth: 1.5,
    borderColor: Colors.profit[500],
  },
  heroLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.bold,
  },
  heroLabelOutstanding: { color: Colors.warning[700] },
  heroLabelPaid: { color: Colors.profit[700] },
  heroAmt: {
    fontFamily: FontFamily.mono,
    fontSize: 38,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    marginTop: Spacing.xs,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
  },

  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },

  // Paper-cream ledger
  ledger: {
    backgroundColor: '#FFFAF0', // warmer cream than the bg
    borderWidth: 1,
    borderColor: Colors.warning[50],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0',
    marginBottom: Spacing.sm,
  },
  ledgerHeaderText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.warning[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  ledgerEmpty: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[400],
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D6',
    borderStyle: 'dashed',
  },
  ledgerRowPayment: {
    backgroundColor: 'rgba(216, 240, 223, 0.4)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: -Spacing.sm,
  },
  ledgerDate: {
    width: 56,
  },
  ledgerDateText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: Colors.ink[500],
  },
  ledgerDetail: { flex: 1 },
  ledgerDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  ledgerDetailText: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    lineHeight: 18,
  },
  ledgerAmt: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
    minWidth: 80,
    textAlign: 'right',
  },
  ledgerAmtCredit: { color: Colors.loss[500] },
  ledgerAmtPayment: { color: Colors.profit[500] },

  // Bottom action bar
  actionBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: TouchTarget.heroCTA,
    borderRadius: Radius.lg,
  },
  actionBtnGreen: { backgroundColor: Colors.profit[500] },
  actionBtnSaffron: { backgroundColor: Colors.saffron[500] },
  actionBtnPressed: { opacity: 0.85 },
  actionBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
