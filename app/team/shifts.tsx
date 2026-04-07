/**
 * /team/shifts — Weekly shift schedule + management.
 *
 * Wires:
 *   - useWeekSchedule(weekStart?) — Mon-Sun grid with member assignments
 *   - useShifts() — shift definitions
 *   - useCreateShift() — add new shift
 *   - useSeedDefaultShifts() — seed Morning/Evening/Night
 *
 * Layout:
 *   - Week picker (prev/next arrows)
 *   - Shift legend (color boxes)
 *   - Schedule grid: member rows × day columns
 *   - "Add Shift" and "Seed Defaults" CTAs
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  X,
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
import { Button, Skeleton, EmptyState } from '@/components/ui';
import {
  useWeekSchedule,
  useShifts,
  useCreateShift,
  useSeedDefaultShifts,
} from '@/features/team/hooks';
import { DAY_NAMES, type Shift } from '@/features/team/schemas';

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day === 0 ? 7 : day) - 1));
  return d.toISOString().split('T')[0];
}

export default function ShiftsScreen() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [showCreate, setShowCreate] = useState(false);

  const scheduleQ = useWeekSchedule(weekStart);
  const shiftsQ = useShifts();
  const seedMut = useSeedDefaultShifts();

  const schedule = scheduleQ.data;
  const shifts = shiftsQ.data ?? [];

  function prevWeek() {
    haptic('tap');
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  }

  function nextWeek() {
    haptic('tap');
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  }

  async function handleSeedDefaults() {
    haptic('tap');
    Alert.alert(
      'Default shifts banayein?',
      'Morning (09:00-17:00), Evening (14:00-22:00), Night (22:00-06:00) create honge.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              await seedMut.mutateAsync();
              shiftsQ.refetch();
            } catch (err) {
              Alert.alert('Error', (err as Error).message);
            }
          },
        },
      ],
    );
  }

  const endDate = schedule?.weekEnd
    ? schedule.weekEnd
    : (() => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 6);
        return d.toISOString().split('T')[0];
      })();

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
          <Text style={styles.title}>Shifts</Text>
          <Text style={styles.subtitle}>Weekly schedule</Text>
        </View>
        <Pressable
          onPress={() => setShowCreate(true)}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
        >
          <Plus color={Colors.saffron[500]} size={20} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={scheduleQ.isFetching}
            onRefresh={() => {
              scheduleQ.refetch();
              shiftsQ.refetch();
            }}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Week picker ───────────────────────────── */}
        <FadeInUp delay={0}>
          <View style={styles.weekPicker}>
            <Pressable onPress={prevWeek} hitSlop={8}>
              <ChevronLeft color={Colors.ink[700]} size={22} strokeWidth={2.4} />
            </Pressable>
            <View style={styles.weekDates}>
              <Text style={styles.weekText}>
                {formatShort(weekStart)} — {formatShort(endDate)}
              </Text>
            </View>
            <Pressable onPress={nextWeek} hitSlop={8}>
              <ChevronRight color={Colors.ink[700]} size={22} strokeWidth={2.4} />
            </Pressable>
          </View>
        </FadeInUp>

        {/* ─── Shift legend ──────────────────────────── */}
        {shifts.length > 0 && (
          <FadeInUp delay={40}>
            <View style={styles.legendRow}>
              {shifts.map((s) => (
                <View key={s.id} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: s.color }]}
                  />
                  <Text style={styles.legendText}>
                    {s.nameHindi ?? s.name} · {s.startTime}-{s.endTime}
                  </Text>
                </View>
              ))}
            </View>
          </FadeInUp>
        )}

        {/* ─── Schedule grid or empty ────────────────── */}
        {scheduleQ.isLoading ? (
          <Skeleton height={200} radius={16} />
        ) : shifts.length === 0 ? (
          <FadeInUp delay={80}>
            <EmptyState
              icon={<Sparkles color={Colors.ink[300]} size={40} strokeWidth={1.6} />}
              title="Koi shift nahi"
              body="Default shifts create karke shuru karo"
              actionLabel="Seed Default Shifts"
              onAction={handleSeedDefaults}
            />
          </FadeInUp>
        ) : (
          <FadeInUp delay={80}>
            <View style={styles.grid}>
              {/* Day headers */}
              <View style={styles.gridHeaderRow}>
                <View style={styles.gridNameCol}>
                  <Text style={styles.gridHeaderText}>Member</Text>
                </View>
                {DAY_NAMES.slice(1).concat(DAY_NAMES.slice(0, 1)).map((d) => (
                  <View key={d} style={styles.gridDayCol}>
                    <Text style={styles.gridHeaderText}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Schedule rows */}
              {(schedule?.schedule as any[] ?? []).map((row: any) => (
                <View key={row.memberId} style={styles.gridRow}>
                  <View style={styles.gridNameCol}>
                    <Text style={styles.gridName} numberOfLines={1}>
                      {row.memberName}
                    </Text>
                  </View>
                  {(row.days as any[] ?? []).map((day: any, idx: number) => (
                    <View key={idx} style={styles.gridDayCol}>
                      {day.shift ? (
                        <View
                          style={[
                            styles.shiftBlock,
                            { backgroundColor: day.shift.color ?? Colors.saffron[500] },
                          ]}
                        >
                          <Text style={styles.shiftBlockText}>
                            {day.shift.name?.charAt(0) ?? '?'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.shiftEmpty} />
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </FadeInUp>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ─── Create shift modal ──────────────────────── */}
      <CreateShiftModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          shiftsQ.refetch();
          scheduleQ.refetch();
        }}
      />
    </SafeAreaView>
  );
}

function CreateShiftModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createMut = useCreateShift();
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Name chahiye');
      return;
    }
    try {
      await createMut.mutateAsync({
        name: name.trim(),
        startTime,
        endTime,
      });
      setName('');
      onCreated();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Shift</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X color={Colors.ink[400]} size={22} strokeWidth={2.2} />
            </Pressable>
          </View>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Morning, Evening…"
            placeholderTextColor={Colors.ink[300]}
            style={styles.fieldInput}
          />
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Start</Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor={Colors.ink[300]}
                style={styles.fieldInput}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>End</Text>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="17:00"
                placeholderTextColor={Colors.ink[300]}
                style={styles.fieldInput}
              />
            </View>
          </View>
          <Button
            label="Create Shift"
            onPress={handleCreate}
            loading={createMut.isPending}
            size="lg"
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatShort(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
  } catch {
    return iso;
  }
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
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: {
    fontFamily: FontFamily.heading, fontSize: FontSize.h2,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  subtitle: {
    fontFamily: FontFamily.body, fontSize: FontSize.micro,
    color: Colors.ink[400], marginTop: 2,
  },
  addBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.saffron[50], borderWidth: 1,
    borderColor: Colors.saffron[500],
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: Spacing.xl },

  weekPicker: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.lg, marginBottom: Spacing.lg,
  },
  weekDates: { minWidth: 160, alignItems: 'center' },
  weekText: {
    fontFamily: FontFamily.heading, fontSize: FontSize.label,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },

  legendRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  legendDot: {
    width: 12, height: 12, borderRadius: 6,
  },
  legendText: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[500],
  },

  grid: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm,
  },
  gridHeaderRow: {
    flexDirection: 'row', backgroundColor: Colors.bg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  gridNameCol: {
    width: 80, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
    borderRightWidth: 1, borderRightColor: Colors.border,
  },
  gridDayCol: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
  },
  gridHeaderText: {
    fontFamily: FontFamily.bodyBold, fontSize: 10, fontWeight: FontWeight.bold,
    color: Colors.ink[400], textTransform: 'uppercase',
  },
  gridRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  gridName: {
    fontFamily: FontFamily.bodyBold, fontSize: 11, fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  shiftBlock: {
    width: 28, height: 28, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  shiftBlockText: {
    fontFamily: FontFamily.bodyBold, fontSize: 11,
    fontWeight: FontWeight.bold, color: Colors.white,
  },
  shiftEmpty: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
  },

  // Modal
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontFamily: FontFamily.heading, fontSize: FontSize.h3,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  fieldLabel: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.micro,
    fontWeight: FontWeight.bold, color: Colors.ink[500],
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.md, marginBottom: Spacing.xs,
  },
  fieldInput: {
    fontFamily: FontFamily.body, fontSize: FontSize.body,
    color: Colors.ink[900], backgroundColor: Colors.bg,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
  },
  timeRow: {
    flexDirection: 'row', gap: Spacing.md,
  },
});
