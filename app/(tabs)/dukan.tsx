/**
 * Dukan (Store / Inventory) — Phase 6 real data + actions.
 *
 * Replaces the Phase 2 mock with:
 *   - useProducts() — real list from backend
 *   - useLowStockAlerts() — for the "Kam Stock" filter count
 *   - openAddProduct() — global sheet for new items
 *   - openStockUpdate() — global sheet for +/- adjustments
 *   - Camera FAB → /dukan/scan → returns with ?barcode=XXX
 *
 * The barcode param is read on focus; if present, opens the
 * AddProductSheet pre-filled and clears the param so it doesn't
 * re-trigger on tab switch.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Plus, Search, Package } from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
  TouchTarget,
} from '../../src/theme';
import { haptic } from '../../src/lib/haptics';
import { FadeInUp } from '../../src/components/animations';
import { Chip, Badge } from '../../src/components/ui';
import { useCurrency } from '../../src/hooks/useCurrency';
import {
  useProducts,
  useLowStockAlerts,
} from '../../src/features/products/hooks';
import type { Product } from '../../src/features/products/schemas';
import { useSheets } from '../../src/components/sheets';
import { useStoreStats } from '../../src/features/businesses/hooks';

type Filter = 'all' | 'low' | 'out';

export default function DukanScreen() {
  const { format } = useCurrency();
  const params = useLocalSearchParams<{ barcode?: string; manualAdd?: string }>();
  const [filter, setFilter] = useState<Filter>('all');

  const productsQ = useProducts();
  const lowStockQ = useLowStockAlerts();
  const storeStatsQ = useStoreStats();
  const { openAddProduct, openStockUpdate, openSearch } = useSheets();

  const products = productsQ.data ?? [];

  // ─── Open AddProductSheet when returning from scan ─────
  useEffect(() => {
    if (params.barcode) {
      openAddProduct({ initialBarcode: params.barcode });
      // Clear the param so it doesn't re-trigger on focus
      router.setParams({ barcode: undefined });
    } else if (params.manualAdd) {
      openAddProduct();
      router.setParams({ manualAdd: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.barcode, params.manualAdd]);

  const counts = useMemo(
    () => ({
      all: products.length,
      low: products.filter((p) => p.isLowStock && !p.isOutOfStock).length,
      out: products.filter((p) => p.isOutOfStock).length,
    }),
    [products],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case 'low':
        return products.filter((p) => p.isLowStock && !p.isOutOfStock);
      case 'out':
        return products.filter((p) => p.isOutOfStock);
      default:
        return products;
    }
  }, [products, filter]);

  const totalStockValue = useMemo(
    () => products.reduce((s, p) => s + p.stockValue, 0),
    [products],
  );

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([
      productsQ.refetch(),
      lowStockQ.refetch(),
      storeStatsQ.refetch(),
    ]);
  }

  function handleScanPress() {
    haptic('tap');
    router.push('/dukan/scan');
  }

  function handleAddManual() {
    haptic('tap');
    openAddProduct();
  }

  function handleProductPress(product: Product) {
    haptic('tap');
    openStockUpdate({
      productId: product.id,
      productName: product.name,
      currentStock: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ──────────────────────────────────── */}
      <FadeInUp delay={0}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Meri Dukan</Text>
            <Text style={styles.subtitle}>
              {products.length} saamaan · {format(totalStockValue)} stock
              {storeStatsQ.data && storeStatsQ.data.ordersToday > 0
                ? ` · ${storeStatsQ.data.ordersToday} orders aaj`
                : ''}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
            onPress={() => {
              haptic('tap');
              openSearch();
            }}
            accessibilityLabel="Search products"
          >
            <Search color={Colors.ink[700]} size={20} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.cameraFab,
              pressed && styles.cameraFabPressed,
            ]}
            onPress={handleScanPress}
            accessibilityLabel="Scan barcode"
          >
            <Camera color={Colors.white} size={20} strokeWidth={2.4} />
          </Pressable>
        </View>
      </FadeInUp>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={productsQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Low stock banner ────────────────────────── */}
        {counts.low + counts.out > 0 && (
          <FadeInUp delay={40}>
            <Pressable
              onPress={() => setFilter('low')}
              style={styles.alertBanner}
            >
              <Package color={Colors.warning[500]} size={20} strokeWidth={2.4} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {counts.out > 0
                    ? `${counts.out} saamaan khatam, ${counts.low} kam`
                    : `${counts.low} saamaan kam ho rahe hain`}
                </Text>
                <Text style={styles.alertSub}>
                  Tap karke dekho aur reorder karo
                </Text>
              </View>
              <Text style={styles.alertArrow}>›</Text>
            </Pressable>
          </FadeInUp>
        )}

        {/* ─── Filter chips ───────────────────────────── */}
        <FadeInUp delay={80}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <Chip
              label="Sab"
              count={counts.all}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <Chip
              label="Kam Stock"
              count={counts.low}
              active={filter === 'low'}
              onPress={() => setFilter('low')}
            />
            <Chip
              label="Khatam"
              count={counts.out}
              active={filter === 'out'}
              onPress={() => setFilter('out')}
            />
          </ScrollView>
        </FadeInUp>

        {/* ─── Product grid ───────────────────────────── */}
        {productsQ.isLoading && products.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Saamaan load ho raha hai…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Abhi koi saamaan nahi · Tap + to add'
                : filter === 'low'
                ? 'Sab ka stock badhiya hai 👍'
                : 'Koi saamaan khatam nahi'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((p, i) => (
              <FadeInUp key={p.id} delay={120 + i * 30} style={styles.gridItem}>
                <ProductCard
                  product={p}
                  onPress={() => handleProductPress(p)}
                />
              </FadeInUp>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── + FAB (manual add) ───────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.addFab, pressed && styles.addFabPressed]}
        onPress={handleAddManual}
        accessibilityLabel="Add product manually"
      >
        <Plus color={Colors.white} size={28} strokeWidth={2.6} />
      </Pressable>
    </SafeAreaView>
  );
}

