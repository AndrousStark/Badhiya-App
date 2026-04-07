/**
 * /insights/forecast — Demand forecast + festivals + stock-up alerts.
 *
 * Wires:
 *   - useDemandForecast() — 30-day prediction
 *   - useUpcomingFestivals() — festivals with multipliers
 *   - useForecastAlerts() — actionable stock-up alerts
 *   - useCategoryTrends() — week-over-week trends
 *   - useActionForecastAlert() — acknowledge/dismiss
 */

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
  CheckCircle2,
  XCircle,
  Calendar,
  BarChart3,
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
import { Skeleton, SectionLabel, Badge, Button } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import {
  useDemandForecast,
  useUpcomingFestivals,
  useForecastAlerts,
  useCategoryTrends,
  useActionForecastAlert,
} from '@/features/forecasting/hooks';
import {
  FESTIVAL_TYPE_META,
  ALERT_SEVERITY_META,
  type ForecastAlert,
  type UpcomingFestival,
  type CategoryTrend,
} from '@/features/forecasting/schemas';

export default function ForecastScreen() {
  const { format } = useCurrency();
  const forecastQ = useDemandForecast({ days: 30 });
  const festivalsQ = useUpcomingFestivals();
  const alertsQ = useForecastAlerts();
  const trendsQ = useCategoryTrends();
  const actionMut = useActionForecastAlert();

  const forecast = forecastQ.data ?? [];
  const festivals = festivalsQ.data ?? [];
  const alerts = alertsQ.data?.filter((a) => a.status === 'active') ?? [];
  const trends = trendsQ.data ?? [];

  // Summary from forecast
  const next7 = forecast.slice(0, 7);
  const totalRevenue7d = next7.reduce((s, p) => s + p.predictedRevenue, 0);
  const festivalDays = next7.filter((p) => p.festivalName).length;

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([
      forecastQ.refetch(),
      festivalsQ.refetch(),
      alertsQ.refetch(),
      trendsQ.refetch(),
    ]);
  }

  function handleAlertAction(alertId: string, action: 'acknowledged' | 'dismissed') {
    haptic('tap');
    actionMut.mutate({ alertId, action });
  }

  const isLoading = forecastQ.isLoading && festivalsQ.isLoading;

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
          <Text style={styles.title}>Demand Forecast</Text>
          <Text style={styles.subtitle}>Agle 30 din ka anumaan</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={forecastQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {isLoading ? (
          <>
            <Skeleton height={120} radius={20} style={{ marginBottom: 16 }} />
            <Skeleton height={80} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={80} radius={12} />
          </>
        ) : (
          <>
            {/* ─── 7-day summary card ──────────────────── */}
            <FadeInUp delay={0}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={styles.summaryLabel}>7-day forecast</Text>
                    <Text style={styles.summaryValue}>{format(totalRevenue7d)}</Text>
                  </View>
                  {festivalDays > 0 && (
                    <View style={styles.festivalBadge}>
                      <Text style={styles.festivalBadgeEmoji}>🎉</Text>
                      <Text style={styles.festivalBadgeText}>
                        {festivalDays} festival day{festivalDays > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Mini forecast bars */}
                <View style={styles.forecastBars}>
                  {next7.map((day, i) => {
                    const maxRev = Math.max(...next7.map((d) => d.predictedRevenue), 1);
                    const h = Math.max(8, (day.predictedRevenue / maxRev) * 60);
                    const isFestival = !!day.festivalName;
                    return (
                      <View key={i} style={styles.barCol}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: h,
                              backgroundColor: isFestival
                                ? Colors.saffron[500]
                                : Colors.trust[500],
                            },
                          ]}
                        />
                        <Text style={styles.barLabel}>
                          {new Date(day.date).toLocaleDateString('en-IN', {
                            weekday: 'narrow',
                          })}
                        </Text>
                        {isFestival && (
                          <Text style={styles.barFestival}>🎉</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </FadeInUp>

            {/* ─── Stock-up alerts ────────────────────── */}
            {alerts.length > 0 && (
              <FadeInUp delay={40}>
                <SectionLabel label={`Stock-Up Alerts · ${alerts.length}`} />
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={() =>
                      handleAlertAction(alert.id, 'acknowledged')
                    }
                    onDismiss={() =>
                      handleAlertAction(alert.id, 'dismissed')
                    }
                  />
                ))}
              </FadeInUp>
            )}

            {/* ─── Upcoming festivals ────────────────── */}
            {festivals.length > 0 && (
              <FadeInUp delay={80}>
                <SectionLabel label={`Upcoming Festivals · ${festivals.length}`} />
                {festivals.slice(0, 5).map((f) => (
                  <FestivalRow key={f.id} festival={f} />
                ))}
              </FadeInUp>
            )}

            {/* ─── Category trends ───────────────────── */}
            {trends.length > 0 && (
              <FadeInUp delay={120}>
                <SectionLabel label="Category Trends" />
                {trends.map((t) => (
                  <TrendRow key={t.category} trend={t} />
                ))}
              </FadeInUp>
            )}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AlertCard({
  alert,
  onAcknowledge,
  onDismiss,
}: {
  alert: ForecastAlert;
  onAcknowledge: () => void;
  onDismiss: () => void;
}) {
  const sev = ALERT_SEVERITY_META[alert.severity] ?? ALERT_SEVERITY_META.medium;
  return (
    <View style={[styles.alertCard, { borderLeftColor: sev.color }]}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertEmoji}>{sev.emoji}</Text>
        <Text style={styles.alertTitle} numberOfLines={1}>
          {alert.titleHindi ?? alert.title}
        </Text>
        {alert.daysUntilEvent !== null && (
          <Badge label={`${alert.daysUntilEvent}d`} tone="warning" />
        )}
      </View>
      <Text style={styles.alertMsg}>
        {alert.messageHindi ?? alert.message}
      </Text>
      {alert.recommendedAction && (
        <Text style={styles.alertAction}>
          {alert.recommendedAction}
          {alert.recommendedQuantity
            ? ` · ${alert.recommendedQuantity} units`
            : ''}
        </Text>
      )}
      <View style={styles.alertActions}>
        <Pressable onPress={onAcknowledge} style={styles.ackBtn}>
          <CheckCircle2 color={Colors.profit[500]} size={16} strokeWidth={2.4} />
          <Text style={styles.ackText}>Got it</Text>
        </Pressable>
        <Pressable onPress={onDismiss} style={styles.dismissBtn}>
          <XCircle color={Colors.ink[400]} size={16} strokeWidth={2.2} />
          <Text style={styles.dismissText}>Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FestivalRow({ festival }: { festival: UpcomingFestival }) {
  const meta = FESTIVAL_TYPE_META[festival.type] ?? { emoji: '🎉', color: '#F59E0B' };
  return (
    <View style={styles.festivalRow}>
      <Text style={styles.festivalRowEmoji}>{meta.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.festivalRowName}>
          {festival.nameHindi ?? festival.name}
        </Text>
        <Text style={styles.festivalRowMeta}>
          {festival.daysUntil === 0
            ? 'Aaj!'
            : `${festival.daysUntil} din baad`}
          {' · '}
          {festival.region}
        </Text>
      </View>
      <View style={styles.multiplierBadge}>
        <Text style={styles.multiplierText}>
          {Math.round((festival.overallMultiplier - 1) * 100)}%↑
        </Text>
      </View>
    </View>
  );
}

function TrendRow({ trend }: { trend: CategoryTrend }) {
  const { format } = useCurrency();
  const isUp = trend.changePercent >= 0;
  return (
    <View style={styles.trendRow}>
      {isUp ? (
        <TrendingUp color={Colors.profit[500]} size={18} strokeWidth={2.4} />
      ) : (
        <TrendingDown color={Colors.loss[500]} size={18} strokeWidth={2.4} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.trendCat}>{trend.category}</Text>
        <Text style={styles.trendMeta}>
          {format(trend.currentWeekRevenue)} · {trend.currentWeekQuantity} units
        </Text>
      </View>
      <Text
        style={[
          styles.trendPct,
          { color: isUp ? Colors.profit[500] : Colors.loss[500] },
        ]}
      >
        {isUp ? '+' : ''}{Math.round(trend.changePercent)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
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
  scroll: { padding: Spacing.xl },

  // Summary
  summaryCard: {
    backgroundColor: Colors.surface, borderWidth: 1.5,
    borderColor: Colors.trust[500], borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.md,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: FontFamily.bodyBold, fontSize: 10, color: Colors.ink[400],
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  summaryValue: {
    fontFamily: FontFamily.mono, fontSize: FontSize.h1,
    fontWeight: FontWeight.heavy, color: Colors.ink[900], marginTop: 2,
  },
  festivalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.saffron[50], borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  festivalBadgeEmoji: { fontSize: 14 },
  festivalBadgeText: {
    fontFamily: FontFamily.bodyBold, fontSize: 11,
    fontWeight: FontWeight.bold, color: Colors.saffron[600],
  },
  forecastBars: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginTop: Spacing.lg, height: 80,
  },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 20, borderRadius: 4, minHeight: 8 },
  barLabel: {
    fontFamily: FontFamily.body, fontSize: 10, color: Colors.ink[400],
    marginTop: 4,
  },
  barFestival: { fontSize: 10, marginTop: 1 },

  // Alerts
  alertCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 4, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  alertHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  alertEmoji: { fontSize: 18 },
  alertTitle: {
    flex: 1, fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  alertMsg: {
    fontFamily: FontFamily.body, fontSize: FontSize.caption,
    color: Colors.ink[500], lineHeight: 20, marginBottom: Spacing.sm,
  },
  alertAction: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.micro,
    fontWeight: FontWeight.bold, color: Colors.trust[500],
    marginBottom: Spacing.sm,
  },
  alertActions: {
    flexDirection: 'row', gap: Spacing.md,
  },
  ackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4,
  },
  ackText: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.micro,
    fontWeight: FontWeight.bold, color: Colors.profit[500],
  },
  dismissBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4,
  },
  dismissText: {
    fontFamily: FontFamily.body, fontSize: FontSize.micro, color: Colors.ink[400],
  },

  // Festivals
  festivalRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  festivalRowEmoji: { fontSize: 24 },
  festivalRowName: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  festivalRowMeta: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400], marginTop: 2,
  },
  multiplierBadge: {
    backgroundColor: Colors.saffron[50], borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  multiplierText: {
    fontFamily: FontFamily.monoBold, fontSize: 12,
    fontWeight: FontWeight.bold, color: Colors.saffron[600],
  },

  // Trends
  trendRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  trendCat: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  trendMeta: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400], marginTop: 2,
  },
  trendPct: {
    fontFamily: FontFamily.monoBold, fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
  },
});
