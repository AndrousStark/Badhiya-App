/**
 * HealthScoreGauge — circular gauge for the Badhiya Score (0-900).
 *
 * SVG-based, configurable size + thickness. Color is computed from
 * the score: 700+ profit green, 500+ saffron, 300+ warning amber,
 * else loss red. The center shows the score number + tier label.
 *
 * Used by:
 *   - HealthScoreCard (chat generative card, small)
 *   - app/finance/health-score.tsx (full breakdown screen, large)
 *   - app/(tabs)/paisa.tsx (mid)
 */

import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontFamily, FontWeight } from '@theme';

interface Props {
  score: number;
  max?: number;
  level?: string | null;
  size?: number;
  thickness?: number;
}

export function HealthScoreGauge({
  score,
  max = 900,
  level,
  size = 160,
  thickness = 12,
}: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, score / max));
  const dashOffset = circumference * (1 - ratio);
  const center = size / 2;

  const tierColor = colorForScore(score);

  // Scale font sizes based on overall size
  const scoreFontSize = size * 0.22;
  const maxFontSize = size * 0.07;
  const tierFontSize = size * 0.075;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.border}
          strokeWidth={thickness}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={tierColor}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          rotation={-90}
          originX={center}
          originY={center}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.score, { fontSize: scoreFontSize }]}>
          {score}
        </Text>
        <Text style={[styles.max, { fontSize: maxFontSize }]}>/ {max}</Text>
        {level && (
          <Text
            style={[styles.tier, { fontSize: tierFontSize, color: tierColor }]}
          >
            {level.toUpperCase()}
          </Text>
        )}
      </View>
    </View>
  );
}

function colorForScore(score: number): string {
  if (score >= 700) return Colors.profit[500];
  if (score >= 500) return Colors.saffron[500];
  if (score >= 300) return Colors.warning[500];
  return Colors.loss[500];
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: FontFamily.mono,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },
  max: {
    fontFamily: FontFamily.body,
    color: Colors.ink[400],
    marginTop: -2,
  },
  tier: {
    fontFamily: FontFamily.heading,
    fontWeight: FontWeight.heavy,
    marginTop: 4,
    letterSpacing: 1,
  },
});
