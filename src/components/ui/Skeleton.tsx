/**
 * Skeleton — loading placeholder with a saffron-tinted shimmer.
 *
 * Use this anywhere data is loading to avoid empty-space "broken" feeling.
 * Never use gray — it clashes with warm-white.
 */

import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Shimmer } from '../animations/Shimmer';
import { Radius, Spacing } from '@theme';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 20,
  radius = Radius.sm,
  style,
}: Props) {
  return (
    <View style={[{ width, height }, style]}>
      <Shimmer width="100%" height={height} radius={radius} />
    </View>
  );
}

/**
 * Compound skeleton for a transaction row.
 */
export function SkeletonTxnRow() {
  return (
    <View style={styles.txnRow}>
      <Skeleton width={34} height={34} radius={10} />
      <View style={styles.txnInfo}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={10} style={styles.txnMeta} />
      </View>
      <Skeleton width={60} height={16} />
    </View>
  );
}

/**
 * Compound skeleton for a KPI tile.
 */
export function SkeletonKpiTile() {
  return (
    <View style={styles.kpi}>
      <Skeleton width="60%" height={10} />
      <Skeleton width="80%" height={22} style={{ marginTop: 6 }} />
      <Skeleton width="40%" height={10} style={{ marginTop: 4 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  txnInfo: { flex: 1 },
  txnMeta: { marginTop: 4 },
  kpi: {
    borderRadius: 14,
    padding: Spacing.md,
  },
});
