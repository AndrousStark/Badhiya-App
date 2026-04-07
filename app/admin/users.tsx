/**
 * /admin/users — User search + quick stats.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Search, User } from 'lucide-react-native';

import { Colors, FontFamily, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/theme';
import { haptic } from '@/lib/haptics';
import { FadeInUp } from '@/components/animations';
import { KpiTile } from '@/components/dashboard';
import { Skeleton, Badge } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import { useAdminUsers, useAdminUserStats } from '@/features/admin/hooks';

export default function AdminUsersScreen() {
  const { format } = useCurrency();
  const [query, setQuery] = useState('');
  const usersQ = useAdminUsers(query || undefined);
  const statsQ = useAdminUserStats();

  const users = usersQ.data?.users ?? [];
  const stats = statsQ.data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Users</Text>
      </View>

      <View style={styles.searchBar}>
        <Search color={Colors.ink[400]} size={16} strokeWidth={2.2} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search by name, phone…" placeholderTextColor={Colors.ink[300]} style={styles.searchInput} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={usersQ.isFetching} onRefresh={() => { usersQ.refetch(); statsQ.refetch(); }} tintColor={Colors.saffron[500]} />}>

        {stats && (
          <FadeInUp delay={0}>
            <View style={styles.bentoRow}>
              <KpiTile label="Total" value={stats.total} tone="saffron" />
              <KpiTile label="Active 7d" value={stats.active7d} tone="profit" />
            </View>
            <View style={[styles.bentoRow, { marginTop: Spacing.sm, marginBottom: Spacing.lg }]}>
              <KpiTile label="New 7d" value={stats.new7d} tone="trust" />
              <KpiTile label="Churned" value={stats.churned} tone="loss" />
            </View>
          </FadeInUp>
        )}

        {usersQ.isLoading && users.length === 0 ? (
          <><Skeleton height={72} radius={12} style={{ marginBottom: 8 }} /><Skeleton height={72} radius={12} /></>
        ) : users.length === 0 ? (
          <Text style={styles.emptyText}>Koi user nahi mila</Text>
        ) : (
          users.map((u, i) => (
            <FadeInUp key={u.id} delay={40 + i * 20}>
              <Pressable onPress={() => { haptic('tap'); router.push(`/admin/user/${u.id}`); }}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}>
                <View style={styles.rowAvatar}>
                  <Text style={styles.rowAvatarText}>{(u.name ?? '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>{u.name ?? 'Unknown'}</Text>
                  <Text style={styles.rowMeta}>{u.phone ?? '—'} · {u.city ?? '—'}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowRevenue}>{format(u.totalRevenue ?? 0)}</Text>
                  <Badge label={u.isActive ? 'ACTIVE' : 'INACTIVE'} tone={u.isActive ? 'profit' : 'warning'} />
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
  bentoRow: { flexDirection: 'row', gap: Spacing.sm },
  emptyText: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[400], textAlign: 'center', paddingVertical: Spacing['3xl'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.trust[500], alignItems: 'center', justifyContent: 'center' },
  rowAvatarText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.white },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  rowMeta: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400], marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowRevenue: { fontFamily: FontFamily.monoBold, fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.ink[900] },
});
