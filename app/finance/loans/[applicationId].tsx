/**
 * Loan Application Detail — track a single submitted application.
 *
 * Wires:
 *   - GET /lending/applications/:id/status (polled every 60s)
 *   - POST /lending/aa/consent (kicks off Account Aggregator flow)
 *   - GET /lending/aa/consent/:consentId (polled while consent is pending)
 *
 * Shows:
 *   - Hero card with NBFC + amount + status badge
 *   - Status timeline (5 steps)
 *   - Applicant details
 *   - Magic link button (opens NBFC KYC + e-sign portal)
 *   - AA Consent button (if status='aa_consent_pending' or 'submitted')
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
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
import { Button, Card, Skeleton, Badge } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import {
  useLoanApplicationStatus,
  useInitiateAaConsent,
  useAaConsentStatus,
} from '@/features/lending/hooks';
import {
  LOAN_STATUS_FLOW,
  LOAN_STATUS_LABELS,
  NBFC_META,
} from '@/features/lending/schemas';

export default function LoanApplicationDetailScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { format } = useCurrency();
  const statusQ = useLoanApplicationStatus(applicationId);
  const aaConsentMut = useInitiateAaConsent();
  const [consentId, setConsentId] = useState<string | null>(null);
  const aaStatusQ = useAaConsentStatus(consentId ?? undefined);

  const data = statusQ.data;
  const status = data?.status ?? 'submitted';
  const meta = data ? NBFC_META[data.nbfcCode] : null;
  const statusInfo = LOAN_STATUS_LABELS[status] ?? LOAN_STATUS_LABELS.submitted!;

  async function handleOpenMagicLink() {
    if (!data?.magicLinkUrl) return;
    haptic('tap');
    try {
      await Linking.openURL(data.magicLinkUrl);
    } catch (err) {
      Alert.alert('Error', `Cannot open link: ${(err as Error).message}`);
    }
  }

  async function handleStartAaConsent() {
    if (!applicationId) return;
    haptic('tap');
    try {
      const result = await aaConsentMut.mutateAsync({
        applicationId,
        dataRangeMonths: 12,
      });
      setConsentId(result.consentId);
      // Open the consent URL if returned
      if (result.consentUrl) {
        await Linking.openURL(result.consentUrl).catch(() => {});
      } else {
        Alert.alert(
          'Consent initiated',
          'AA consent flow shuru ho gayi. NBFC se SMS aayega.',
        );
      }
    } catch (err) {
      Alert.alert(
        'Error',
        (err as { message?: string }).message ?? 'AA consent failed',
      );
    }
  }

  const showAaConsent =
    status === 'submitted' || status === 'aa_consent_pending';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.backBtnPressed,
          ]}
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Loan Application</Text>
          <Text style={styles.subtitle}>
            {data?.nbfcName ?? 'Loading…'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={statusQ.isFetching}
            onRefresh={() => statusQ.refetch()}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {statusQ.isLoading && !data ? (
          <>
            <Skeleton height={180} radius={20} style={{ marginBottom: 12 }} />
            <Skeleton height={300} radius={20} style={{ marginBottom: 12 }} />
          </>
        ) : !data ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Application nahi mili</Text>
          </View>
        ) : (
          <>
            {/* ─── Hero gradient card ───────────────────── */}
            <FadeInUp delay={0}>
              <View
                style={[
                  styles.hero,
                  { backgroundColor: meta?.gradient[0] ?? Colors.saffron[500] },
                ]}
              >
                <View style={styles.heroHead}>
                  <Text style={styles.heroEmoji}>{meta?.emoji ?? '💳'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroNbfc}>{data.nbfcName}</Text>
                    <Text style={styles.heroTagline}>
                      {meta?.tagline ?? 'NBFC partner'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.heroAmtLabel}>Requested amount</Text>
                <Text style={styles.heroAmt}>
                  {format(data.requestedAmount)}
                </Text>
                {data.approvedAmount && (
                  <View style={styles.approvedRow}>
                    <CheckCircle2
                      color={Colors.white}
                      size={14}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.approvedText}>
                      Approved: {format(data.approvedAmount)}
                    </Text>
                  </View>
                )}
                <View style={styles.heroBadgeRow}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>
                      {statusInfo.label}
                    </Text>
                  </View>
                  {data.tenureMonths && (
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>
                        {data.tenureMonths} months
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </FadeInUp>

            {/* ─── Status timeline ──────────────────────── */}
            <FadeInUp delay={40}>
              <Card variant="elevated" padding="lg" style={styles.section}>
                <Text style={styles.sectionTitle}>Status timeline</Text>
                <View style={styles.timeline}>
                  {LOAN_STATUS_FLOW.map((step, i) => {
                    const currentIdx = LOAN_STATUS_FLOW.findIndex(
                      (s) => s.key === status,
                    );
                    const isCompleted = currentIdx >= 0 && i < currentIdx;
                    const isCurrent = i === currentIdx;
                    const isPending = currentIdx >= 0 && i > currentIdx;
                    const isRejected = status === 'rejected';

                    return (
                      <View key={step.key} style={styles.timelineStep}>
                        <View
                          style={[
                            styles.timelineDot,
                            isCompleted && styles.timelineDotDone,
                            isCurrent && styles.timelineDotCurrent,
                            isPending && styles.timelineDotPending,
                            isRejected && styles.timelineDotRejected,
                          ]}
                        >
                          <Text style={styles.timelineEmoji}>{step.emoji}</Text>
                        </View>
                        {i < LOAN_STATUS_FLOW.length - 1 && (
                          <View
                            style={[
                              styles.timelineLine,
                              isCompleted && styles.timelineLineDone,
                            ]}
                          />
                        )}
                        <Text
                          style={[
                            styles.timelineLabel,
                            (isCompleted || isCurrent) &&
                              styles.timelineLabelActive,
                          ]}
                        >
                          {step.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            </FadeInUp>

            {/* ─── Magic link CTA ───────────────────────── */}
            {data.magicLinkUrl && (
              <FadeInUp delay={80}>
                <Card variant="warm" padding="lg" style={styles.section}>
                  <View style={styles.linkHead}>
                    <ExternalLink
                      color={Colors.saffron[600]}
                      size={20}
                      strokeWidth={2.4}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.linkTitle}>NBFC KYC + e-sign</Text>
                      <Text style={styles.linkBody}>
                        Aapke NBFC ka KYC + e-sign pending hai. Link kholo aur
                        complete karein.
                      </Text>
                    </View>
                  </View>
                  <Button
                    label="Open NBFC portal"
                    onPress={handleOpenMagicLink}
                    size="md"
                    fullWidth
                    rightIcon={
                      <ExternalLink
                        color={Colors.white}
                        size={16}
                        strokeWidth={2.4}
                      />
                    }
                  />
                </Card>
              </FadeInUp>
            )}

            {/* ─── AA consent CTA ──────────────────────── */}
            {showAaConsent && (
              <FadeInUp delay={120}>
                <Card variant="trust" padding="lg" style={styles.section}>
                  <View style={styles.linkHead}>
                    <ShieldCheck
                      color={Colors.trust[500]}
                      size={20}
                      strokeWidth={2.4}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.linkTitle}>Account Aggregator</Text>
                      <Text style={styles.linkBody}>
                        NBFC ko aapka bank statement chahiye. AA framework
                        ke through securely share karein. Yeh RBI-regulated hai.
                      </Text>
                    </View>
                  </View>
                  <Button
                    label="Start AA consent"
                    onPress={handleStartAaConsent}
                    size="md"
                    fullWidth
                    loading={aaConsentMut.isPending}
                    variant="secondary"
                    rightIcon={
                      <ShieldCheck
                        color={Colors.ink[900]}
                        size={16}
                        strokeWidth={2.4}
                      />
                    }
                  />
                  {aaStatusQ.data && (
                    <View style={styles.aaStatusRow}>
                      <Text style={styles.aaStatusText}>
                        AA Status: {aaStatusQ.data.status}
                      </Text>
                    </View>
                  )}
                </Card>
              </FadeInUp>
            )}

            {/* ─── Applicant details ────────────────────── */}
            <FadeInUp delay={160}>
              <Card variant="elevated" padding="lg" style={styles.section}>
                <Text style={styles.sectionTitle}>Applicant Details</Text>
                <DetailRow label="Name" value={data.applicantName ?? '—'} />
                <DetailRow
                  label="Phone"
                  value={data.applicantPhone ?? '—'}
                />
                {data.applicantPan && (
                  <DetailRow label="PAN" value={data.applicantPan} mono />
                )}
                {data.nbfcReferenceNumber && (
                  <DetailRow
                    label="NBFC Ref"
                    value={data.nbfcReferenceNumber}
                    mono
                  />
                )}
                {data.submittedAt && (
                  <DetailRow
                    label="Submitted"
                    value={new Date(data.submittedAt).toLocaleDateString('en-IN')}
                  />
                )}
              </Card>
            </FadeInUp>

            <View style={{ height: 60 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          mono && { fontFamily: FontFamily.monoBold, letterSpacing: 0.5 },
        ]}
      >
        {value}
      </Text>
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
  empty: { alignItems: 'center', padding: Spacing['3xl'] },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[400],
  },

  // Hero
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroEmoji: { fontSize: 32 },
  heroNbfc: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  heroTagline: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  heroAmtLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.bold,
  },
  heroAmt: {
    fontFamily: FontFamily.mono,
    fontSize: 36,
    fontWeight: FontWeight.heavy,
    color: Colors.white,
    marginTop: 2,
  },
  approvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  approvedText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.white,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  statusPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  statusPillText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.bold,
  },

  // Section header
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    marginBottom: Spacing.md,
  },

  // Timeline
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotDone: { backgroundColor: Colors.profit[500] },
  timelineDotCurrent: {
    backgroundColor: Colors.saffron[500],
    ...Shadow.saffronGlow,
  },
  timelineDotPending: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  timelineDotRejected: { backgroundColor: Colors.loss[500] },
  timelineEmoji: { fontSize: 16 },
  timelineLine: {
    position: 'absolute',
    top: 19,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: Colors.border,
  },
  timelineLineDone: { backgroundColor: Colors.profit[500] },
  timelineLabel: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.ink[400],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  timelineLabelActive: {
    color: Colors.ink[900],
    fontWeight: FontWeight.bold,
  },

  // Magic link / AA consent
  linkHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  linkTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  linkBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[700],
    marginTop: 2,
    lineHeight: 18,
  },
  aaStatusRow: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
  },
  aaStatusText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    color: Colors.trust[700],
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
  },
  detailValue: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.ink[900],
    fontWeight: FontWeight.bold,
  },
});
