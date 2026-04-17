/**
 * KpiTile — a single tile in a dashboard bento grid.
 *
 * Shows a label, a big value (via NumberTicker if numeric), and an
 * optional delta line ("▲ 12%" / "▼ 8%" / "12 grahak").
 *
 * Tones: saffron (brand), profit (green), loss (red), warning (amber),
 * neutral (white). Color + directional arrow + label — never color alone.
 */

import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, Radius } from '@theme';
import { NumberTicker } from '../animations/NumberTicker';

type Tone = 'saffron' | 'profit' | 'loss' | 'warning' | 'trust' | 'neutral';
type Direction = 'up' | 'down' | 'flat';

interface Props {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  delta?: string;
  deltaDirection?: Direction;
  tone?: Tone;
  decimals?: number;
}

export function KpiTile({
  label,
  value,
  prefix = '',
  suffix = '',
  delta,
  deltaDirection = 'flat',
  tone = 'neutral',
  decimals = 0,
}: Props) {
  const t = toneStyles[tone];
  const isNumeric = typeof value === 'number';

  return (
    <View style={[styles.base, t.bg]}>
      <Text style={styles.label}>{label}</Text>
      {isNumeric ? (
        <NumberTicker
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          style={styles.value}
        />
      ) : (
        <Text style={styles.value}>
          {prefix}
          {value}
          {suffix}
        </Text>
      )}
      {delta ? (
        <Text
          style={[
            styles.delta,
            deltaDirection === 'up' && styles.deltaUp,
            deltaDirection === 'down' && styles.deltaDown,
          ]}
        >
          {deltaDirection === 'up' && '▲ '}
          {deltaDirection === 'down' && '▼ '}
          {delta}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minHeight: 92,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: FontFamily.mono,
    fontSize: 20,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    marginTop: 4,
    padding: 0,
    height: 26,
  },
  delta: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.ink[500],
    marginTop: 3,
  },
  deltaUp: { color: Colors.profit[500] },
  deltaDown: { color: Colors.loss[500] },
});

const toneStyles: Record<Tone, { bg: ViewStyle }> = {
  saffron: {
    bg: { backgroundColor: Colors.saffron[50] },
  },
  profit: {
    bg: { backgroundColor: Colors.profit[50] },
  },
  loss: {
    bg: { backgroundColor: Colors.loss[50] },
  },
  warning: {
    bg: { backgroundColor: Colors.warning[50] },
  },
  trust: {
    bg: { backgroundColor: Colors.trust[50] },
  },
  neutral: {
    bg: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
    },
  },
};
