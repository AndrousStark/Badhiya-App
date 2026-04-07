/**
 * Paisa (Money / Finance Hub) — Phase 8 real data.
 *
 * Replaces the Phase 2 placeholder with:
 *   - useRevenueChart() → SVG area chart with period switcher (7/30/90 days)
 *   - useDashboard() → real KPI bento (revenue, expenses, profit, margin)
 *   - useHealthScoreBreakdown() → mid-size HealthScoreGauge
 *   - useExpenseBreakdown() → top-3 categories preview
 *   - 3 finance hub cards: Health Score, Loans, Schemes (each navigates
 *     to its detail screen at /finance/*)
 *   - Pull-to-refresh
 *
 * The bottom of the screen always has a "View report" link to a future
 * monthly PDF report (Phase 8.5).
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
  TrendingUp,
  TrendingDown,
  Award,
  Building2,
  CreditCard,
  ChevronRight,
  Info,
  FileText,
} from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '../../src/theme';
import { haptic } from '../../src/lib/haptics';
import { FadeInUp } from '../../src/components/animations';
import { KpiTile } from '../../src/components/dashboard';
import { Card, SectionLabel, Chip, Skeleton } from '../../src/components/ui';
import { RevenueAreaChart, HealthScoreGauge } from '../../src/components/charts';
import { useDashboard } from '../../src/features/businesses/hooks';
import {
  useRevenueChart,
  useExpenseBreakdown,
  useHealthScoreBreakdown,
} from '../../src/features/analytics/hooks';
import { useCurrency } from '../../src/hooks/useCurrency';

type Period = 7 | 30 | 90;

export default function PaisaScreen() {
  const { format } = useCurrency();
  const [period, setPeriod] = useState<Period>(30);
  const [chartWidth, setChartWidth] = useState(320);

  const dashboardQ = useDashboard();
  const chartQ = useRevenueChart(period);
  const breakdownQ = useHealthScoreBreakdown();
  const expenseQ = useExpenseBreakdown();
  const dash = dashboardQ.data;

  const margin = useMemo(() => {
    if (!dash || dash.todayRevenue === 0) return 0;
    return Math.round((dash.todayProfit / dash.todayRevenue) * 100);
  }, [dash]);

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([
      dashboardQ.refetch(),
      chartQ.refetch(),
      breakdownQ.refetch(),
      expenseQ.refetch(),
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FadeInUp delay={0}>
        <View style={styles.header}>
          <Text style={styles.title}>Paisa</Text>
          <Text style={styles.subtitle}>Aapka business ka hisaab</Text>
        </View>
      </FadeInUp>

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
        {/* ─── Revenue chart card ───────────────────── */}
        <FadeInUp delay={40}>
          <Card variant="elevated" padding="lg">
            <View style={styles.chartHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chartLabel}>
                  Revenue · last {period} days
                </Text>
                <Text style={styles.chartTotal}>
                  {format(
                    (chartQ.data ?? []).reduce((s, p) => s + p.revenue, 0),
                  )}
                </Text>
              </View>
              <View style={styles.periodChips}>
                {([7, 30, 90] as Period[]).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => {
                      haptic('select');
                      setPeriod(p);
                    }}
                    style={[
                      styles.periodChip,
                      period === p && styles.periodChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.periodChipText,
                        period === p && styles.periodChipTextActive,
                      ]}
                    >
                      {p}d
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View
              style={styles.chartWrap}
              onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
            >
              <RevenueAreaChart
                data={chartQ.data ?? []}
                width={chartWidth}
                height={140}
                loading={chartQ.isLoading}
              />
            </View>
          </Card>
        </FadeInUp>

        {/* ─── KPI bento ──────────────────────────── */}
        <FadeInUp delay={80}>
          <View style={styles.bentoRow}>
            <KpiTile
              label="Bikri"
              value={dash?.todayRevenue ?? 0}
              prefix="₹"
              tone="saffron"
            />
            <KpiTile
              label="Kharcha"
              value={dash?.todayExpenses ?? 0}
              prefix="₹"
              tone="loss"
            />
          </View>
          <View style={[styles.bentoRow, { marginTop: Spacing.sm }]}>
            <KpiTile
              label="Munafa"
              value={dash?.todayProfit ?? 0}
              prefix="₹"
              tone="profit"
              delta={dash && dash.todayProfit > 0 ? 'positive' : 'breakeven'}
              deltaDirection={dash && dash.todayProfit > 0 ? 'up' : 'flat'}
            />
            <KpiTile
              label="Margin"
              value={margin}
              suffix="%"
              tone="neutral"
              delta={margin > 20 ? 'badhiya' : 'okay'}
              deltaDirection={margin > 20 ? 'up' : 'flat'}
            />
          </View>
        </FadeInUp>

        {/* ─── Finance hub cards ────────────────────── */}
        <SectionLabel label="Finance Hub" />

        {/* Health Score card */}
        <FadeInUp delay={120}>
          <Pressable
            onPress={() => {
              haptic('tap');
              router.push('/finance/health-score');
            }}
            style={({ pressed }) => [
              styles.hubCard,
              pressed && styles.hubCardPressed,
            ]}
          >
            <View style={styles.hubLeft}>
              <View style={styles.hubIcon}>
                <Award color={Colors.saffron[600]} size={20} strokeWidth={2.4} />
              </View>
              <View>
                <Text style={styles.hubTitle}>Badhiya Score</Text>
                <Text style={styles.hubSub}>
                  {breakdownQ.data
                    ? `${breakdownQ.data.total} / 900 · ${breakdownQ.data.level}`
                    : 'Score load ho raha hai…'}
                </Text>
              </View>
            </View>
            {breakdownQ.data && (
              <HealthScoreGauge
                score={breakdownQ.data.total}
                level={null}
                size={64}
                thickness={6}
              />
            )}
            <ChevronRight color={Colors.ink[400]} size={20} strokeWidth={2.2} />
          </Pressable>
        </FadeInUp>

        {/* Loans card */}
        <FadeInUp delay={160}>
          <Pressable
            onPress={() => {
              haptic('tap');
              router.push('/finance/loans');
            }}
            style={({ pressed }) => [
              styles.hubCard,
              pressed && styles.hubCardPressed,
            ]}
          >
            <View style={styles.hubLeft}>
              <View
                style={[styles.hubIcon, { backgroundColor: Colors.profit[50] }]}
              >
                <CreditCard
                  color={Colors.profit[500]}
                  size={20}
                  strokeWidth={2.4}
                />
              </View>
              <View>
                <Text style={styles.hubTitle}>NBFC Loan Marketplace</Text>
                <Text style={styles.hubSub}>
                  3 NBFCs · best rates · instant eligibility
                </Text>
              </View>
            </View>
            <ChevronRight color={Colors.ink[400]} size={20} strokeWidth={2.2} />
          </Pressable>
        </FadeInUp>

        {/* Schemes card */}
        <FadeInUp delay={200}>
          <Pressable
            onPress={() => {
              haptic('tap');
              router.push('/finance/schemes');
            }}
            style={({ pressed }) => [
              styles.hubCard,
              pressed && styles.hubCardPressed,
            ]}
          >
            <View style={styles.hubLeft}>
              <View
                style={[styles.hubIcon, { backgroundColor: Colors.trust[50] }]}
              >
                <Building2
                  color={Colors.trust[500]}
                  size={20}
                  strokeWidth={2.4}
                />
              </View>
              <View>
                <Text style={styles.hubTitle}>Sarkari Yojana</Text>
                <Text style={styles.hubSub}>
                  PMEGP · Mudra · CGTMSE · 1-tap apply
                </Text>
              </View>
            </View>
            <ChevronRight color={Colors.ink[400]} size={20} strokeWidth={2.2} />
          </Pressable>
        </FadeInUp>

        {/* Monthly Report card */}
        <FadeInUp delay={220}>
          <Pressable
            onPress={() => {
              haptic('tap');
              router.push('/finance/report');
            }}
            style={({ pressed }) => [
              styles.hubCard,
              pressed && styles.hubCardPressed,
            ]}
          >
            <View style={styles.hubLeft}>
              <View
                style={[styles.hubIcon, { backgroundColor: Colors.profit[50] }]}
              >
                <FileText
                  color={Colors.profit[500]}
                  size={20}
                  strokeWidth={2.4}
                />
              </View>
              <View>
                <Text style={styles.hubTitle}>Monthly Report</Text>
                <Text style={styles.hubSub}>
                  Full P&amp;L · expense pie · top items · export PDF
                </Text>
              </View>
            </View>
            <ChevronRight color={Colors.ink[400]} size={20} strokeWidth={2.2} />
          </Pressable>
        </FadeInUp>

        {/* ─── Top expense categories ─────────────── */}
        {expenseQ.data && expenseQ.data.categories.length > 0 && (
          <FadeInUp delay={240}>
            <SectionLabel label="Top Kharcha · Is Mahine" />
            <Card variant="elevated" padding="lg">
              {expenseQ.data.categories.slice(0, 5).map((c, i) => (
                <View key={i} style={styles.expenseRow}>
                  <View style={styles.expenseLeft}>
                    <Text style={styles.expenseCat}>{c.category}</Text>
                    <View style={styles.expenseBar}>
                      <View
                        style={[
                          styles.expenseBarFill,
                          { width: `${c.percentage}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmt}>{format(c.amount)}</Text>
                    <Text style={styles.expensePct}>{c.percentage}%</Text>
                  </View>
                </View>
              ))}
            </Card>
          </FadeInUp>
        )}

        {/* ─── Insight footer ─────────────────────────── */}
        <FadeInUp delay={280}>
          <Card variant="trust" padding="lg" style={styles.insight}>
            <Info color={Colors.trust[500]} size={18} strokeWidth={2.4} />
            <Text style={styles.insightText}>
              Pull down to refresh. AI insights aapka P&L analyze karke har
              hafte aur smart hota jaayega.
            </Text>
          </Card>
        </FadeInUp>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
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
  scroll: { padding: Spacing.xl },

  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  chartLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartTotal: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    marginTop: 2,
  },
  periodChips: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: Colors.bg,
    padding: 3,
    borderRadius: Radius.pill,
  },
  periodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  periodChipActive: { backgroundColor: Colors.saffron[500] },
  periodChipText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    color: Colors.ink[500],
    fontWeight: FontWeight.bold,
  },
  periodChipTextActive: { color: Colors.white },
  chartWrap: { width: '100%' },

  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },

  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  hubCardPressed: {
    backgroundColor: Colors.saffron[50],
    transform: [{ scale: 0.99 }],
  },
  hubLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  hubIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  hubSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
  },

  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  expenseLeft: { flex: 1 },
  expenseCat: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.ink[900],
    marginBottom: 4,
  },
  expenseBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  expenseBarFill: {
    height: '100%',
    backgroundColor: Colors.saffron[500],
    borderRadius: 3,
  },
  expenseRight: { alignItems: 'flex-end', minWidth: 80 },
  expenseAmt: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  expensePct: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
  },

  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  insightText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    lineHeight: 20,
  },
});
