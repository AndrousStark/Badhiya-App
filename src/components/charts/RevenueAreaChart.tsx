/**
 * RevenueAreaChart — saffron area chart for daily revenue.
 *
 * SVG-based for zero extra deps. Computes a smooth path from data
 * points and overlays a gradient fill + stroke + the latest-point dot.
 *
 * Props:
 *   data: Array<{date, revenue}>  — chronological order
 *   width: container width (passed in)
 *   height: container height (defaults 120)
 */

import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Line,
} from 'react-native-svg';
import { Colors, FontFamily, FontSize } from '@theme';

export interface RevenuePoint {
  date: string;
  revenue: number;
}

interface Props {
  data: RevenuePoint[];
  width?: number;
  height?: number;
  loading?: boolean;
}

const PADDING = { top: 12, right: 12, bottom: 24, left: 12 };

export function RevenueAreaChart({
  data,
  width = 320,
  height = 140,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>Chart load ho raha hai…</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyEmoji}>📈</Text>
        <Text style={styles.emptyText}>Abhi koi data nahi · sale record karo</Text>
      </View>
    );
  }

  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  // Build path: linear interpolation between points
  const points = data.map((d, i) => {
    const x = PADDING.left + (i / Math.max(1, data.length - 1)) * innerW;
    const y = PADDING.top + innerH - (d.revenue / maxRevenue) * innerH;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L${points[points.length - 1]!.x.toFixed(1)},${(PADDING.top + innerH).toFixed(1)} L${points[0]!.x.toFixed(1)},${(PADDING.top + innerH).toFixed(1)} Z`;

  const last = points[points.length - 1]!;
  const lastValue = data[data.length - 1]!.revenue;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.saffron[500]} stopOpacity="0.35" />
            <Stop offset="1" stopColor={Colors.saffron[500]} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Area fill */}
        <Path d={areaPath} fill="url(#revGrad)" />
        {/* Line stroke */}
        <Path
          d={linePath}
          stroke={Colors.saffron[500]}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Latest point glow */}
        <Circle
          cx={last.x}
          cy={last.y}
          r={8}
          fill={Colors.saffron[500]}
          opacity={0.15}
        />
        <Circle
          cx={last.x}
          cy={last.y}
          r={4}
          fill={Colors.saffron[500]}
          stroke={Colors.surface}
          strokeWidth={2}
        />
        {/* Bottom axis line */}
        <Line
          x1={PADDING.left}
          y1={PADDING.top + innerH + 1}
          x2={width - PADDING.right}
          y2={PADDING.top + innerH + 1}
          stroke={Colors.border}
          strokeWidth={1}
        />
      </Svg>

      {/* Floating value tag near the latest point */}
      <View
        style={[
          styles.valueTag,
          {
            left: Math.max(0, Math.min(width - 80, last.x - 40)),
            top: Math.max(0, last.y - 32),
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.valueText}>
          ₹{lastValue.toLocaleString('en-IN')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.saffron[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 28, marginBottom: 4 },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
  },
  valueTag: {
    position: 'absolute',
    backgroundColor: Colors.ink[900],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  valueText: {
    fontFamily: FontFamily.monoBold,
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700',
  },
});
