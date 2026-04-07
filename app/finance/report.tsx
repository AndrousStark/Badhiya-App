/**
 * Monthly Report — full financial summary for a month.
 *
 * Wires GET /businesses/:id/analytics/report/monthly. Shows:
 *   - Big P&L hero (revenue / expenses / profit / margin)
 *   - ExpensePieChart (donut)
 *   - Top selling items list
 *   - Credit summary (outstanding / collected / overdue / active)
 *   - Health score chip
 *   - Export to printable HTML (opens analytics/export/report/monthly in a browser)
 *
 * Month/year picker chips at top to switch periods.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Award,
  FileDown,
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
import { Card, SectionLabel, Skeleton, Badge } from '@/components/ui';
import { ExpensePieChart } from '@/components/charts';
import { useCurrency } from '@/hooks/useCurrency';
import { useMonthlyReport } from '@/features/analytics/hooks';
import { getMonthlyReportHtmlUrl } from '@/features/analytics/api';
import { auth$ } from '@/stores/auth';

const MONTH_NAMES_HI = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function MonthlyReportScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const reportQ = useMonthlyReport(year, month);
  const { format } = useCurrency();
  const data = reportQ.data;

  function prevMonth() {
    haptic('select');
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    haptic('select');
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  async function handleExport() {
    haptic('tap');
    const businessId = auth$.businessId.get();
    if (!businessId) return;
    const url = getMonthlyReportHtmlUrl(businessId, year, month);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot open', 'Browser nahi khul saka');
      }
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
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
          <Text style={styles.title}>Monthly Report</Text>
          <Text style={styles.subtitle}>
            {data?.businessName ?? 'Loading…'}
          </Text>
        </View>
        <Pressable
          onPress={handleExport}
          style={({ pressed }) => [styles.exportBtn, pressed && styles.exportBtnPressed]}
          accessibilityLabel="Export to HTML"
        >
          <FileDown color={Colors.saffron[600]} size={20} strokeWidth={2.4} />
        </Pressable>
      </View>

      {/* ─── Month picker ──────────────────────────────── */}
      <View style={styles.monthPicker}>
        <Pressable onPress={prevMonth} style={styles.monthArrow}>
          <ChevronLeft color={Colors.ink[700]} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES_HI[month - 1]} {year}
        </Text>
        <Pressable onPress={nextMonth} style={styles.monthArrow}>
          <ChevronRight color={Colors.ink[700]} size={22} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={reportQ.isFetching}
            onRefresh={() => reportQ.refetch()}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {reportQ.isLoading && !data ? (
          <>
            <Skeleton height={180} radius={20} style={{ marginBottom: 16 }} />
            <Skeleton height={300} radius={20} style={{ marginBottom: 16 }} />
            <Skeleton height={180} radius={20} />
          </>
        ) : data ? (
          <>
            {/* ─── P&L hero ─────────────────────────────── */}
            <FadeInUp delay={0}>
              <Card variant="elevated" padding="lg">
                <Text style={styles.heroLabel}>Net Profit</Text>
                <Text
                  style={[
                    styles.heroValue,
                    {
                      color:
                        data.netProfit >= 0
                          ? Colors.profit[500]
                          : Colors.loss[500],
                    },
                  ]}
                >
                  {format(data.netProfit)}
                </Text>
                <View style={styles.heroSubRow}>
                  <Badge
                    label={`${data.profitMargin.toFixed(1)}% margin`}
                    tone={data.profitMargin > 20 ? 'profit' : 'warning'}
                  />
                  <Badge
                    label={`${data.totalTransactions} txns`}
                    tone="neutral"
                  />
                </View>

                <View style={styles.heroSplit}>
                  <View style={styles.heroSplitItem}>
                    <TrendingUp
                      color={Colors.profit[500]}
                      size={16}
                      strokeWidth={2.4}
                    />
                    <View>
                      <Text style={styles.splitLabel}>Revenue</Text>
                      <Text style={styles.splitValue}>
                        {format(data.totalRevenue)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.heroSplitItem}>
                    <TrendingDown
                      color={Colors.loss[500]}
                      size={16}
                      strokeWidth={2.4}
                    />
                    <View>
                      <Text style={styles.splitLabel}>Expenses</Text>
                      <Text style={styles.splitValue}>
                        {format(data.totalExpenses)}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.heroDaily}>
                  Avg daily revenue: {format(data.averageDailyRevenue)}
                </Text>
              </Card>
            </FadeInUp>

            {/* ─── Health score badge ──────────────────── */}
            <FadeInUp delay={40}>
              <Card variant="warm" padding="lg" style={styles.healthCard}>
                <Award color={Colors.saffron[600]} size={20} strokeWidth={2.4} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.healthLabel}>Badhiya Score</Text>
                  <Text style={styles.healthValue}>
                    {data.healthScore} / 900 ·{' '}
                    <Text style={styles.healthLevel}>
                      {data.healthLevel.toUpperCase()}
                    </Text>
                  </Text>
                </View>
              </Card>
            </FadeInUp>

            {/* ─── Expense pie ─────────────────────────── */}
            {data.expenseBreakdown.length > 0 && (
              <FadeInUp delay={80}>
                <SectionLabel label="Expenses by Category" />
                <Card variant="elevated" padding="lg">
                  <ExpensePieChart
                    data={data.expenseBreakdown}
                    total={data.totalExpenses}
                    size={220}
                    thickness={28}
                  />
                </Card>
              </FadeInUp>
            )}

            {/* ─── Top selling items ───────────────────── */}
            {data.topSellingItems.length > 0 && (
              <FadeInUp delay={120}>
                <SectionLabel label="Top Selling Items" />
                <Card variant="elevated" padding="md">
                  {data.topSellingItems.slice(0, 10).map((item, i) => (
                    <View key={`${item.item}-${i}`} style={styles.itemRow}>
                      <View style={styles.itemRank}>
                        <Text style={styles.itemRankText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.item}
                        </Text>
                        <Text style={styles.itemCount}>
                          {item.count} sales
                        </Text>
                      </View>
                      <Text style={styles.itemAmt}>{format(item.revenue)}</Text>
                    </View>
                  ))}
                </Card>
              </FadeInUp>
            )}

            {/* ─── Credit summary ──────────────────────── */}
            <FadeInUp delay={160}>
              <SectionLabel label="Credit (Khata) Summary" />
              <Card variant="elevated" padding="lg">
                <View style={styles.creditGrid}>
                  <CreditCell
                    label="Outstanding"
                    value={format(data.creditSummary.totalOutstanding)}
                    tone="warning"
                  />
                  <CreditCell
                    label="Collected"
                    value={format(data.creditSummary.totalCollected)}
                    tone="profit"
                  />
                  <CreditCell
                    label="Overdue 60+"
                    value={format(data.creditSummary.overdueAmount)}
                    tone="loss"
                  />
                  <CreditCell
                    label="Active"
                    value={`${data.creditSummary.activeCustomers}`}
                    tone="trust"
                  />
                </View>
              </Card>
            </FadeInUp>

            <View style={{ height: 60 }} />
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Report load nahi hua</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CreditCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'warning' | 'profit' | 'loss' | 'trust';
}) {
  const colorMap: Record<string, string> = {
    warning: Colors.warning[500],
    profit: Colors.profit[500],
    loss: Colors.loss[500],
    trust: Colors.trust[500],
  };
  return (
    <View style={styles.creditCell}>
      <Text style={styles.creditLabel}>{label}</Text>
      <Text style={[styles.creditValue, { color: colorMap[tone] }]}>
        {value}
      </Text>
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
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[50],
    borderWidth: 1,
    borderColor: Colors.saffron[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnPressed: { backgroundColor: Colors.saffron[100] },

  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },

  scroll: { padding: Spacing.xl },
  empty: { alignItems: 'center', padding: Spacing['3xl'] },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[400],
  },

  // P&L hero
  heroLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.bold,
  },
  heroValue: {
    fontFamily: FontFamily.mono,
    fontSize: 40,
    fontWeight: FontWeight.heavy,
    marginTop: 2,
  },
  heroSubRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  heroSplit: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  heroSplitItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  splitLabel: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
  },
  splitValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    color: Colors.ink[900],
    fontWeight: FontWeight.bold,
  },
  heroDaily: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    marginTop: Spacing.md,
    textAlign: 'right',
  },

  // Health card
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  healthLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.saffron[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.bold,
  },
  healthValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.h3,
    color: Colors.ink[900],
    marginTop: 2,
    fontWeight: FontWeight.heavy,
  },
  healthLevel: { color: Colors.saffron[600] },

  // Top items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.saffron[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRankText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    color: Colors.saffron[600],
    fontWeight: FontWeight.bold,
  },
  itemName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.ink[900],
    fontWeight: FontWeight.bold,
  },
  itemCount: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 1,
  },
  itemAmt: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.caption,
    color: Colors.profit[500],
    fontWeight: FontWeight.bold,
  },

  // Credit summary
  creditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  creditCell: {
    width: '47%',
    padding: Spacing.md,
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
  },
  creditLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 9,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.bold,
  },
  creditValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
    marginTop: 4,
  },
});
