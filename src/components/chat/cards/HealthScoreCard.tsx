/**
 * HealthScoreCard — generative card for the health_score intent.
 *
 * Reads the cached health score from auth$ (set on login by the
 * dashboard hook). Shows a mini gauge + tier label + tip about how to
 * improve the score.
 *
 * Phase 8 will add a dedicated /finance/health-score route this card
 * can link to.
 */

import { View, Text, StyleSheet } from 'react-native';
import { observer } from '@legendapp/state/react';
import Svg, { Circle } from 'react-native-svg';
import { Award } from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@theme';
import { useDashboard } from '@/features/businesses/hooks';

interface Props {
  responseText: string | null;
}

const RADIUS = 42;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_SCORE = 900;

export const HealthScoreCard = observer(function HealthScoreCard({
  responseText,
}: Props) {
  const dashQ = useDashboard();
  const score = dashQ.data?.healthScore ?? 0;
  const level = dashQ.data?.healthLevel ?? '—';

  const ratio = Math.max(0, Math.min(1, score / MAX_SCORE));
  const dashOffset = CIRCUMFERENCE * (1 - ratio);

  const tierColor =
    score >= 700
      ? Colors.profit[500]
      : score >= 500
      ? Colors.saffron[500]
      : score >= 300
      ? Colors.warning[500]
      : Colors.loss[500];

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconBg}>
            <Award color={Colors.saffron[600]} size={18} strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>Badhiya Score</Text>
        </View>

        <View style={styles.gaugeRow}>
          <View style={styles.gaugeWrap}>
            <Svg width={100} height={100} viewBox="0 0 100 100">
              <Circle
                cx={50}
                cy={50}
                r={RADIUS}
                stroke={Colors.border}
                strokeWidth={STROKE}
                fill="none"
              />
              <Circle
                cx={50}
                cy={50}
                r={RADIUS}
                stroke={tierColor}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation={-90}
                originX={50}
                originY={50}
              />
            </Svg>
            <View style={styles.gaugeCenter}>
              <Text style={styles.gaugeNum}>{score}</Text>
              <Text style={styles.gaugeMax}>/ 900</Text>
            </View>
          </View>
          <View style={styles.gaugeMeta}>
            <Text style={styles.tierLabel}>TIER</Text>
            <Text style={[styles.tierValue, { color: tierColor }]}>
              {level.toUpperCase()}
            </Text>
            <Text style={styles.tip}>
              {score >= 700
                ? 'Aap top 10% mein hain 🏆'
                : score >= 500
                ? 'Achha kar rahe ho! Aur upar jao'
                : 'Roz billing karke score badhao'}
            </Text>
          </View>
        </View>
      </View>

      {responseText && <Text style={styles.responseText}>{responseText}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  gaugeWrap: { width: 100, height: 100, position: 'relative' },
  gaugeCenter: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeNum: {
    fontFamily: FontFamily.mono,
    fontSize: 22,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },
  gaugeMax: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.ink[400],
  },
  gaugeMeta: { flex: 1 },
  tierLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 9,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tierValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.heavy,
    marginTop: 2,
  },
  tip: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  responseText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    lineHeight: 20,
  },
});
