/**
 * Health Score Breakdown — full 6-component view.
 *
 * Shows the big HealthScoreGauge at top + each of the 6 components
 * as a progress bar with description and improvement tip.
 *
 * Wired to GET /businesses/:id/analytics/health-score/breakdown.
 */

import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Sparkles } from 'lucide-react-native';

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
import { HealthScoreGauge } from '@/components/charts';
import { Skeleton, Card } from '@/components/ui';
import { useHealthScoreBreakdown } from '@/features/analytics/hooks';
import { HEALTH_COMPONENTS } from '@/features/analytics/schemas';

export default function HealthScoreScreen() {
  const breakdownQ = useHealthScoreBreakdown();
  const data = breakdownQ.data;

  async function handleRefresh() {
    haptic('tap');
    await breakdownQ.refetch();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityLabel="Back"
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Badhiya Score</Text>
          <Text style={styles.subtitle}>0 to 900 · 6 components</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={breakdownQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Big gauge ───────────────────────────────── */}
        <FadeInUp delay={0}>
          <View style={styles.gaugeWrap}>
            {breakdownQ.isLoading ? (
              <Skeleton width={220} height={220} radius={110} />
            ) : data ? (
              <HealthScoreGauge
                score={data.total}
                level={data.level}
                size={220}
                thickness={16}
              />
            ) : null}
          </View>
        </FadeInUp>

        {/* ─── Components breakdown ────────────────────── */}
        <FadeInUp delay={80}>
          <Text style={styles.sectionTitle}>Components</Text>
          {HEALTH_COMPONENTS.map((c, i) => {
            const value = data ? (data[c.key] as number) : 0;
            const ratio = value / c.max;
            const color =
              ratio >= 0.8
                ? Colors.profit[500]
                : ratio >= 0.5
                ? Colors.saffron[500]
                : ratio >= 0.3
                ? Colors.warning[500]
                : Colors.loss[500];

            return (
              <View key={c.key} style={styles.componentRow}>
                <View style={styles.componentHeader}>
                  <Text style={styles.componentEmoji}>{c.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.componentLabel}>{c.labelHi}</Text>
                    <Text style={styles.componentDesc}>{c.descHi}</Text>
                  </View>
                  <View style={styles.componentScore}>
                    <Text style={[styles.componentValue, { color }]}>
                      {value}
                    </Text>
                    <Text style={styles.componentMax}>/ {c.max}</Text>
                  </View>
                </View>
                <View style={styles.bar}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.min(100, ratio * 100)}%`, backgroundColor: color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </FadeInUp>

        {/* ─── How to improve ──────────────────────────── */}
        <FadeInUp delay={160}>
          <Card variant="warm" padding="lg" style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Sparkles color={Colors.saffron[600]} size={18} strokeWidth={2.4} />
              <Text style={styles.tipTitle}>Score kaise badhe?</Text>
            </View>
            <Text style={styles.tipText}>
              • Daily transactions record karo (bookkeeping +200{'\n'}
              • UPI lo, cash kam (digital +150){'\n'}
              • Udhaar 30 din mein wapas le aao (credit +150){'\n'}
              • GST + Udyam register karo (compliance +100){'\n'}
              • App roz kholo, AI advisor use karo (engagement +100)
            </Text>
          </Card>
        </FadeInUp>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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
  gaugeWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  componentRow: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  componentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  componentEmoji: { fontSize: 22 },
  componentLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  componentDesc: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
    marginTop: 1,
  },
  componentScore: { alignItems: 'flex-end' },
  componentValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
  },
  componentMax: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[400],
  },
  bar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  tipCard: { marginTop: Spacing.lg },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  tipText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    lineHeight: 22,
  },
});
