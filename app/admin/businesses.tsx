/**
 * /admin/businesses — Business search + list + actions.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Search, Building2, Ban, CheckCircle2 } from 'lucide-react-native';

import { Colors, FontFamily, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/theme';
import { haptic } from '@/lib/haptics';
import { FadeInUp } from '@/components/animations';
import { Skeleton, Badge } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import { useAdminBusinesses, useSuspendBusiness, useReactivateBusiness } from '@/features/admin/hooks';
import type { AdminBusinessRow } from '@/features/admin/schemas';

export default function AdminBusinessesScreen() {
  const { format } = useCurrency();
  const [query, setQuery] = useState('');
  const businessesQ = useAdminBusinesses(query || undefined);
  const suspendMut = useSuspendBusiness();
  const reactivateMut = useReactivateBusiness();

  const businesses = businessesQ.data?.data ?? [];

  function handleSuspend(b: AdminBusinessRow) {
    Alert.prompt?.('Suspend reason', `Why suspend "${b.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: (reason) => {
        suspendMut.mutate({ id: b.id, reason: reason || 'Admin action' });
      }},
    ]) ?? Alert.alert('Suspend', `Suspend "${b.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: () => suspendMut.mutate({ id: b.id, reason: 'Admin action' }) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Businesses</Text>
      </View>

      <View style={styles.searchBar}>
        <Search color={Colors.ink[400]} size={16} strokeWidth={2.2} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search businesses…" placeholderTextColor={Colors.ink[300]} style={styles.searchInput} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={businessesQ.isFetching} onRefresh={() => businessesQ.refetch()} tintColor={Colors.saffron[500]} />}>

        {businessesQ.isLoading && businesses.length === 0 ? (
          <><Skeleton height={80} radius={12} style={{ marginBottom: 8 }} /><Skeleton height={80} radius={12} /></>
        ) : businesses.length === 0 ? (
          <Text style={styles.emptyText}>Koi business nahi mila</Text>
        ) : (
          businesses.map((b, i) => (
            <FadeInUp key={b.id} delay={i * 20}>
              <Pressable onPress={() => { haptic('tap'); router.push(`/admin/business/${b.id}`); }}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}>
                <View style={styles.rowIcon}>
                  <Building2 color={b.isActive ? Colors.saffron[500] : Colors.ink[400]} size={18} strokeWidth={2.4} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>{b.name}</Text>
                  <Text style={styles.rowMeta}>{b.city ?? '—'} · {b.type ?? '—'} · {b.totalTransactions} txns</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowRevenue}>{format(b.totalRevenue)}</Text>
                  <Badge label={b.isActive ? 'ACTIVE' : 'SUSPENDED'} tone={b.isActive ? 'profit' : 'loss'} />
                </View>
              </Pressable>
            </FadeInUp>
          ))
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: { fontFamily: FontFamily.heading, fontSize: FontSize.h2, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[900], paddingVertical: Spacing.sm },
  scroll: { padding: Spacing.xl },
  emptyText: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[400], textAlign: 'center', paddingVertical: Spacing['3xl'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  rowIcon: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.saffron[50], alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  rowMeta: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400], marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowRevenue: { fontFamily: FontFamily.monoBold, fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.ink[900] },
});
