/**
 * /team/[memberId] — Team member detail screen.
 *
 * Wires:
 *   - useMemberDetail(memberId) — member profile
 *   - useMemberAttendance(memberId) — monthly attendance calendar
 *   - useAdvances(memberId) — salary advance list
 *   - useMemberActivity(memberId) — activity log
 *   - useRemoveMember() — soft-delete with confirmation
 *   - useGiveAdvance(memberId) — give advance
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Phone,
  Trash2,
  Banknote,
  Calendar,
  Activity,
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
import { Badge, Skeleton, SectionLabel, Button } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import {
  useMemberDetail,
  useMemberAttendance,
  useAdvances,
  useMemberActivity,
  useRemoveMember,
  useGiveAdvance,
} from '@/features/team/hooks';
import {
  ROLE_META,
  getRoleMeta,
  ATTENDANCE_META,
  type ActivityLog,
} from '@/features/team/schemas';

export default function MemberDetailScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { format } = useCurrency();

  const memberQ = useMemberDetail(memberId);
  const attendanceQ = useMemberAttendance(memberId);
  const advancesQ = useAdvances(memberId);
  const activityQ = useMemberActivity(memberId);
  const removeMut = useRemoveMember();
  const advanceMut = useGiveAdvance(memberId ?? '');

  const member = memberQ.data;
  const attendance = attendanceQ.data;
  const advances = advancesQ.data;
  const activities = activityQ.data ?? [];

  const [advanceAmt, setAdvanceAmt] = useState('');

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([
      memberQ.refetch(),
      attendanceQ.refetch(),
      advancesQ.refetch(),
      activityQ.refetch(),
    ]);
  }

  function handleRemove() {
    if (!member) return;
    Alert.alert(
      `${member.name} ko hatayein?`,
      'Yeh member deactivate ho jayega. Attendance aur payment records safe rahenge.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hata do',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMut.mutateAsync(member.id);
              router.back();
            } catch (err) {
              Alert.alert('Error', (err as Error).message);
            }
          },
        },
      ],
    );
  }

  async function handleGiveAdvance() {
    const amt = parseFloat(advanceAmt);
    if (!amt || amt <= 0) {
      Alert.alert('Amount daalo', 'Advance amount 0 se zyada hona chahiye');
      return;
    }
    haptic('tap');
    try {
      await advanceMut.mutateAsync({ amount: amt });
      setAdvanceAmt('');
      Alert.alert('Advance diya', `₹${amt} advance record ho gaya`);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  if (memberQ.isLoading && !member) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <Skeleton height={160} radius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Member nahi mila</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleMeta = getRoleMeta(member.role);

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
          <Text style={styles.headerName} numberOfLines={1}>
            {member.name}
          </Text>
          <Text style={styles.headerRole}>{roleMeta.labelHi}</Text>
        </View>
        {member.phone && (
          <Pressable
            onPress={() => Linking.openURL(`tel:${member.phone}`)}
            style={({ pressed }) => [styles.phoneBtn, pressed && { opacity: 0.7 }]}
          >
            <Phone color={Colors.profit[500]} size={18} strokeWidth={2.4} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={memberQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Profile hero ──────────────────────────── */}
        <FadeInUp delay={0}>
          <View style={styles.hero}>
            <View style={[styles.heroAvatar, { backgroundColor: roleMeta.color }]}>
              <Text style={styles.heroAvatarText}>{member.initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{member.name}</Text>
              <View style={styles.heroMetaRow}>
                <Badge label={roleMeta.label} tone="neutral" />
                <Text style={styles.heroSalary}>
                  {format(member.baseSalary)} / {member.salaryType}
                </Text>
              </View>
              {member.phone && (
                <Text style={styles.heroPhone}>+91 {member.phone}</Text>
              )}
            </View>
          </View>
        </FadeInUp>

        {/* ─── Attendance summary ────────────────────── */}
        {attendance && (
          <FadeInUp delay={40}>
            <SectionLabel label="Is mahine ki hajri" />
            <View style={styles.attendanceSummary}>
              <AttStat
                label="Present"
                value={attendance.summary.daysPresent}
                color={Colors.profit[500]}
              />
              <AttStat
                label="Absent"
                value={attendance.summary.daysAbsent}
                color={Colors.loss[500]}
              />
              <AttStat
                label="Half"
                value={attendance.summary.halfDays}
                color={Colors.warning[500]}
              />
              <AttStat
                label="OT hrs"
                value={attendance.summary.overtimeHours}
                color={Colors.trust[500]}
              />
              <AttStat
                label="Late"
                value={attendance.summary.lateCount}
                color={Colors.saffron[500]}
              />
            </View>
            <View style={styles.attendanceRateRow}>
              <View style={styles.rateTrack}>
                <View
                  style={[
                    styles.rateFill,
                    { width: `${Math.min(100, attendance.summary.attendanceRate)}%` },
                  ]}
                />
              </View>
              <Text style={styles.rateText}>
                {Math.round(attendance.summary.attendanceRate)}% rate
              </Text>
            </View>
          </FadeInUp>
        )}

        {/* ─── Advance section ───────────────────────── */}
        <FadeInUp delay={80}>
          <SectionLabel
            label={`Advances · ${advances?.activeCount ?? 0} active`}
          />
          <View style={styles.advanceCard}>
            <View style={styles.advanceInputRow}>
              <Banknote color={Colors.saffron[500]} size={20} strokeWidth={2.4} />
              <TextInput
                value={advanceAmt}
                onChangeText={setAdvanceAmt}
                placeholder="₹ Amount"
                placeholderTextColor={Colors.ink[300]}
                style={styles.advanceInput}
                keyboardType="numeric"
              />
              <Button
                label="Give"
                onPress={handleGiveAdvance}
                size="sm"
                loading={advanceMut.isPending}
              />
            </View>
            {(advances?.totalActive ?? 0) > 0 && (
              <Text style={styles.advanceTotal}>
                Active: {format(advances!.totalActive)}
              </Text>
            )}
          </View>
        </FadeInUp>

        {/* ─── Activity log ──────────────────────────── */}
        <FadeInUp delay={120}>
          <SectionLabel label={`Recent Activity · ${activities.length}`} />
          {activities.length === 0 ? (
            <Text style={styles.emptyText}>Koi activity nahi</Text>
          ) : (
            activities.slice(0, 10).map((a) => (
              <ActivityRow key={a.id} activity={a} />
            ))
          )}
        </FadeInUp>

        {/* ─── Danger zone ───────────────────────────── */}
        <FadeInUp delay={160}>
          <View style={styles.dangerSection}>
            <Pressable
              onPress={handleRemove}
              style={({ pressed }) => [
                styles.removeBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Trash2 color={Colors.loss[500]} size={18} strokeWidth={2.4} />
              <Text style={styles.removeBtnText}>Remove member</Text>
            </Pressable>
          </View>
        </FadeInUp>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AttStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.attStat}>
      <Text style={[styles.attStatValue, { color }]}>{value}</Text>
      <Text style={styles.attStatLabel}>{label}</Text>
    </View>
  );
}

