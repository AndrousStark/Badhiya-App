/**
 * /team — Team Management dashboard.
 *
 * Wires:
 *   - useTeamMembers()       — active member list
 *   - useTeamStats()         — KPIs (member count, monthly payroll)
 *   - useTodayAttendance()   — today's attendance summary
 *
 * Layout:
 *   1. Stats KPI row: total, present, absent, payroll
 *   2. Today's attendance mini-card
 *   3. Quick links: Attendance, Payroll, Shifts, Compliance
 *   4. Member list with role badges + salary info
 *   5. + FAB to add member
 */

import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Users,
  Calendar,
  Wallet,
  Clock,
  Shield,
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
  TouchTarget,
} from '@/theme';
import { haptic } from '@/lib/haptics';
import { FadeInUp } from '@/components/animations';
import { Skeleton, SectionLabel, Badge } from '@/components/ui';
import { KpiTile } from '@/components/dashboard';
import { useCurrency } from '@/hooks/useCurrency';
import {
  useTeamMembers,
  useTeamStats,
  useTodayAttendance,
} from '@/features/team/hooks';
import { ROLE_META, type TeamMember } from '@/features/team/schemas';
import { useSheets } from '@/components/sheets';

export default function TeamDashboardScreen() {
  const { format } = useCurrency();
  const membersQ = useTeamMembers();
  const statsQ = useTeamStats();
  const todayQ = useTodayAttendance();
  const sheets = useSheets();

  const members = membersQ.data ?? [];
  const stats = statsQ.data;
  const today = todayQ.data;

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([
      membersQ.refetch(),
      statsQ.refetch(),
      todayQ.refetch(),
    ]);
  }

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
          <Text style={styles.title}>Meri Team</Text>
          <Text style={styles.subtitle}>
            {members.length} log · {today?.summary.present ?? 0} hazir aaj
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={membersQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── KPI row ───────────────────────────────── */}
        <FadeInUp delay={0}>
          <View style={styles.bentoRow}>
            <KpiTile
              label="Total team"
              value={stats?.totalMembers ?? members.length}
              tone="saffron"
            />
            <KpiTile
              label="Monthly payroll"
              value={stats?.monthlyPayroll ?? 0}
              prefix="₹"
              tone="trust"
            />
          </View>
        </FadeInUp>

        {/* ─── Today's attendance summary ──────────── */}
        {today && (
          <FadeInUp delay={40}>
            <Pressable
              onPress={() => {
                haptic('tap');
                router.push('/team/attendance');
              }}
              style={({ pressed }) => [
                styles.attendanceCard,
                pressed && { opacity: 0.92 },
              ]}
            >
              <View style={styles.attendanceHeader}>
                <Calendar color={Colors.saffron[500]} size={20} strokeWidth={2.4} />
                <Text style={styles.attendanceTitle}>Aaj ki hajri</Text>
                <ChevronRight color={Colors.ink[400]} size={18} strokeWidth={2.2} />
              </View>
              <View style={styles.attendanceStatsRow}>
                <AttendanceStat
                  label="Hazir"
                  value={today.summary.present}
                  color={Colors.profit[500]}
                />
                <AttendanceStat
                  label="Gairhazir"
                  value={today.summary.absent}
                  color={Colors.loss[500]}
                />
                <AttendanceStat
                  label="Aadha din"
                  value={today.summary.halfDay}
                  color={Colors.warning[500]}
                />
                <AttendanceStat
                  label="Baki"
                  value={today.summary.notMarked}
                  color={Colors.ink[400]}
                />
              </View>
            </Pressable>
          </FadeInUp>
        )}

        {/* ─── Quick links ───────────────────────────── */}
        <FadeInUp delay={80}>
          <SectionLabel label="Quick Actions" />
          <View style={styles.linkGrid}>
            <QuickLink
              icon={<Calendar color={Colors.saffron[500]} size={20} strokeWidth={2.4} />}
              label="Attendance"
              onPress={() => {
                haptic('tap');
                router.push('/team/attendance');
              }}
            />
            <QuickLink
              icon={<Wallet color={Colors.trust[500]} size={20} strokeWidth={2.4} />}
              label="Payroll"
              onPress={() => {
                haptic('tap');
                router.push('/team/payroll');
              }}
            />
            <QuickLink
              icon={<Clock color={Colors.saffron[600]} size={20} strokeWidth={2.4} />}
              label="Shifts"
              onPress={() => {
                haptic('tap');
                router.push('/team/shifts');
              }}
            />
            <QuickLink
              icon={<Shield color={Colors.profit[500]} size={20} strokeWidth={2.4} />}
              label="Compliance"
              onPress={() => {
                haptic('tap');
                router.push('/team/compliance');
              }}
            />
          </View>
        </FadeInUp>

        {/* ─── Members list ──────────────────────────── */}
        <FadeInUp delay={120}>
          <SectionLabel label={`Team Members · ${members.length}`} />
        </FadeInUp>

        {membersQ.isLoading && members.length === 0 ? (
          <>
            <Skeleton height={72} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={72} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={72} radius={12} />
          </>
        ) : members.length === 0 ? (
          <View style={styles.empty}>
            <Users color={Colors.ink[300]} size={48} strokeWidth={1.6} />
            <Text style={styles.emptyText}>
              Abhi koi member nahi · + tap karke add karo
            </Text>
          </View>
        ) : (
          members.map((m, i) => (
            <FadeInUp key={m.id} delay={140 + i * 25}>
              <MemberRow member={m} />
            </FadeInUp>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── + FAB ───────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => {
          haptic('tap');
          sheets.openAddTeamMember();
        }}
        accessibilityLabel="Add team member"
      >
        <Plus color={Colors.white} size={28} strokeWidth={2.6} />
      </Pressable>
    </SafeAreaView>
  );
}

// ─── Attendance stat pill ────────────────────────────────
function AttendanceStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.attendanceStat}>
      <Text style={[styles.attendanceStatValue, { color }]}>{value}</Text>
      <Text style={styles.attendanceStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Quick link tile ─────────────────────────────────────
function QuickLink({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickLink, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.quickLinkIcon}>{icon}</View>
      <Text style={styles.quickLinkLabel}>{label}</Text>
    </Pressable>
  );
}

