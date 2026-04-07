/**
 * /settings/subscription — Plan management.
 *
 * Wires:
 *   - useBusinessSubscription() — current plan + subscription status
 *   - usePlans() — all available plans
 *   - useCreateSubscription() — upgrade/change plan
 *   - useCancelSubscription() — downgrade to free
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Crown,
  XCircle,
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
import { Button, Skeleton, Badge, Chip } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import {
  useBusinessSubscription,
  usePlans,
  useCreateSubscription,
  useCancelSubscription,
} from '@/features/payments/hooks';
import {
  PLAN_META,
  type SubscriptionPlan,
  type BillingCycle,
  type PlanCode,
} from '@/features/payments/schemas';

export default function SubscriptionScreen() {
  const { format } = useCurrency();
  const subQ = useBusinessSubscription();
  const plansQ = usePlans();
  const upgradeMut = useCreateSubscription();
  const cancelMut = useCancelSubscription();

  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  const currentPlan = subQ.data?.plan;
  const subscription = subQ.data?.subscription;
  const plans = plansQ.data ?? [];

  async function handleUpgrade(planCode: PlanCode) {
    if (planCode === currentPlan?.code) return;
    Alert.alert(
      `${planCode.charAt(0).toUpperCase() + planCode.slice(1)} plan mein upgrade karein?`,
      cycle === 'annual' ? 'Annual billing — 2 mahine free!' : 'Monthly billing',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            try {
              const result = await upgradeMut.mutateAsync({
                planCode,
                billingCycle: cycle,
              });
              if (result.shortUrl) {
                Linking.openURL(result.shortUrl);
              }
              subQ.refetch();
            } catch (err) {
              Alert.alert('Error', (err as Error).message);
            }
          },
        },
      ],
    );
  }

  function handleCancel() {
    Alert.alert(
      'Free plan mein downgrade karein?',
      'Current subscription cancel ho jayega. Features limited ho jayenge.',
      [
        { text: 'Nahi', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMut.mutateAsync();
              subQ.refetch();
            } catch (err) {
              Alert.alert('Error', (err as Error).message);
            }
          },
        },
      ],
    );
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
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>Plan & billing</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={subQ.isFetching}
            onRefresh={() => {
              subQ.refetch();
              plansQ.refetch();
            }}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {subQ.isLoading ? (
          <Skeleton height={160} radius={20} />
        ) : currentPlan ? (
          <>
            {/* ─── Current plan hero ─────────────────── */}
            <FadeInUp delay={0}>
              <View style={styles.currentCard}>
                <View style={styles.currentHeader}>
                  <Text style={styles.currentEmoji}>
                    {PLAN_META[currentPlan.code]?.emoji ?? '📦'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.currentName}>
                      {currentPlan.name}
                    </Text>
                    <Text style={styles.currentTagline}>
                      {PLAN_META[currentPlan.code]?.tagline ?? ''}
                    </Text>
                  </View>
                  <Badge
                    label={subscription?.status?.toUpperCase() ?? 'FREE'}
                    tone="profit"
                  />
                </View>
                {subscription && subscription.billingCycle !== 'free' && (
                  <View style={styles.billingInfo}>
                    <Text style={styles.billingText}>
                      {format(subscription.amount)} / {subscription.billingCycle}
                    </Text>
                    {subscription.nextBillingDate && (
                      <Text style={styles.billingNext}>
                        Next: {subscription.nextBillingDate.slice(0, 10)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </FadeInUp>

            {/* ─── Billing cycle toggle ──────────────── */}
            <FadeInUp delay={40}>
              <View style={styles.cycleRow}>
                <Chip
                  label="Monthly"
                  active={cycle === 'monthly'}
                  onPress={() => setCycle('monthly')}
                />
                <Chip
                  label="Annual · 2 months free"
                  active={cycle === 'annual'}
                  onPress={() => setCycle('annual')}
                />
              </View>
            </FadeInUp>

            {/* ─── Plans grid ────────────────────────── */}
            {plans
              .filter((p) => p.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((plan, i) => {
                const isCurrent = plan.code === currentPlan.code;
                const meta = PLAN_META[plan.code] ?? PLAN_META.free;
                const price =
                  cycle === 'monthly'
                    ? plan.monthlyPrice
                    : plan.annualPrice;

                return (
                  <FadeInUp key={plan.id} delay={80 + i * 30}>
                    <View
                      style={[
                        styles.planCard,
                        isCurrent && styles.planCardCurrent,
                      ]}
                    >
                      <View style={styles.planHeader}>
                        <Text style={styles.planEmoji}>{meta.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.planName}>{plan.name}</Text>
                          <Text style={styles.planDesc} numberOfLines={2}>
                            {plan.description}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.planPrice}>
                        {price === 0 ? 'Free' : `${format(price)} / ${cycle === 'monthly' ? 'mo' : 'yr'}`}
                      </Text>

                      {/* Key features */}
                      <View style={styles.featureList}>
                        {Object.entries(plan.features).slice(0, 5).map(
                          ([key, val]) => (
                            <View key={key} style={styles.featureRow}>
                              <Check
                                color={
                                  val
                                    ? Colors.profit[500]
                                    : Colors.ink[300]
                                }
                                size={14}
                                strokeWidth={2.4}
                              />
                              <Text
                                style={[
                                  styles.featureText,
                                  !val && styles.featureDisabled,
                                ]}
                              >
                                {formatFeatureKey(key)}
                                {typeof val === 'number'
                                  ? `: ${val}`
                                  : ''}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>

                      {isCurrent ? (
                        <View style={styles.currentBadge}>
                          <Crown
                            color={Colors.saffron[500]}
                            size={14}
                            strokeWidth={2.4}
                          />
                          <Text style={styles.currentBadgeText}>
                            Current Plan
                          </Text>
                        </View>
                      ) : (
                        <Button
                          label={
                            price === 0
                              ? 'Downgrade'
                              : `Upgrade to ${plan.name}`
                          }
                          onPress={() =>
                            handleUpgrade(plan.code as PlanCode)
                          }
                          variant={price === 0 ? 'ghost' : 'primary'}
                          size="md"
                          fullWidth
                          loading={upgradeMut.isPending}
                        />
                      )}
                    </View>
                  </FadeInUp>
                );
              })}

            {/* ─── Cancel subscription ───────────────── */}
            {subscription &&
              currentPlan.code !== 'free' && (
                <FadeInUp delay={200}>
                  <Pressable
                    onPress={handleCancel}
                    style={({ pressed }) => [
                      styles.cancelBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <XCircle
                      color={Colors.loss[500]}
                      size={16}
                      strokeWidth={2.2}
                    />
                    <Text style={styles.cancelText}>
                      Cancel subscription
                    </Text>
                  </Pressable>
                </FadeInUp>
              )}
          </>
        ) : null}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatFeatureKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

  currentCard: {
    backgroundColor: Colors.surface, borderWidth: 1.5,
    borderColor: Colors.saffron[500], borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.md,
  },
  currentHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  currentEmoji: { fontSize: 32 },
  currentName: {
    fontFamily: FontFamily.heading, fontSize: FontSize.h3,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  currentTagline: {
    fontFamily: FontFamily.body, fontSize: FontSize.micro,
    color: Colors.ink[400], marginTop: 2,
  },
  billingInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  billingText: {
    fontFamily: FontFamily.monoBold, fontSize: FontSize.label,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  billingNext: {
    fontFamily: FontFamily.body, fontSize: FontSize.micro,
    color: Colors.ink[400],
  },

  cycleRow: {
    flexDirection: 'row', gap: Spacing.sm,
    marginBottom: Spacing.lg, justifyContent: 'center',
  },

  planCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  planCardCurrent: {
    borderColor: Colors.saffron[500], borderWidth: 1.5,
  },
  planHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  planEmoji: { fontSize: 28 },
  planName: {
    fontFamily: FontFamily.heading, fontSize: FontSize.label,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  planDesc: {
    fontFamily: FontFamily.body, fontSize: 11, color: Colors.ink[400],
    marginTop: 2,
  },
  planPrice: {
    fontFamily: FontFamily.mono, fontSize: FontSize.h2,
    fontWeight: FontWeight.heavy, color: Colors.ink[900],
    marginBottom: Spacing.md,
  },
  featureList: { gap: 6, marginBottom: Spacing.lg },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  featureText: {
    fontFamily: FontFamily.body, fontSize: FontSize.caption,
    color: Colors.ink[700],
  },
  featureDisabled: { color: Colors.ink[400], textDecorationLine: 'line-through' },
  currentBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.sm,
    backgroundColor: Colors.saffron[50], borderRadius: Radius.md,
  },
  currentBadgeText: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.saffron[600],
  },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.lg, marginTop: Spacing.lg,
  },
  cancelText: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.caption,
    fontWeight: FontWeight.bold, color: Colors.loss[500],
  },
});
