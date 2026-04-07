/**
 * /team/payroll — Monthly payroll summary + actions.
 *
 * Wires:
 *   - usePayrollSummary(year, month) — existing calculated payroll
 *   - useCalculatePayroll() — trigger payroll calculation
 *   - useMarkAsPaid() — mark individual payment
 *   - useSendPayslips() — bulk WhatsApp payslips
 *   - getPayslipHtmlUrl() — open printable payslip in browser
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calculator,
  Send,
  CheckCircle2,
  FileText,
  ChevronLeft,
  ChevronRight,
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
import { Button, Skeleton, Badge } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import {
  usePayrollSummary,
  useCalculatePayroll,
  useMarkAsPaid,
  useSendPayslips,
} from '@/features/team/hooks';
import { getPayslipHtmlUrl } from '@/features/team/api';
import { ROLE_META, type PayrollMemberRow } from '@/features/team/schemas';
import { auth$ } from '@/stores/auth';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function PayrollScreen() {
  const { format } = useCurrency();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const payrollQ = usePayrollSummary(year, month);
  const calcMut = useCalculatePayroll();
  const payMut = useMarkAsPaid();
  const sendMut = useSendPayslips();
  const businessId = auth$.businessId.get();

  const payroll = payrollQ.data;

  function prevMonth() {
    haptic('tap');
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    haptic('tap');
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  async function handleCalculate() {
    haptic('tap');
    Alert.alert(
      `${MONTHS[month - 1]} ${year} ka payroll calculate karein?`,
      'Attendance ke hisaab se salary calculate hogi.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Calculate',
          onPress: async () => {
            try {
              await calcMut.mutateAsync({ year, month });
              payrollQ.refetch();
            } catch (err) {
              Alert.alert('Error', (err as Error).message);
            }
          },
        },
      ],
    );
  }

  async function handlePay(paymentId: string, memberName: string) {
    haptic('tap');
    Alert.alert(
      `${memberName} ko paid mark karein?`,
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              await payMut.mutateAsync({ paymentId });
              payrollQ.refetch();
            } catch (err) {
              Alert.alert('Error', (err as Error).message);
            }
          },
        },
      ],
    );
  }

  async function handleSendSlips() {
    haptic('tap');
    Alert.alert(
      'WhatsApp pe payslip bhejein?',
      `${MONTHS[month - 1]} ${year} ke sabhi members ko WhatsApp payslip jayega.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              const result = await sendMut.mutateAsync({ year, month });
              Alert.alert(
                'Sent',
                `${result.sent} sent, ${result.failed} failed`,
              );
            } catch (err) {
              Alert.alert('Error', (err as Error).message);
            }
          },
        },
      ],
    );
  }

  function openPayslip(paymentId: string) {
    if (!businessId) return;
    const url = getPayslipHtmlUrl(businessId, paymentId);
    Linking.openURL(url);
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
          <Text style={styles.title}>Payroll</Text>
          <Text style={styles.subtitle}>Salary calculate aur pay</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={payrollQ.isFetching}
            onRefresh={() => payrollQ.refetch()}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Month picker ──────────────────────────── */}
        <FadeInUp delay={0}>
          <View style={styles.monthPicker}>
            <Pressable onPress={prevMonth} hitSlop={8}>
              <ChevronLeft color={Colors.ink[700]} size={22} strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.monthText}>
              {MONTHS[month - 1]} {year}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={8}>
              <ChevronRight color={Colors.ink[700]} size={22} strokeWidth={2.4} />
            </Pressable>
          </View>
        </FadeInUp>

        {/* ─── Totals card ───────────────────────────── */}
        {payrollQ.isLoading ? (
          <Skeleton height={140} radius={20} />
        ) : !payroll || payroll.members.length === 0 ? (
          <FadeInUp delay={40}>
            <View style={styles.emptyCard}>
              <Calculator color={Colors.ink[300]} size={40} strokeWidth={1.6} />
              <Text style={styles.emptyTitle}>Payroll calculate nahi hua</Text>
              <Text style={styles.emptyBody}>
                Is mahine ka payroll generate karne ke liye "Calculate" dabao
              </Text>
              <Button
                label="Calculate Payroll"
                onPress={handleCalculate}
                loading={calcMut.isPending}
                size="lg"
                fullWidth
                style={{ marginTop: Spacing.lg }}
                leftIcon={<Calculator color={Colors.white} size={18} strokeWidth={2.4} />}
              />
            </View>
          </FadeInUp>
        ) : (
          <>
            <FadeInUp delay={40}>
              <View style={styles.totalsCard}>
                <View style={styles.totalsRow}>
                  <View>
                    <Text style={styles.totalsLabel}>Gross Salary</Text>
                    <Text style={styles.totalsAmt}>{format(payroll.totals.gross)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.totalsLabel}>Net Payable</Text>
                    <Text style={[styles.totalsAmt, { color: Colors.profit[500] }]}>
                      {format(payroll.totals.net)}
                    </Text>
                  </View>
                </View>
                <View style={styles.totalsActions}>
                  <Button
                    label="Recalculate"
                    onPress={handleCalculate}
                    variant="secondary"
                    size="sm"
                    loading={calcMut.isPending}
                    leftIcon={<Calculator color={Colors.ink[700]} size={14} strokeWidth={2.4} />}
                  />
                  <Button
                    label="Send Payslips"
                    onPress={handleSendSlips}
                    variant="secondary"
                    size="sm"
                    loading={sendMut.isPending}
                    leftIcon={<Send color={Colors.ink[700]} size={14} strokeWidth={2.4} />}
                  />
                </View>
              </View>
            </FadeInUp>

            {/* ─── Member rows ─────────────────────────── */}
            {payroll.members.map((m, i) => (
              <FadeInUp key={m.paymentId} delay={80 + i * 20}>
                <PayrollRow
                  row={m}
                  onPay={() => handlePay(m.paymentId, m.memberName)}
                  onPayslip={() => openPayslip(m.paymentId)}
                />
              </FadeInUp>
            ))}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PayrollRow({
  row,
  onPay,
  onPayslip,
}: {
  row: PayrollMemberRow;
  onPay: () => void;
  onPayslip: () => void;
}) {
  const { format } = useCurrency();
  const isPaid = row.status === 'paid' || row.status === 'sent';

  return (
    <View style={[styles.payRow, isPaid && styles.payRowPaid]}>
      <View style={styles.payTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.payName} numberOfLines={1}>{row.memberName}</Text>
          <Text style={styles.payMeta}>
            {row.daysPresent}d present · {row.overtimeHours}h OT
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.payNet}>{format(row.netAmount)}</Text>
          <Badge
            label={isPaid ? 'PAID' : row.status.toUpperCase()}
            tone={isPaid ? 'profit' : 'warning'}
          />
        </View>
      </View>
      {row.totalDeductions > 0 && (
        <Text style={styles.payDeductions}>
          Deductions: {format(row.totalDeductions)} (PF: {format(row.pfDeduction)}, Late: {format(row.lateDeductions)})
        </Text>
      )}
      <View style={styles.payActions}>
        {!isPaid && (
          <Button label="Mark Paid" onPress={onPay} size="sm" variant="primary" />
        )}
        <Pressable onPress={onPayslip} style={styles.payslipBtn} hitSlop={8}>
          <FileText color={Colors.trust[500]} size={16} strokeWidth={2.4} />
          <Text style={styles.payslipText}>Payslip</Text>
        </Pressable>
      </View>
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

  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  monthText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    minWidth: 120,
    textAlign: 'center',
  },

  emptyCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    marginTop: Spacing.md,
  },
  emptyBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[400],
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 280,
  },

  totalsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  totalsLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalsAmt: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    marginTop: 2,
  },
  totalsActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },

  payRow: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  payRowPaid: {
    backgroundColor: Colors.profit[50],
    borderColor: Colors.profit[500],
  },
  payTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  payName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  payMeta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 2,
  },
  payNet: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },
  payDeductions: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.warning[500],
    marginTop: Spacing.sm,
  },
  payActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  payslipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  payslipText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    color: Colors.trust[500],
    fontWeight: FontWeight.bold,
  },
});