// ─── Member row ──────────────────────────────────────────
function MemberRow({ member }: { member: TeamMember }) {
  const { format } = useCurrency();
  const roleMeta = ROLE_META[member.role] ?? ROLE_META.staff;

  return (
    <Pressable
      onPress={() => {
        haptic('tap');
        router.push(`/team/${member.id}`);
      }}
      style={({ pressed }) => [styles.memberRow, pressed && { opacity: 0.92 }]}
    >
      <View style={[styles.memberAvatar, { backgroundColor: roleMeta.color }]}>
        <Text style={styles.memberAvatarText}>{member.initial}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>
          {member.name}
        </Text>
        <Text style={styles.memberMeta}>
          {roleMeta.labelHi} · {format(member.baseSalary)}/mo
        </Text>
      </View>
      <View style={styles.memberRight}>
        <Badge label={roleMeta.label} tone="neutral" />
        {!member.isActive && (
          <Text style={styles.inactive}>Inactive</Text>
        )}
      </View>
    </Pressable>
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

  // KPIs
  bentoRow: { flexDirection: 'row', gap: Spacing.sm },

  // Attendance card
  attendanceCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadow.sm,
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  attendanceTitle: {
    flex: 1,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  attendanceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceStat: { alignItems: 'center' },
  attendanceStatValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.heavy,
  },
  attendanceStatLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[400],
    marginTop: 2,
  },

  // Quick links
  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickLink: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  quickLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.saffron[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },

  // Members
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[400],
    marginTop: Spacing.md,
    textAlign: 'center',
    maxWidth: 240,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  memberMeta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 2,
  },
  memberRight: { alignItems: 'flex-end', gap: 4 },
  inactive: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.loss[500],
  },

  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: 24,
    width: TouchTarget.voiceFAB,
    height: TouchTarget.voiceFAB,
    borderRadius: TouchTarget.voiceFAB / 2,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.saffronGlow,
  },
  fabPressed: { backgroundColor: Colors.saffron[600] },
});
