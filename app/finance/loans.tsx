/**
 * NBFC Loan Marketplace.
 *
 * Wires three backend endpoints:
 *   - GET /lending/eligibility → 3 NBFCs + max amounts + indicative rates
 *   - GET /lending/offers → pre-approved offers (if any)
 *   - GET /lending/applications → submitted applications
 *
 * Each NBFC card opens LoanApplicationSheet with the right context.
 */

import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  RotateCw,
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
import { Card, SectionLabel, Skeleton, Button } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import {
  useEligibility,
  useLoanOffers,
  useLoanApplications,
  useRefreshOffers,
} from '@/features/lending/hooks';
import { NBFC_META } from '@/features/lending/schemas';
import type { EligibilityResult } from '@/features/lending/schemas';
import { useSheets } from '@/components/sheets';

export default function LoansScreen() {
  const { format } = useCurrency();
  const eligibilityQ = useEligibility();
  const offersQ = useLoanOffers();
  const appsQ = useLoanApplications();
  const refreshOffersMut = useRefreshOffers();
  const { openLoanApplication } = useSheets();

  const eligibleCount = (eligibilityQ.data ?? []).filter((e) => e.eligible).length;

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([
      eligibilityQ.refetch(),
      offersQ.refetch(),
      appsQ.refetch(),
    ]);
  }

  async function handleRefreshOffers() {
    haptic('tap');
    try {
      const result = await refreshOffersMut.mutateAsync();
      if (result.generated > 0) {
        await offersQ.refetch();
      }
    } catch (err) {
      // Error toast handled by mutation hook
    }
  }

  function handleApply(eligibility: EligibilityResult) {
    if (!eligibility.eligible) return;
    haptic('tap');
    openLoanApplication({
      nbfcCode: eligibility.nbfcCode as 'flexiloans' | 'lendingkart' | 'kinara',
      maxAmount: eligibility.maxAmount,
      indicativeRate: eligibility.indicativeRate,
    });
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
          <Text style={styles.title}>NBFC Marketplace</Text>
          <Text style={styles.subtitle}>
            {eligibleCount > 0
              ? `${eligibleCount} of 3 NBFCs eligible`
              : 'Eligibility check ho rahi hai…'}
          </Text>
        </View>
        <Pressable
          onPress={handleRefreshOffers}
          disabled={refreshOffersMut.isPending}
          style={({ pressed }) => [
            styles.refreshBtn,
            pressed && styles.refreshBtnPressed,
          ]}
          accessibilityLabel="Refresh loan offers"
        >
          <RotateCw
            color={Colors.saffron[600]}
            size={18}
            strokeWidth={2.4}
            style={refreshOffersMut.isPending ? styles.spinning : undefined}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={eligibilityQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Pre-approved offers (if any) ─────────── */}
        {offersQ.data && offersQ.data.length > 0 && (
          <FadeInUp delay={0}>
            <SectionLabel label="✨ Pre-approved offers" />
            {offersQ.data.map((offer) => {
              const meta = NBFC_META[offer.nbfcCode];
              return (
                <Pressable
                  key={offer.id}
                  onPress={() =>
                    openLoanApplication({
                      nbfcCode: offer.nbfcCode as 'flexiloans' | 'lendingkart' | 'kinara',
                      maxAmount: offer.offerAmount,
                      indicativeRate: offer.interestRate ?? undefined,
                      offerId: offer.id,
                    })
                  }
                  style={({ pressed }) => [
                    styles.offerCard,
                    { backgroundColor: meta?.gradient[0] ?? Colors.saffron[500] },
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <View style={styles.offerHeader}>
                    <View style={styles.offerBadge}>
                      <Text style={styles.offerBadgeText}>PRE-APPROVED</Text>
                    </View>
                  </View>
                  <Text style={styles.offerName}>{offer.nbfcName}</Text>
                  <Text style={styles.offerAmount}>{format(offer.offerAmount)}</Text>
                  {offer.interestRate && (
                    <Text style={styles.offerRate}>
                      @ {offer.interestRate}% p.a. · {offer.tenureMonths} months
                    </Text>
                  )}
                  <View style={styles.offerCta}>
                    <Text style={styles.offerCtaText}>Apply now</Text>
                    <ChevronRight color={Colors.white} size={18} strokeWidth={2.4} />
                  </View>
                </Pressable>
              );
            })}
          </FadeInUp>
        )}

        {/* ─── All NBFCs eligibility list ─────────────── */}
        <FadeInUp delay={40}>
          <SectionLabel label="All NBFCs · Eligibility check" />
        </FadeInUp>

        {eligibilityQ.isLoading ? (
          <>
            <Skeleton height={140} radius={16} style={{ marginBottom: 8 }} />
            <Skeleton height={140} radius={16} style={{ marginBottom: 8 }} />
            <Skeleton height={140} radius={16} style={{ marginBottom: 8 }} />
          </>
        ) : (
          (eligibilityQ.data ?? []).map((eligibility, i) => {
            const meta = NBFC_META[eligibility.nbfcCode];
            return (
              <FadeInUp key={eligibility.nbfcCode} delay={80 + i * 30}>
                <View
                  style={[
                    styles.eligCard,
                    !eligibility.eligible && styles.eligCardInactive,
                  ]}
                >
                  <View style={styles.eligHeader}>
                    <Text style={styles.eligEmoji}>{meta?.emoji ?? '💳'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eligName}>{eligibility.nbfcName}</Text>
                      <Text style={styles.eligTagline}>
                        {meta?.tagline ?? 'NBFC partner'}
                      </Text>
                    </View>
                    {eligibility.eligible ? (
                      <View style={styles.statusGreen}>
                        <CheckCircle2
                          color={Colors.profit[500]}
                          size={20}
                          strokeWidth={2.4}
                        />
                      </View>
                    ) : (
                      <View style={styles.statusRed}>
                        <XCircle color={Colors.loss[500]} size={20} strokeWidth={2.4} />
                      </View>
                    )}
                  </View>

                  {eligibility.eligible ? (
                    <>
                      <View style={styles.eligStats}>
                        <View>
                          <Text style={styles.eligStatLabel}>Max amount</Text>
                          <Text style={styles.eligStatValue}>
                            {format(eligibility.maxAmount ?? 0)}
                          </Text>
                        </View>
                        {eligibility.indicativeRate && (
                          <View>
                            <Text style={styles.eligStatLabel}>Rate</Text>
                            <Text style={styles.eligStatValue}>
                              {eligibility.indicativeRate.toFixed(1)}%
                            </Text>
                          </View>
                        )}
                      </View>
                      <Button
                        label="Apply karo"
                        onPress={() => handleApply(eligibility)}
                        size="md"
                        fullWidth
                        rightIcon={
                          <CreditCard
                            color={Colors.white}
                            size={16}
                            strokeWidth={2.4}
                          />
                        }
                      />
                    </>
                  ) : (
                    <View style={styles.notEligible}>
                      <Text style={styles.reasonText}>
                        {eligibility.reason ?? 'Eligibility criteria poori nahi hui'}
                      </Text>
                      <Text style={styles.criteriaText}>
                        Required: {format(eligibility.minRevenue)}/month revenue ·
                        {' '}Score {eligibility.minScore}+
                      </Text>
                    </View>
                  )}
                </View>
              </FadeInUp>
            );
          })
        )}

        {/* ─── My applications ─────────────────────────── */}
        {appsQ.data && appsQ.data.data.length > 0 && (
          <FadeInUp delay={200}>
            <SectionLabel label="Meri applications" />
            {appsQ.data.data.map((app) => (
              <Pressable
                key={app.id}
                onPress={() => {
                  haptic('tap');
                  router.push(`/finance/loans/${app.id}`);
                }}
                style={({ pressed }) => [pressed && { opacity: 0.92 }]}
              >
                <Card variant="elevated" padding="md" style={styles.appCard}>
                  <View style={styles.appRow}>
                    <Clock color={Colors.warning[500]} size={18} strokeWidth={2.4} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appName}>{app.nbfcName}</Text>
                      <Text style={styles.appAmt}>
                        {format(app.requestedAmount)} · {app.status}
                      </Text>
                    </View>
                    <ChevronRight color={Colors.ink[400]} size={18} strokeWidth={2.2} />
                  </View>
                </Card>
              </Pressable>
            ))}
          </FadeInUp>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[50],
    borderWidth: 1,
    borderColor: Colors.saffron[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnPressed: { backgroundColor: Colors.saffron[100] },
  spinning: { transform: [{ rotate: '180deg' }] },
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

  // Offer cards
  offerCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.md,
  },
  offerHeader: { marginBottom: Spacing.sm },
  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  offerBadgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 9,
    color: Colors.saffron[600],
    fontWeight: FontWeight.bold,
  },
  offerName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  offerAmount: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.heavy,
    color: Colors.white,
    marginTop: Spacing.xs,
  },
  offerRate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  offerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
  },
  offerCtaText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },

  // Eligibility cards
  eligCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  eligCardInactive: { opacity: 0.7 },
  eligHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  eligEmoji: { fontSize: 24 },
  eligName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  eligTagline: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
    marginTop: 2,
  },
  statusGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.profit[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.loss[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  eligStats: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  eligStatLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 9,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eligStatValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    marginTop: 2,
  },
  notEligible: {
    backgroundColor: Colors.loss[50],
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  reasonText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
  },
  criteriaText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
    marginTop: 4,
  },

  // Applications
  appCard: { marginBottom: Spacing.sm },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  appName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  appAmt: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
    marginTop: 2,
  },
});
