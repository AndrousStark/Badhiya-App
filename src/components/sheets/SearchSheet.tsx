/**
 * SearchSheet — global search across transactions, customers, products.
 *
 * Wires GET /businesses/:id/search?q=. Debounced 300ms via useGlobalSearch.
 * Results are grouped by kind (Customers / Products / Transactions) with
 * a "no results" empty state and skeleton loaders while typing.
 *
 * Tap a result navigates to the relevant detail screen.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Search, X, BookText, Store, Receipt } from 'lucide-react-native';

import { BottomSheet } from './BottomSheet';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '@theme';
import { haptic } from '@/lib/haptics';
import { useGlobalSearch } from '@/features/search/hooks';
import { useCurrency } from '@/hooks/useCurrency';
import { Skeleton } from '@/components/ui';

export interface SearchSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function SearchSheet({ visible, onClose }: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const { format } = useCurrency();
  const searchQ = useGlobalSearch(query);

  const result = searchQ.data;
  const totalResults =
    (result?.customers.length ?? 0) +
    (result?.products.length ?? 0) +
    (result?.transactions.length ?? 0);

  function handleClose() {
    setQuery('');
    onClose();
  }

  function navigate(href: string) {
    haptic('tap');
    handleClose();
    router.push(href as never);
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Khojo</Text>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <X color={Colors.ink[700]} size={20} strokeWidth={2.4} />
        </Pressable>
      </View>

      {/* ─── Search input ──────────────────────────── */}
      <View style={styles.searchWrap}>
        <Search color={Colors.saffron[500]} size={20} strokeWidth={2.2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Customer, product, ya transaction..."
          placeholderTextColor={Colors.ink[300]}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
          testID="search-input"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <X color={Colors.ink[400]} size={18} strokeWidth={2.4} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {query.length < 2 ? (
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              2 ya zyada letters likhke khojo
            </Text>
          </View>
        ) : searchQ.isLoading ? (
          <>
            <Skeleton height={56} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={56} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={56} radius={12} style={{ marginBottom: 8 }} />
          </>
        ) : totalResults === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Kuch nahi mila</Text>
            <Text style={styles.emptyBody}>
              "{query}" ke liye koi result nahi · spelling check karein
            </Text>
          </View>
        ) : (
          <>
            {/* ─── Customers ──────────────────────── */}
            {result && result.customers.length > 0 && (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <BookText color={Colors.saffron[500]} size={14} strokeWidth={2.4} />
                  <Text style={styles.groupTitle}>
                    Customers · {result.customers.length}
                  </Text>
                </View>
                {result.customers.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => navigate(`/khata/${c.id}`)}
                    style={({ pressed }) => [
                      styles.resultRow,
                      pressed && styles.resultRowPressed,
                    ]}
                  >
                    <View style={styles.resultLeft}>
                      <Text style={styles.resultLabel}>{c.label}</Text>
                      {c.phone && (
                        <Text style={styles.resultMeta}>+91 {c.phone}</Text>
                      )}
                    </View>
                    {c.outstanding > 0 && (
                      <Text style={styles.resultRight}>
                        {format(c.outstanding)}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* ─── Products ───────────────────────── */}
            {result && result.products.length > 0 && (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <Store color={Colors.saffron[500]} size={14} strokeWidth={2.4} />
                  <Text style={styles.groupTitle}>
                    Products · {result.products.length}
                  </Text>
                </View>
                {result.products.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => navigate('/(tabs)/dukan')}
                    style={({ pressed }) => [
                      styles.resultRow,
                      pressed && styles.resultRowPressed,
                    ]}
                  >
                    <View style={styles.resultLeft}>
                      <Text style={styles.resultLabel}>{p.label}</Text>
                      <Text style={styles.resultMeta}>
                        {p.category ?? 'Uncategorized'} · Stock: {p.stock}
                      </Text>
                    </View>
                    <Text style={styles.resultRight}>{format(p.price)}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* ─── Transactions ───────────────────── */}
            {result && result.transactions.length > 0 && (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <Receipt color={Colors.saffron[500]} size={14} strokeWidth={2.4} />
                  <Text style={styles.groupTitle}>
                    Transactions · {result.transactions.length}
                  </Text>
                </View>
                {result.transactions.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => navigate('/(tabs)/sales' as never)}
                    style={({ pressed }) => [
                      styles.resultRow,
                      pressed && styles.resultRowPressed,
                    ]}
                  >
                    <View style={styles.resultLeft}>
                      <Text style={styles.resultLabel}>{t.label}</Text>
                      <Text style={styles.resultMeta}>{t.type}</Text>
                    </View>
                    <Text
                      style={[
                        styles.resultRight,
                        {
                          color:
                            t.type === 'expense'
                              ? Colors.loss[500]
                              : Colors.profit[500],
                        },
                      ]}
                    >
                      {format(t.amount)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.saffron[50],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.saffron[200],
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    padding: 0,
  },
  list: { maxHeight: 480 },
  hint: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  hintText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[400],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    marginBottom: Spacing.xs,
  },
  emptyBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    textAlign: 'center',
  },
  group: {
    marginBottom: Spacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  groupTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  resultRowPressed: { backgroundColor: Colors.saffron[50] },
  resultLeft: { flex: 1, minWidth: 0 },
  resultLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  resultMeta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 2,
  },
  resultRight: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
});
