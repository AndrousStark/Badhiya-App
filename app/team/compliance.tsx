/**
 * /team/compliance — PF, ESI, overtime status + configuration.
 *
 * Wires:
 *   - useComplianceStatus() — config + alerts + thresholds
 *   - useOvertimeReport() — quarterly OT hours per member
 *   - useUpdateComplianceConfig() — toggle PF/ESI/selfie/geofence
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Shield,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
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
import { Skeleton, SectionLabel, Badge } from '@/components/ui';
import {
  useComplianceStatus,
  useOvertimeReport,
  useUpdateComplianceConfig,
} from '@/features/team/hooks';
import type { ComplianceAlert } from '@/features/team/schemas';

export default function ComplianceScreen() {
  const statusQ = useComplianceStatus();
  const overtimeQ = useOvertimeReport();
  const updateMut = useUpdateComplianceConfig();

  const status = statusQ.data;
  const overtime = overtimeQ.data;

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([statusQ.refetch(), overtimeQ.refetch()]);
  }

  async function togglePf(value: boolean) {
    haptic('tap');
    try {
      await updateMut.mutateAsync({ pfEnabled: value });
      statusQ.refetch();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  async function toggleEsi(value: boolean) {
    haptic('tap');
    try {
      await updateMut.mutateAsync({ esiEnabled: value });
      statusQ.refetch();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  async function toggleSelfie(value: boolean) {
    haptic('tap');
    try {
      await updateMut.mutateAsync({ selfieRequired: value });
      statusQ.refetch();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
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
          <Text style={styles.title}>Compliance</Text>
          <Text style={styles.subtitle}>PF · ESI · Overtime · Geofence</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={statusQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {statusQ.isLoading && !status ? (
          <>
            <Skeleton height={120} radius={16} style={{ marginBottom: 16 }} />
            <Skeleton height={80} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={80} radius={12} />
          </>
        ) : status ? (
          <>
            {/* ─── Alerts ──────────────────────────────── */}
            {status.alerts.length > 0 && (
              <FadeInUp delay={0}>
                <SectionLabel label={`Alerts · ${status.alerts.length}`} />
                {status.alerts.map((alert, i) => (
                  <AlertCard key={i} alert={alert} />
                ))}
              </FadeInUp>
            )}

            {/* ─── Config toggles ──────────────────────── */}
            <FadeInUp delay={60}>
              <SectionLabel label="Configuration" />
              <View style={styles.configCard}>
                <ToggleRow
                  label="Provident Fund (PF)"
                  hint={
                    status.thresholds.pfRequired
                      ? `Required (${status.teamSize}+ members)`
                      : 'Optional'
                  }
                  value={status.config.pfEnabled}
                  onToggle={togglePf}
                  required={status.thresholds.pfRequired}
                />
                <ToggleRow
                  label="ESI (Employee State Insurance)"
                  hint={
                    status.thresholds.esiRequired
                      ? `Required (${status.teamSize}+ members)`
                      : 'Optional'
                  }
                  value={status.config.esiEnabled}
                  onToggle={toggleEsi}
                  required={status.thresholds.esiRequired}
                />
                <ToggleRow
                  label="Selfie Attendance"
                  hint="GPS + Photo verification"
                  value={status.config.selfieRequired}
                  onToggle={toggleSelfie}
                />
              </View>
            </FadeInUp>

            {/* ─── OT cap info ─────────────────────────── */}
            <FadeInUp delay={100}>
              <View style={styles.infoCard}>
                <Clock color={Colors.trust[500]} size={20} strokeWidth={2.4} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>Overtime Cap</Text>
                  <Text style={styles.infoBody}>
                    {status.config.otCapEnabled
                      ? `Max ${status.config.otCapHoursQuarter} hrs/quarter`
                      : 'OT cap disabled'}
                  </Text>
                </View>
              </View>
            </FadeInUp>

            {/* ─── Overtime report ──────────────────────── */}
            {overtime && overtime.members.length > 0 && (
              <FadeInUp delay={140}>
                <SectionLabel
                  label={`Q${overtime.quarter} ${overtime.year} Overtime`}
                />
                {overtime.members.map((m) => (
                  <View
                    key={m.memberId}
                    style={[
                      styles.otRow,
                      m.exceeded && styles.otRowExceeded,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otName}>{m.memberName}</Text>
                      <View style={styles.otProgressRow}>
                        <View style={styles.otTrack}>
                          <View
                            style={[
                              styles.otFill,
                              {
                                width: `${Math.min(100, m.percentUsed)}%`,
                                backgroundColor: m.exceeded
                                  ? Colors.loss[500]
                                  : m.atRisk
                                    ? Colors.warning[500]
                                    : Colors.profit[500],
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.otPercent}>
                          {Math.round(m.percentUsed)}%
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.otHours}>{m.totalOtHours}h</Text>
                    {m.exceeded && <Badge label="EXCEEDED" tone="loss" />}
                    {!m.exceeded && m.atRisk && (
                      <Badge label="AT RISK" tone="warning" />
                    )}
                  </View>
                ))}
              </FadeInUp>
            )}
          </>
        ) : (
          <Text style={styles.errorText}>
            Compliance data load nahi hua
          </Text>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AlertCard({ alert }: { alert: ComplianceAlert }) {
  const icon =
    alert.type === 'critical' ? (
      <AlertCircle color={Colors.loss[500]} size={18} strokeWidth={2.4} />
    ) : alert.type === 'warning' ? (
      <AlertTriangle color={Colors.warning[500]} size={18} strokeWidth={2.4} />
    ) : (
      <Info color={Colors.trust[500]} size={18} strokeWidth={2.4} />
    );

  const bgColor =
    alert.type === 'critical'
      ? Colors.loss[50]
      : alert.type === 'warning'
        ? Colors.warning[50]
        : Colors.trust[50];

  return (
    <View style={[styles.alertCard, { backgroundColor: bgColor }]}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={styles.alertTitle}>{alert.titleHindi || alert.title}</Text>
        <Text style={styles.alertDesc}>{alert.description}</Text>
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onToggle,
  required,
}: {
  label: string;
  hint: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  required?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleHint}>
          {hint}
          {required && !value ? ' ⚠️' : ''}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: Colors.ink[300],
          true: Colors.saffron[500],
        }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
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
  scroll: { padding: Spacing.xl },

  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  alertTitle: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  alertDesc: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[500],
    marginTop: 2,
  },

  configCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, ...Shadow.sm,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  toggleLabel: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  toggleHint: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400],
    marginTop: 2,
  },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.trust[50], borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.md,
  },
  infoTitle: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  infoBody: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[500],
    marginTop: 2,
  },

  otRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  otRowExceeded: {
    borderColor: Colors.loss[500], backgroundColor: Colors.loss[50],
  },
  otName: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  otProgressRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: 4,
  },
  otTrack: {
    flex: 1, height: 5, backgroundColor: Colors.bg,
    borderRadius: 2.5, overflow: 'hidden',
  },
  otFill: { height: '100%', borderRadius: 2.5 },
  otPercent: {
    fontFamily: FontFamily.monoBold, fontSize: 10,
    fontWeight: FontWeight.bold, color: Colors.ink[700],
    minWidth: 30, textAlign: 'right',
  },
  otHours: {
    fontFamily: FontFamily.monoBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.ink[700],
  },

  errorText: {
    fontFamily: FontFamily.body, fontSize: FontSize.caption,
    color: Colors.ink[400], textAlign: 'center', paddingVertical: Spacing['3xl'],
  },
});
