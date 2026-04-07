/**
 * /admin/audit — Audit logs + system health.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Search, Activity, Database, Server } from 'lucide-react-native';

import { Colors, FontFamily, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/theme';
import { haptic } from '@/lib/haptics';
import { FadeInUp } from '@/components/animations';
import { Skeleton, SectionLabel, Badge } from '@/components/ui';
import { useAuditLogs, useSystemHealth } from '@/features/admin/hooks';

export default function AdminAuditScreen() {
  const [actionFilter, setActionFilter] = useState('');
  const logsQ = useAuditLogs({ action: actionFilter || undefined });
  const healthQ = useSystemHealth();

  const logs = logsQ.data?.data ?? [];
  const health = healthQ.data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Audit & System</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={logsQ.isFetching} onRefresh={() => { logsQ.refetch(); healthQ.refetch(); }} tintColor={Colors.saffron[500]} />}>

        {/* System health */}
        {health && (
          <FadeInUp delay={0}>
            <SectionLabel label="System Health" />
            <View style={styles.healthGrid}>
              <View style={[styles.healthCard, health.database.connected ? styles.healthOk : styles.healthBad]}>
                <Database color={health.database.connected ? Colors.profit[500] : Colors.loss[500]} size={20} strokeWidth={2.2} />
                <Text style={styles.healthLabel}>Database</Text>
                <Text style={styles.healthValue}>{health.database.latencyMs}ms</Text>
                <Badge label={health.database.connected ? 'OK' : 'DOWN'} tone={health.database.connected ? 'profit' : 'loss'} />
              </View>
              <View style={[styles.healthCard, health.redis.connected ? styles.healthOk : styles.healthBad]}>
                <Server color={health.redis.connected ? Colors.profit[500] : Colors.loss[500]} size={20} strokeWidth={2.2} />
                <Text style={styles.healthLabel}>Redis</Text>
                <Text style={styles.healthValue}>{health.redis.latencyMs}ms</Text>
                {health.redis.usedMemory && <Text style={styles.healthMem}>{health.redis.usedMemory}</Text>}
                <Badge label={health.redis.connected ? 'OK' : 'DOWN'} tone={health.redis.connected ? 'profit' : 'loss'} />
              </View>
            </View>
          </FadeInUp>
        )}

        {/* Audit logs */}
        <FadeInUp delay={40}>
          <SectionLabel label={`Audit Logs · ${logsQ.data?.meta.total ?? 0}`} />
          <View style={styles.searchBar}>
            <Search color={Colors.ink[400]} size={14} strokeWidth={2.2} />
            <TextInput value={actionFilter} onChangeText={setActionFilter} placeholder="Filter by action…" placeholderTextColor={Colors.ink[300]} style={styles.searchInput} />
          </View>
        </FadeInUp>

        {logsQ.isLoading && logs.length === 0 ? (
          <><Skeleton height={60} radius={12} style={{ marginBottom: 8 }} /><Skeleton height={60} radius={12} /></>
        ) : logs.length === 0 ? (
          <Text style={styles.emptyText}>Koi log nahi mila</Text>
        ) : (
          logs.map((log, i) => (
            <FadeInUp key={log.id} delay={60 + i * 15}>
              <View style={styles.logRow}>
                <Activity color={Colors.ink[400]} size={14} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.logAction}>{log.action}</Text>
                  <Text style={styles.logMeta}>
                    {log.adminName ?? 'System'} · {log.resourceType ?? ''}
                    {log.resourceId ? ` #${log.resourceId.slice(0, 8)}` : ''}
                  </Text>
                </View>
                <Text style={styles.logTime}>{log.createdAt.slice(0, 10)}</Text>
              </View>
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
  scroll: { padding: Spacing.xl },

  healthGrid: { flexDirection: 'row', gap: Spacing.sm },
  healthCard: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: Colors.surface, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  healthOk: { borderColor: Colors.profit[500] },
  healthBad: { borderColor: Colors.loss[500] },
  healthLabel: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  healthValue: { fontFamily: FontFamily.monoBold, fontSize: FontSize.h3, fontWeight: FontWeight.heavy, color: Colors.ink[900] },
  healthMem: { fontFamily: FontFamily.mono, fontSize: 11, color: Colors.ink[400] },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  searchInput: { flex: 1, fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[900], paddingVertical: Spacing.sm },
  emptyText: { fontFamily: FontFamily.body, fontSize: FontSize.caption, color: Colors.ink[400], textAlign: 'center', paddingVertical: Spacing['3xl'] },

  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logAction: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  logMeta: { fontFamily: FontFamily.body, fontSize: 10, color: Colors.ink[400], marginTop: 2 },
  logTime: { fontFamily: FontFamily.mono, fontSize: 10, color: Colors.ink[400] },
});