// ─── Product card ────────────────────────────────────────
function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const stockColor = product.isOutOfStock
    ? Colors.loss[500]
    : product.isLowStock
    ? Colors.warning[500]
    : Colors.ink[400];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.product,
        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View
        style={[
          styles.productImg,
          product.isOutOfStock && styles.productImgOut,
        ]}
      >
        <Text style={styles.productInitial}>
          {product.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.productPrice}>₹{product.price.toLocaleString('en-IN')}</Text>
      <View style={styles.productStockRow}>
        <Text style={[styles.productStock, { color: stockColor }]}>
          Stock: {product.stockQuantity}
        </Text>
        {product.isOutOfStock ? (
          <Badge label="OUT" tone="loss" />
        ) : product.isLowStock ? (
          <Badge label="LOW" tone="warning" />
        ) : null}
      </View>
      {product.margin !== null && (
        <Text style={styles.productMargin}>{product.margin}% margin</Text>
      )}
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: Colors.saffron[50] },
  cameraFab: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.saffronGlow,
  },
  cameraFabPressed: { backgroundColor: Colors.saffron[600] },
  scroll: { padding: Spacing.xl },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.warning[50],
    borderWidth: 1,
    borderColor: Colors.warning[500],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  alertTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.warning[700],
  },
  alertSub: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
    marginTop: 2,
  },
  alertArrow: {
    fontSize: 22,
    color: Colors.warning[500],
  },

  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  empty: {
    padding: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[400],
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: { width: '47%' },
  product: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  productImg: {
    height: 80,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  productImgOut: {
    backgroundColor: Colors.loss[50],
  },
  productInitial: {
    fontFamily: FontFamily.heading,
    fontSize: 32,
    fontWeight: FontWeight.heavy,
    color: Colors.saffron[600],
  },
  productName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    minHeight: 32,
  },
  productPrice: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
    color: Colors.saffron[600],
    marginTop: 2,
  },
  productStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productStock: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  productMargin: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.profit[500],
    marginTop: 2,
  },

  addFab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: 84,
    width: TouchTarget.voiceFAB,
    height: TouchTarget.voiceFAB,
    borderRadius: TouchTarget.voiceFAB / 2,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.saffronGlow,
  },
  addFabPressed: { backgroundColor: Colors.saffron[600] },
});