function ActivityRow({ activity }: { activity: ActivityLog }) {
  return (
    <View style={styles.actRow}>
      <Activity color={Colors.ink[400]} size={14} strokeWidth={2.2} />
      <Text style={styles.actText} numberOfLines={2}>
        {activity.action}
      </Text>
      <Text style={styles.actTime}>
        {formatTime(activity.createdAt)}
      </Text>
    </View>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, padding: Spacing['3xl'] },
  loadingText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[500],
    textAlign: 'center',
  },
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
  headerName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  headerRole: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 1,
  },
  phoneBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.profit[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: Spacing.xl },

  // Hero
  hero: {
    flexDirection: 'row',
    gap: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  heroAvatar: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.heavy,
    color: Colors.white,
  },
  heroName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  heroSalary: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
  },
  heroPhone: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: Spacing.xs,
  },

  // Attendance
  attendanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  attStat: { alignItems: 'center' },
  attStatValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.heavy,
  },
  attStatLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[400],
    marginTop: 2,
  },
  attendanceRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  rateTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  rateFill: {
    height: '100%',
    backgroundColor: Colors.profit[500],
    borderRadius: 3,
  },
  rateText: {
    fontFamily: FontFamily.monoBold,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
    minWidth: 60,
    textAlign: 'right',
  },

  // Advance
  advanceCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  advanceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  advanceInput: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  advanceTotal: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.warning[500],
    marginTop: Spacing.sm,
  },

  // Activity
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    paddingVertical: Spacing.lg,
  },
  actRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    lineHeight: 18,
  },
  actTime: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.ink[400],
    minWidth: 50,
    textAlign: 'right',
  },

  // Danger
  dangerSection: {
    marginTop: Spacing['2xl'],
    alignItems: 'center',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  removeBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.loss[500],
  },
});
