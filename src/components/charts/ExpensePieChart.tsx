/**
 * ExpensePieChart — donut chart for expense categories.
 *
 * Pure SVG, no extra deps. Computes arc paths from category percentages,
 * renders the donut with a hole in the middle showing the total.
 *
 * Limits to top 6 categories + "Other" bucket. Each gets a color from
 * a fixed 7-color palette so categories stay visually consistent.
 */

import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Colors, FontFamily, FontSize, FontWeight, Spacing } from '@theme';
import { useCurrency } from '@/hooks/useCurrency';

interface Slice {
  category: string;
  amount: number;
  percentage?: number;
}

interface Props {
  data: Slice[];
  total: number;
  size?: number;
  thickness?: number;
}

const PALETTE = [
  Colors.saffron[500],
  Colors.profit[500],
  Colors.trust[500],
  Colors.warning[500],
  '#7C3AED', // purple
  '#EC4899', // pink
  Colors.ink[400], // "Other" fallback
];

const TOP_N = 6;

export function ExpensePieChart({
  data,
  total,
  size = 220,
  thickness = 24,
}: Props) {
  const { format } = useCurrency();

  if (!data || data.length === 0 || total <= 0) {
    return (
      <View style={[styles.empty, { width: size, height: size }]}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyText}>Koi kharcha record nahi</Text>
      </View>
    );
  }

  // Build slices: top N + Other
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const topN = sorted.slice(0, TOP_N);
  const otherAmount = sorted
    .slice(TOP_N)
    .reduce((s, d) => s + d.amount, 0);
  const slices: (Slice & { color: string })[] = topN.map((d, i) => ({
    ...d,
    percentage: d.percentage ?? Math.round((d.amount / total) * 100),
    color: PALETTE[i] ?? Colors.ink[400]!,
  }));
  if (otherAmount > 0) {
    slices.push({
      category: 'Other',
      amount: otherAmount,
      percentage: Math.round((otherAmount / total) * 100),
      color: PALETTE[6]!,
    });
  }

  // Compute arc paths
  const center = size / 2;
  const outerR = center - 4;
  const innerR = outerR - thickness;
  let cumulative = 0;

  const arcs = slices.map((s) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += s.amount;
    const endAngle = (cumulative / total) * 360;
    const path = describeDonutSlice(center, center, outerR, innerR, startAngle, endAngle);
    return { ...s, path };
  });

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G>
            {arcs.map((arc, i) => (
              <Path key={i} d={arc.path} fill={arc.color} />
            ))}
          </G>
          {/* Inner hole */}
          <Circle cx={center} cy={center} r={innerR - 1} fill={Colors.bg} />
        </Svg>
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={styles.centerLabel}>Total Kharcha</Text>
          <Text style={styles.centerValue}>{format(total)}</Text>
          <Text style={styles.centerCount}>
            {data.length} {data.length === 1 ? 'category' : 'categories'}
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {arcs.map((s) => (
          <View key={s.category} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendCat} numberOfLines={1}>
              {s.category}
            </Text>
            <Text style={styles.legendAmt}>{format(s.amount)}</Text>
            <Text style={styles.legendPct}>{s.percentage}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Donut slice path math ──────────────────────────────
function describeDonutSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  // Avoid 360° degenerate case (renders nothing)
  if (endAngle - startAngle >= 359.999) {
    endAngle = startAngle + 359.999;
  }
  const startOuter = polar(cx, cy, outerR, endAngle);
  const endOuter = polar(cx, cy, outerR, startAngle);
  const startInner = polar(cx, cy, innerR, startAngle);
  const endInner = polar(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[400],
  },
  center: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.bold,
  },
  centerValue: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    marginTop: 2,
  },
  centerCount: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
    marginTop: 1,
  },
  legend: {
    width: '100%',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendCat: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
  },
  legendAmt: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.caption,
    color: Colors.ink[900],
    fontWeight: FontWeight.bold,
  },
  legendPct: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    minWidth: 32,
    textAlign: 'right',
  },
});
