/**
 * StockAlertCard — generative card for the check_stock intent.
 *
 * Fetches low-stock products via useLowStockAlerts and renders the
 * top 5 with their names + current stock + threshold. Tap to navigate
 * to the Dukan tab.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Package, AlertTriangle, ChevronRight } from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@theme';
import { useLowStockAlerts } from '@/features/products/hooks';
import { Skeleton } from '@/components/ui';
import { haptic } from '@/lib/haptics';

interface Props {
  responseText: string | null;
}

export function StockAlertCard({ responseText }: Props) {
  const lowStockQ = useLowStockAlerts();
  const items = (lowStockQ.data ?? []).slice(0, 5);

  function handleViewAll() {
    haptic('tap');
    router.push('/(tabs)/dukan');
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconBg}>
            <Package color={Colors.warning[500]} size={18} strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>Kam Stock Alert</Text>
          {items.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{items.length}</Text>
            </View>
          )}
        </View>

        {lowStockQ.isLoading ? (
          <>
            <Skeleton height={32} radius={6} style={{ marginTop: 8 }} />
            <Skeleton height={32} radius={6} style={{ marginTop: 6 }} />
            <Skeleton height={32} radius={6} style={{ marginTop: 6 }} />
          </>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👍</Text>
            <Text style={styles.emptyText}>Sab ka stock badhiya hai!</Text>
          </View>
        ) : (
          <>
            {items.map((p) => (
              <View key={p.id} style={styles.row}>
                <AlertTriangle
                  color={p.isOutOfStock ? Colors.loss[500] : Colors.warning[500]}
                  size={14}
                  strokeWidth={2.4}
                />
                <Text style={styles.rowName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text
                  style={[
                    styles.rowStock,
                    {
                      color: p.isOutOfStock
                        ? Colors.loss[500]
                        : Colors.warning[500],
                    },
                  ]}
                >
                  {p.stockQuantity} / {p.lowStockThreshold}
                </Text>
              </View>
            ))}
            <Pressable
              onPress={handleViewAll}
              style={({ pressed }) => [
                styles.viewAll,
                pressed && styles.viewAllPressed,
              ]}
            >
              <Text style={styles.viewAllText}>Sab dekho · Dukan tab</Text>
              <ChevronRight color={Colors.saffron[600]} size={16} strokeWidth={2.4} />
            </Pressable>
          </>
        )}
      </View>

      {responseText && <Text style={styles.responseText}>{responseText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.warning[50],
    borderWidth: 1,
    borderColor: Colors.warning[500],
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
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  badge: {
    backgroundColor: Colors.warning[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  empty: { alignItems: 'center', paddingVertical: Spacing.lg },
  emptyEmoji: { fontSize: 32, marginBottom: Spacing.xs },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 155, 0, 0.2)',
  },
  rowName: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.ink[900],
  },
  rowStock: {
    fontFamily: FontFamily.monoBold,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  viewAllPressed: { opacity: 0.6 },
  viewAllText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.saffron[600],
    fontWeight: FontWeight.bold,
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
