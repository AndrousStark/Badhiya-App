/**
 * /team/attendance — Daily attendance marking.
 *
 * Wires:
 *   - useTodayAttendance() — today's status for all members
 *   - useTeamMembers() — member list for marking
 *   - useMarkAttendance() — bulk save
 *
 * Layout:
 *   - Summary card (present/absent/halfDay/notMarked)
 *   - Member list with status picker per member
 *   - Sticky "Save attendance" CTA
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';

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
import { Button, Skeleton, Chip, Badge } from '@/components/ui';
import {
  useTeamMembers,
  useTodayAttendance,
  useMarkAttendance,
} from '@/features/team/hooks';
import {
  ATTENDANCE_META,
  ROLE_META,
  type AttendanceStatus,
  type TeamMember,
  type MarkAttendanceEntry,
} from '@/features/team/schemas';

const STATUS_OPTIONS: AttendanceStatus[] = [
  'present',
  'absent',
  'half_day',
  'late',
  'overtime',
  'paid_holiday',
];

export default function AttendanceScreen() {
  const membersQ = useTeamMembers();
  const todayQ = useTodayAttendance();
  const markMut = useMarkAttendance();

  const members = membersQ.data?.filter((m) => m.isActive) ?? [];
  const today = todayQ.data;

  // Per-member status state
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  // Track changes
  const changedCount = Object.keys(statuses).length;

  function setStatus(memberId: string, status: AttendanceStatus) {
    haptic('tap');
    setStatuses((prev) => ({
      ...prev,
      [memberId]: prev[memberId] === status ? undefined! as never : status,
    }));
    // If clearing, remove key
    setStatuses((prev) => {
      const next = { ...prev };
      if (next[memberId] === undefined) delete next[memberId];
      return next;
    });
  }

  async function handleSave() {
    if (changedCount === 0) return;

    const entries: MarkAttendanceEntry[] = Object.entries(statuses).map(
      ([memberId, status]) => ({ memberId, status }),
    );

    const todayStr = new Date().toISOString().split('T')[0];

    Alert.alert(
      `${entries.length} members ki attendance save karein?`,
      `Date: ${todayStr}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            try {
              const result = await markMut.mutateAsync({
                date: todayStr,
                entries,
              });
              setStatuses({});
              Alert.alert(
                'Saved',
                `${result.marked} marked, ${result.failed} failed`,
              );
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
    await Promise.all([membersQ.refetch(), todayQ.refetch()]);
  }

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
          <Text style={styles.title}>Aaj ki Hajri</Text>
          <Text style={styles.subtitle}>
            {today?.date ?? new Date().toISOString().split('T')[0]}
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
        {/* ─── Summary ───────────────────────────────── */}
        {today && (
          <FadeInUp delay={0}>
            <View style={styles.summaryCard}>
              <SummStat label="Hazir" value={today.summary.present} color={Colors.profit[500]} />
              <SummStat label="Gairhazir" value={today.summary.absent} color={Colors.loss[500]} />
              <SummStat label="Aadha" value={today.summary.halfDay} color={Colors.warning[500]} />
              <SummStat label="Baki" value={today.summary.notMarked} color={Colors.ink[400]} />
            </View>
          </FadeInUp>
        )}

        {/* ─── Member attendance rows ─────────────────── */}
        {membersQ.isLoading && members.length === 0 ? (
          <>
            <Skeleton height={100} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={100} radius={12} style={{ marginBottom: 8 }} />
          </>
        ) : members.length === 0 ? (
          <Text style={styles.emptyText}>Koi active member nahi</Text>
        ) : (
          members.map((m, i) => (
            <FadeInUp key={m.id} delay={40 + i * 20}>
              <MemberAttendanceRow
                member={m}
                status={statuses[m.id]}
                onSetStatus={(s) => setStatus(m.id, s)}
              />
            </FadeInUp>
          ))
        )}

        <View style={{ height: changedCount > 0 ? 120 : 60 }} />
      </ScrollView>

      {/* ─── Sticky save bar ─────────────────────────── */}
      {changedCount > 0 && (
        <View style={styles.stickyBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.stickyCount}>{changedCount} marked</Text>
            <Text style={styles.stickyHint}>Tap Save to record</Text>
          </View>
          <Button
            label="Save"
            onPress={handleSave}
            loading={markMut.isPending}
            size="lg"
            leftIcon={<Save color={Colors.white} size={18} strokeWidth={2.4} />}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function SummStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.summStat}>
      <Text style={[styles.summValue, { color }]}>{value}</Text>
      <Text style={styles.summLabel}>{label}</Text>
    </View>
  );
}

function MemberAttendanceRow({
  member,
  status,
  onSetStatus,
}: {
  member: TeamMember;
  status: AttendanceStatus | undefined;
  onSetStatus: (s: AttendanceStatus) => void;
}) {
  const roleMeta = ROLE_META[member.role] ?? ROLE_META.staff;
  return (
    <View style={[styles.memberCard, status && styles.memberCardMarked]}>
      <View style={styles.memberTop}>
        <View style={[styles.memberAvatar, { backgroundColor: roleMeta.color }]}>
          <Text style={styles.memberAvatarText}>{member.initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
          <Text style={styles.memberRole}>{roleMeta.labelHi}</Text>
        </View>
        {status && (
          <Badge
            label={ATTENDANCE_META[status]?.label ?? status}
            tone={status === 'present' ? 'profit' : status === 'absent' ? 'loss' : 'warning'}
          />
        )}
      </View>
      <View style={styles.statusChips}>
        {STATUS_OPTIONS.map((s) => {
          const meta = ATTENDANCE_META[s];
          return (
            <Pressable
              key={s}
              onPress={() => onSetStatus(s)}
              style={[
                styles.statusChip,
                status === s && { backgroundColor: meta.color + '20', borderColor: meta.color },
              ]}
            >
              <Text style={styles.statusEmoji}>{meta.emoji}</Text>
              <Text
                style={[
                  styles.statusLabel,
                  status === s && { color: meta.color, fontWeight: FontWeight.bold },
                ]}
              >
                {meta.labelHi}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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

  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  summStat: { alignItems: 'center' },
  summValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.heavy,
  },
  summLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[400],
    marginTop: 2,
  },

  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[400],
    textAlign: 'center',
    paddingVertical: Spacing['3xl'],
  },

  memberCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  memberCardMarked: {
    borderColor: Colors.saffron[500],
  },
  memberTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  memberAvatar: {
    width: 40,
    height: 40,
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
  memberName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  memberRole: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  statusEmoji: { fontSize: 12 },
  statusLabel: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
  },

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
