/**
 * /ondc/catalog — ONDC catalog management.
 *
 * Two sections:
 *   1. Currently listed items (with delist action)
 *   2. Local inventory picker (multi-select → Sync to ONDC)
 *
 * Wires:
 *   - GET  /ondc/catalog/items                (currently listed)
 *   - POST /ondc/catalog/sync                 (push selected products)
 *   - POST /ondc/catalog/delist/:productId    (remove from catalog)
 *   - GET  /products                          (local inventory picker)
 *
 * Sync rule: only products with price > 0 AND stockQuantity > 0 are
 * eligible. Already-listed products are filtered out of the picker.
 */

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Circle,
  Trash2,
  Search,
  AlertCircle,
  Sparkles,
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
import { Button, Skeleton, SectionLabel, EmptyState } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import {
  useOndcCatalog,
  useSyncCatalog,
  useDelistProduct,
} from '@/features/ondc/hooks';
import { useProducts } from '@/features/products/hooks';
import type { Product } from '@/features/products/schemas';
import type { OndcCatalogItem } from '@/features/ondc/schemas';

export default function OndcCatalogScreen() {
  const { format } = useCurrency();
  const catalogQ = useOndcCatalog();
  const productsQ = useProducts();
  const syncMut = useSyncCatalog();
  const delistMut = useDelistProduct();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const listedItems: OndcCatalogItem[] = catalogQ.data ?? [];
  const allProducts: Product[] = productsQ.data ?? [];

  // Filter local inventory: not already listed + has stock + has price
  const listedProductIds = useMemo(
    () => new Set(listedItems.map((i) => i.productId).filter(Boolean)),
    [listedItems],
  );

  const eligibleProducts = useMemo(() => {
    return allProducts.filter(
      (p) =>
        !listedProductIds.has(p.id) &&
        p.price > 0 &&
        p.stockQuantity > 0 &&
        p.isActive,
    );
  }, [allProducts, listedProductIds]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligibleProducts;
    return eligibleProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q),
    );
  }, [eligibleProducts, query]);

  const ineligibleCount = useMemo(
    () =>
      allProducts.filter(
        (p) =>
          !listedProductIds.has(p.id) &&
          (p.price <= 0 || p.stockQuantity <= 0 || !p.isActive),
      ).length,
    [allProducts, listedProductIds],
  );

  function toggleSelect(productId: string) {
    haptic('tap');
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function selectAll() {
    haptic('tap');
    if (selected.size === filteredProducts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredProducts.map((p) => p.id)));
    }
  }

  async function handleSync() {
    if (selected.size === 0) return;
    Alert.alert(
      `Sync ${selected.size} product${selected.size > 1 ? 's' : ''}?`,
      'Yeh products ONDC network par live ho jayenge aur 100+ buyer apps mein dikhenge. Aap kabhi bhi delist kar sakte ho.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync to ONDC',
          onPress: async () => {
            try {
              const result = await syncMut.mutateAsync({
                productIds: Array.from(selected),
              });
              setSelected(new Set());
              Alert.alert(
                'Sync Complete',
                `✅ ${result.synced} synced\n` +
                  (result.skipped > 0 ? `⏭️ ${result.skipped} skipped\n` : '') +
                  (result.failed > 0 ? `❌ ${result.failed} failed` : ''),
              );
            } catch (err) {
              Alert.alert('Sync failed', (err as Error).message);
            }
          },
        },
      ],
    );
  }

  async function handleDelist(item: OndcCatalogItem) {
    Alert.alert(
      'Delist product?',
      `${item.productName} ko ONDC se hata diya jayega. Customer ise dhundh nahi payenge.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delist',
          style: 'destructive',
          onPress: async () => {
            try {
              await delistMut.mutateAsync(item.productId);
            } catch (err) {
              Alert.alert('Error', (err as Error).message);
            }
          },
        },
      ],
    );
  }

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([catalogQ.refetch(), productsQ.refetch()]);
  }

  const isLoading = catalogQ.isLoading || productsQ.isLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>ONDC Catalog</Text>
          <Text style={styles.subtitle}>
            {listedItems.length} live · {eligibleProducts.length} ready to sync
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={catalogQ.isFetching || productsQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {isLoading && listedItems.length === 0 && allProducts.length === 0 ? (
          <>
            <Skeleton height={64} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={64} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={64} radius={12} style={{ marginBottom: 8 }} />
          </>
        ) : (
          <>
            {/* ─── Listed items section ────────────────── */}
            <FadeInUp delay={0}>
              <SectionLabel
                label={`Live on ONDC · ${listedItems.length}`}
              />
              {listedItems.length === 0 ? (
                <View style={styles.emptyMini}>
                  <Package color={Colors.ink[300]} size={32} strokeWidth={1.6} />
                  <Text style={styles.emptyMiniText}>
                    Abhi koi product live nahi · Niche se products select karke sync karo
                  </Text>
                </View>
              ) : (
                listedItems.map((item, i) => (
                  <FadeInUp key={item.id} delay={i * 20}>
                    <View style={styles.listedRow}>
                      <View style={styles.listedIcon}>
                        <Package
                          color={Colors.profit[500]}
                          size={18}
                          strokeWidth={2.4}
                        />
                      </View>
                      <View style={styles.listedInfo}>
                        <Text style={styles.listedName} numberOfLines={1}>
                          {item.productName}
                        </Text>
                        <View style={styles.listedMeta}>
                          {item.ondcCategory && (
                            <Text style={styles.listedCategory} numberOfLines={1}>
                              {item.ondcCategory}
                            </Text>
                          )}
                          <Text style={styles.listedPrice}>
                            {format(item.listPrice)}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => handleDelist(item)}
                        style={({ pressed }) => [
                          styles.delistBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                        hitSlop={8}
                      >
                        <Trash2 color={Colors.loss[500]} size={16} strokeWidth={2.4} />
                      </Pressable>
                    </View>
                  </FadeInUp>
                ))
              )}
            </FadeInUp>

            {/* ─── Local inventory picker ──────────────── */}
            <FadeInUp delay={80}>
              <View style={styles.pickerHeader}>
                <SectionLabel label={`Add from inventory · ${eligibleProducts.length}`} />
                {filteredProducts.length > 0 && (
                  <Pressable onPress={selectAll} hitSlop={8}>
                    <Text style={styles.selectAllText}>
                      {selected.size === filteredProducts.length ? 'Clear' : 'Select all'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Search */}
              {eligibleProducts.length > 5 && (
                <View style={styles.searchBar}>
                  <Search color={Colors.ink[400]} size={16} strokeWidth={2.2} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search products…"
                    placeholderTextColor={Colors.ink[300]}
                    style={styles.searchInput}
                  />
                </View>
              )}

              {/* Ineligible warning */}
              {ineligibleCount > 0 && (
                <View style={styles.warning}>
                  <AlertCircle
                    color={Colors.warning[500]}
                    size={14}
                    strokeWidth={2.4}
                  />
                  <Text style={styles.warningText}>
                    {ineligibleCount} product
                    {ineligibleCount > 1 ? 's' : ''} need price + stock to sync
                  </Text>
                </View>
              )}

              {filteredProducts.length === 0 ? (
                eligibleProducts.length === 0 ? (
                  <EmptyState
                    icon={
                      <Sparkles color={Colors.ink[300]} size={40} strokeWidth={1.6} />
                    }
                    title="Sab products live hain"
                    body="Aapke sabhi eligible products ONDC par list ho chuke hain"
                  />
                ) : (
                  <Text style={styles.noResults}>Koi product nahi mila</Text>
                )
              ) : (
                filteredProducts.map((p, i) => {
                  const isSelected = selected.has(p.id);
                  return (
                    <FadeInUp key={p.id} delay={100 + i * 20}>
                      <Pressable
                        onPress={() => toggleSelect(p.id)}
                        style={({ pressed }) => [
                          styles.pickerRow,
                          isSelected && styles.pickerRowSelected,
                          pressed && { opacity: 0.92 },
                        ]}
                      >
                        {isSelected ? (
                          <CheckCircle2
                            color={Colors.saffron[500]}
                            size={22}
                            strokeWidth={2.4}
                          />
                        ) : (
                          <Circle
                            color={Colors.ink[300]}
                            size={22}
                            strokeWidth={2.2}
                          />
                        )}
                        <View style={styles.pickerInfo}>
                          <Text style={styles.pickerName} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <View style={styles.pickerMeta}>
                            {p.category && (
                              <Text style={styles.pickerCategory}>{p.category}</Text>
                            )}
                            <Text style={styles.pickerStock}>
                              {p.stockQuantity} in stock
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.pickerPrice}>{format(p.price)}</Text>
                      </Pressable>
                    </FadeInUp>
                  );
                })
              )}
            </FadeInUp>
          </>
        )}

        <View style={{ height: selected.size > 0 ? 120 : 60 }} />
      </ScrollView>

      {/* ─── Sticky sync CTA ─────────────────────────── */}
      {selected.size > 0 && (
        <View style={styles.stickyBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.stickyCount}>
              {selected.size} selected
            </Text>
            <Text style={styles.stickyHint}>Ready to push to ONDC</Text>
          </View>
          <Button
            label={`Sync ${selected.size}`}
            onPress={handleSync}
            loading={syncMut.isPending}
            size="lg"
            hapticPattern="revealMoney"
          />
        </View>
      )}
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

  // Listed items
  emptyMini: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingHorizontal: Spacing.lg,
  },
  emptyMiniText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 240,
  },
  listedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.profit[500] + '30',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  listedIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.profit[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  listedInfo: { flex: 1, minWidth: 0 },
  listedName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  listedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  listedCategory: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    flexShrink: 1,
  },
  listedPrice: {
    fontFamily: FontFamily.monoBold,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.profit[500],
  },
  delistBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.loss[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Picker
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  selectAllText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    color: Colors.saffron[600],
    fontWeight: FontWeight.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[900],
    paddingVertical: Spacing.sm + 2,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning[50],
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  warningText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.warning[700],
    flex: 1,
  },
  noResults: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pickerRowSelected: {
    borderColor: Colors.saffron[500],
    backgroundColor: Colors.saffron[50],
  },
  pickerInfo: { flex: 1, minWidth: 0 },
  pickerName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  pickerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  pickerCategory: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
  },
  pickerStock: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
  },
  pickerPrice: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },

  // Sticky bar
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    ...Shadow.lg,
  },
  stickyCount: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  stickyHint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
  },
});
