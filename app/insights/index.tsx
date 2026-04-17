/**
 * /insights — Smart Insights hub.
 *
 * Wires:
 *   - usePriceAlerts() — top price alerts
 *   - useUpcomingFestivals() — festival banner
 *   - useForecastAlerts() — stock-up alerts
 *   - useCategoryTrends() — week-over-week trends
 *
 * Layout:
 *   1. Festival banner (next upcoming festival with days countdown)
 *   2. Price alerts preview (top 3 unread)
 *   3. Forecast alerts preview (stock-up recommendations)
 *   4. Category trends (up/down arrows)
 *   5. Quick links: Price Tracker, Demand Forecast
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
  ChevronRight,
  Tag,
  BarChart3,
  Sparkles,
  PartyPopper,
  AlertTriangle,
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
import { Skeleton, SectionLabel, Badge } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import { usePriceAlerts } from '@/features/intelligence/hooks';
import {
  useUpcomingFestivals,
  useForecastAlerts,
  useCategoryTrends,
} from '@/features/forecasting/hooks';
import { PLATFORM_META, SEVERITY_META, getSeverityMeta } from '@/features/intelligence/schemas';
import { FESTIVAL_TYPE_META, ALERT_SEVERITY_META, getAlertSeverityMeta } from '@/features/forecasting/schemas';

export default function InsightsHubScreen() {
  const { format } = useCurrency();
  const priceAlertsQ = usePriceAlerts();
  const festivalsQ = useUpcomingFestivals();
  const forecastAlertsQ = useForecastAlerts();
  const trendsQ = useCategoryTrends();

  const priceAlerts = priceAlertsQ.data ?? [];
  const festivals = festivalsQ.data ?? [];
  const forecastAlerts = forecastAlertsQ.data?.filter((a) => a.status === 'active') ?? [];
  const trends = trendsQ.data ?? [];

  const nextFestival = festivals.length > 0 ? festivals[0] : null;
  const unreadAlerts = priceAlerts.filter((a) => !a.isRead);

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([
      priceAlertsQ.refetch(),
      festivalsQ.refetch(),
      forecastAlertsQ.refetch(),
      trendsQ.refetch(),
    ]);
  }

  const isLoading =
    priceAlertsQ.isLoading &&
    festivalsQ.isLoading &&
    forecastAlertsQ.isLoading;

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
          <Text style={styles.title}>Smart Insights</Text>
          <Text style={styles.subtitle}>Prices · Demand · Festivals</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={priceAlertsQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {isLoading ? (
          <>
            <Skeleton height={100} radius={16} style={{ marginBottom: 16 }} />
            <Skeleton height={80} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={80} radius={12} />
          </>
        ) : (
          <>
            {/* ─── Festival banner ──────────────────────── */}
            {nextFestival && (
              <FadeInUp delay={0}>
                <Pressable
                  onPress={() => {
                    haptic('tap');
                    router.push('/insights/forecast');
                  }}
                  style={({ pressed }) => [
                    styles.festivalCard,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <Text style={styles.festivalEmoji}>
                    {FESTIVAL_TYPE_META[nextFestival.type]?.emoji ?? '🎉'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.festivalName}>
                      {nextFestival.nameHindi ?? nextFestival.name}
                    </Text>
                    <Text style={styles.festivalMeta}>
                      {nextFestival.daysUntil === 0
                        ? 'Aaj hai!'
                        : `${nextFestival.daysUntil} din baad`}
                      {' · '}
                      {Math.round((nextFestival.overallMultiplier - 1) * 100)}% zyada demand expected
                    </Text>
                  </View>
                  <ChevronRight color={Colors.ink[400]} size={18} strokeWidth={2.2} />
                </Pressable>
              </FadeInUp>
            )}

            {/* ─── Quick links ───────────────────────────── */}
            <FadeInUp delay={40}>
              <View style={styles.linkRow}>
                <Pressable
                  onPress={() => {
                    haptic('tap');
                    router.push('/insights/prices');
                  }}
                  style={({ pressed }) => [
                    styles.linkCard,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <Tag color={Colors.saffron[500]} size={22} strokeWidth={2.4} />
                  <Text style={styles.linkLabel}>Price Tracker</Text>
                  {unreadAlerts.length > 0 && (
                    <Badge
                      label={`${unreadAlerts.length}`}
                      tone="loss"
                    />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => {
                    haptic('tap');
                    router.push('/insights/forecast');
                  }}
                  style={({ pressed }) => [
                    styles.linkCard,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <BarChart3 color={Colors.trust[500]} size={22} strokeWidth={2.4} />
                  <Text style={styles.linkLabel}>Demand Forecast</Text>
                  {forecastAlerts.length > 0 && (
                    <Badge
                      label={`${forecastAlerts.length}`}
                      tone="warning"
                    />
                  )}
                </Pressable>
              </View>
            </FadeInUp>

            {/* ─── Price alerts preview ───────────────── */}
            {unreadAlerts.length > 0 && (
              <FadeInUp delay={80}>
                <SectionLabel
                  label={`Price Alerts · ${unreadAlerts.length}`}
                  actionLabel="Sab dekho"
                  onActionPress={() => router.push('/insights/prices')}
                />
                {unreadAlerts.slice(0, 3).map((alert) => {
                  const sevMeta = getSeverityMeta(alert.severity);
                  const platMeta = PLATFORM_META[alert.platform];
                  return (
                    <View key={alert.id} style={styles.alertRow}>
                      <Text style={styles.alertEmoji}>{sevMeta.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.alertTitle} numberOfLines={1}>
                          {alert.productName}
                        </Text>
                        <Text style={styles.alertMsg} numberOfLines={1}>
                          {platMeta?.label ?? alert.platform}: {format(alert.competitorPrice)} vs yours {format(alert.yourPrice)}
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
                        {alert.priceDifference > 0 ? '+' : ''}
                        {format(alert.priceDifference)}
                      </Text>
                    </View>
                  );
                })}
              </FadeInUp>
            )}

            {/* ─── Forecast alerts ───────────────────────── */}
            {forecastAlerts.length > 0 && (
              <FadeInUp delay={120}>
                <SectionLabel
                  label={`Stock-Up Alerts · ${forecastAlerts.length}`}
                  actionLabel="Detail"
                  onActionPress={() => router.push('/insights/forecast')}
                />
                {forecastAlerts.slice(0, 3).map((fa) => {
                  const sev = getAlertSeverityMeta(fa.severity);
                  return (
                    <View key={fa.id} style={styles.forecastAlertRow}>
                      <AlertTriangle
                        color={sev.color}
                        size={18}
                        strokeWidth={2.4}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.alertTitle} numberOfLines={1}>
                          {fa.titleHindi ?? fa.title}
                        </Text>
                        <Text style={styles.alertMsg} numberOfLines={2}>
                          {fa.messageHindi ?? fa.message}
                        </Text>
                      </View>
                      {fa.daysUntilEvent !== null && (
                        <Badge
                          label={`${fa.daysUntilEvent}d`}
                          tone="warning"
                        />
                      )}
                    </View>
                  );
                })}
              </FadeInUp>
            )}

            {/* ─── Category trends ───────────────────────── */}
            {trends.length > 0 && (
              <FadeInUp delay={160}>
                <SectionLabel label="Category Trends · This Week" />
                {trends.map((t) => {
                  const isUp = t.changePercent >= 0;
                  return (
                    <View key={t.category} style={styles.trendRow}>
                      {isUp ? (
                        <TrendingUp
                          color={Colors.profit[500]}
                          size={18}
                          strokeWidth={2.4}
                        />
                      ) : (
                        <TrendingDown
                          color={Colors.loss[500]}
                          size={18}
                          strokeWidth={2.4}
                        />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.trendCategory}>{t.category}</Text>
                        <Text style={styles.trendRevenue}>
                          {format(t.currentWeekRevenue)} · {t.currentWeekQuantity} units
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.trendChange,
                          { color: isUp ? Colors.profit[500] : Colors.loss[500] },
                        ]}
                      >
                        {isUp ? '+' : ''}
                        {Math.round(t.changePercent)}%
                      </Text>
                    </View>
                  );
                })}
              </FadeInUp>
            )}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
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

  // Festival banner
  festivalCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.saffron[50], borderWidth: 1.5,
    borderColor: Colors.saffron[500], borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  festivalEmoji: { fontSize: 32 },
  festivalName: {
    fontFamily: FontFamily.heading, fontSize: FontSize.label,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  festivalMeta: {
    fontFamily: FontFamily.body, fontSize: FontSize.micro,
    color: Colors.ink[500], marginTop: 2,
  },

  // Link row
  linkRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  linkCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm,
  },
  linkLabel: {
    flex: 1, fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },

  // Alert rows
  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  alertEmoji: { fontSize: 18 },
  alertTitle: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  alertMsg: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400],
    marginTop: 2,
  },
  alertDiff: {
    fontFamily: FontFamily.monoBold, fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
  },

  forecastAlertRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.warning[50], borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },

  // Trends
  trendRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  trendCategory: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  trendRevenue: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400],
    marginTop: 2,
  },
  trendChange: {
    fontFamily: FontFamily.monoBold, fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
  },
});
