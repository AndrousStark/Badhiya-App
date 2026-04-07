/**
 * /admin — Admin dashboard with KPIs, quick links, system health.
 *
 * Redirects to /admin/login if not authenticated.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { observer } from '@legendapp/state/react';
import {
  ArrowLeft,
  Users,
  Building2,
  BarChart3,
  Megaphone,
  FileText,
  Activity,
  LogOut,
  ChevronRight,
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
import { KpiTile } from '@/components/dashboard';
import { Skeleton, SectionLabel, Badge } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import { useAdminDashboard, useSystemHealth } from '@/features/admin/hooks';
import { adminAuth$, adminLogout } from '@/features/admin/store';

export default observer(function AdminDashboardScreen() {
  const isAuth = adminAuth$.isAuthenticated.get();
  const adminName = adminAuth$.name.get();

  if (!isAuth) return <Redirect href="/admin/login" />;

  const { format } = useCurrency();
  const dashQ = useAdminDashboard();
  const healthQ = useSystemHealth();

  const dash = dashQ.data;
  const health = healthQ.data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>{adminName ?? 'Super Admin'}</Text>
        </View>
        {health && (
          <Badge
            label={health.status.toUpperCase()}
            tone={health.status === 'healthy' ? 'profit' : 'loss'}
          />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dashQ.isFetching}
            onRefresh={() => {
              dashQ.refetch();
              healthQ.refetch();
            }}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {dashQ.isLoading && !dash ? (
          <>
            <Skeleton height={80} radius={16} style={{ marginBottom: 8 }} />
            <Skeleton height={80} radius={16} style={{ marginBottom: 8 }} />
          </>
        ) : dash ? (
          <>
            {/* ─── KPIs ────────────────────────────────── */}
            <FadeInUp delay={0}>
              <View style={styles.bentoRow}>
                <KpiTile label="Businesses" value={dash.totalBusinesses} tone="saffron" />
                <KpiTile label="Users" value={dash.totalUsers} tone="trust" />
              </View>
              <View style={[styles.bentoRow, { marginTop: Spacing.sm }]}>
                <KpiTile label="DAU" value={dash.dau} tone="profit" />
                <KpiTile label="MAU" value={dash.mau} tone="profit" />
              </View>
              <View style={[styles.bentoRow, { marginTop: Spacing.sm }]}>
                <KpiTile label="Revenue (month)" value={dash.revenueThisMonth} prefix="₹" tone="profit" />
                <KpiTile label="Avg Health" value={dash.avgHealthScore} tone="warning" />
              </View>
            </FadeInUp>

            {/* ─── Signups ─────────────────────────────── */}
            <FadeInUp delay={40}>
              <View style={styles.signupCard}>
                <Text style={styles.signupTitle}>Signups</Text>
                <View style={styles.signupRow}>
                  <View style={styles.signupStat}>
                    <Text style={styles.signupValue}>{dash.signups.today}</Text>
                    <Text style={styles.signupLabel}>Today</Text>
                  </View>
                  <View style={styles.signupStat}>
                    <Text style={styles.signupValue}>{dash.signups.thisWeek}</Text>
                    <Text style={styles.signupLabel}>Week</Text>
                  </View>
                  <View style={styles.signupStat}>
                    <Text style={styles.signupValue}>{dash.signups.thisMonth}</Text>
                    <Text style={styles.signupLabel}>Month</Text>
                  </View>
                </View>
              </View>
            </FadeInUp>

            {/* ─── System health ────────────────────────── */}
            {health && (
              <FadeInUp delay={60}>
                <View style={styles.healthCard}>
                  <Activity
                    color={health.status === 'healthy' ? Colors.profit[500] : Colors.loss[500]}
                    size={20}
                    strokeWidth={2.4}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.healthTitle}>System Health</Text>
                    <Text style={styles.healthMeta}>
                      DB: {health.database.latencyMs}ms · Redis: {health.redis.latencyMs}ms
                      {health.redis.usedMemory ? ` · ${health.redis.usedMemory}` : ''}
                    </Text>
                  </View>
                </View>
              </FadeInUp>
            )}
          </>
        ) : null}

        {/* ─── Quick links ───────────────────────────── */}
        <FadeInUp delay={80}>
          <SectionLabel label="Manage" />
          <NavRow icon={<Building2 color={Colors.saffron[500]} size={20} strokeWidth={2.4} />} label="Businesses" onPress={() => router.push('/admin/businesses')} />
          <NavRow icon={<Users color={Colors.trust[500]} size={20} strokeWidth={2.4} />} label="Users" onPress={() => router.push('/admin/users')} />
          <NavRow icon={<Megaphone color={Colors.saffron[600]} size={20} strokeWidth={2.4} />} label="Content (Banners & Schemes)" onPress={() => router.push('/admin/content')} />
          <NavRow icon={<FileText color={Colors.ink[500]} size={20} strokeWidth={2.4} />} label="Audit Logs" onPress={() => router.push('/admin/audit')} />
        </FadeInUp>

        {/* ─── Logout ──────────────────────────────── */}
        <FadeInUp delay={120}>
          <Pressable
            onPress={() => {
              haptic('error');
              adminLogout();
              router.replace('/admin/login');
            }}
            style={styles.logoutBtn}
          >
            <LogOut color={Colors.loss[500]} size={18} strokeWidth={2.4} />
            <Text style={styles.logoutText}>Admin Logout</Text>
          </Pressable>
        </FadeInUp>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
});

function NavRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => { haptic('tap'); onPress(); }} style={({ pressed }) => [styles.navRow, pressed && { opacity: 0.92 }]}>
      <View style={styles.navIcon}>{icon}</View>
      <Text style={styles.navLabel}>{label}</Text>
      <ChevronRight color={Colors.ink[400]} size={18} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: { fontFamily: FontFamily.heading, fontSize: FontSize.h2, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  subtitle: { fontFamily: FontFamily.body, fontSize: FontSize.micro, color: Colors.ink[400], marginTop: 2 },
  scroll: { padding: Spacing.xl },
  bentoRow: { flexDirection: 'row', gap: Spacing.sm },
  signupCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.lg, marginTop: Spacing.lg, ...Shadow.sm },
  signupTitle: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.micro, fontWeight: FontWeight.bold, color: Colors.ink[400], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md },
  signupRow: { flexDirection: 'row', justifyContent: 'space-around' },
  signupStat: { alignItems: 'center' },
  signupValue: { fontFamily: FontFamily.monoBold, fontSize: FontSize.h2, fontWeight: FontWeight.heavy, color: Colors.ink[900] },
  signupLabel: { fontFamily: FontFamily.body, fontSize: 10, color: Colors.ink[400], marginTop: 2 },
  healthCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.lg, ...Shadow.sm },
  healthTitle: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  healthMeta: { fontFamily: FontFamily.mono, fontSize: 11, color: Colors.ink[400], marginTop: 2 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  navIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.saffron[50], alignItems: 'center', justifyContent: 'center' },
  navLabel: { flex: 1, fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl, marginTop: Spacing.lg },
  logoutText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.loss[500] },
});
