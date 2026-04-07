/**
 * ONDC Order Detail — single order with status timeline + actions.
 *
 * Wires:
 *   - useOndcOrders (filter by id from list cache)
 *   - useUpdateOrderStatus (Accept / In-progress / Completed / Cancelled)
 *   - getInvoiceHtmlUrl (open printable invoice in browser)
 *   - openWhatsAppReminder (share invoice link with customer)
 *
 * Status timeline shows progression. Action buttons render only the
 * valid next states from current state.
 */

import { useMemo, useState } from 'react';
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
  Phone,
  CheckCircle2,
  XCircle,
  Truck,
  ChefHat,
  FileText,
  Share2,
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
import { Card, Skeleton, Button, Badge } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import {
  useOndcOrders,
  useUpdateOrderStatus,
} from '@/features/ondc/hooks';
import {
  ORDER_STATE_FLOW,
  ORDER_STATE_META,
} from '@/features/ondc/schemas';
import { getInvoiceHtmlUrl } from '@/features/ondc/api';
import { auth$ } from '@/stores/auth';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { format } = useCurrency();
  const ordersQ = useOndcOrders(); // hits cache
  const updateMut = useUpdateOrderStatus(orderId ?? '');

  const order = useMemo(
    () => ordersQ.data?.data.find((o) => o.id === orderId),
    [ordersQ.data, orderId],
  );

  const [busy, setBusy] = useState(false);

  async function handleUpdateStatus(state: 'Accepted' | 'In-progress' | 'Completed' | 'Cancelled') {
    if (busy) return;
    setBusy(true);
    try {
      await updateMut.mutateAsync({ state });
      await ordersQ.refetch();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleAccept() {
    Alert.alert(
      'Order accept karein?',
      'Customer ko notification jayegi aur order tayyari shuru hogi.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => handleUpdateStatus('Accepted') },
      ],
    );
  }

  function handleReject() {
    Alert.alert(
      'Order cancel karein?',
      'Customer ka refund ho jayega aur aapki rating affect ho sakti hai.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: () => handleUpdateStatus('Cancelled'),
        },
      ],
    );
  }

  function handleOpenInvoice() {
    if (!orderId) return;
    const businessId = auth$.businessId.get();
    if (!businessId) return;
    haptic('tap');
    const url = getInvoiceHtmlUrl(businessId, orderId);
    Linking.openURL(url).catch((err) =>
      Alert.alert('Error', `Cannot open invoice: ${err.message}`),
    );
  }

  function handleShareInvoice() {
    if (!order?.customerPhone) {
      Alert.alert('Phone missing', 'Customer ka phone number nahi hai');
      return;
    }
    if (!orderId) return;
    const businessId = auth$.businessId.get();
    if (!businessId) return;
    const invoiceUrl = getInvoiceHtmlUrl(businessId, orderId);
    const shopName = auth$.businessName.get() ?? 'Sharma General Store';
    const message = `Namaste! ${shopName} se aapka invoice:\n\n${invoiceUrl}\n\nDhanyawad! 🙏`;
    const url = buildWhatsAppUrl(order.customerPhone, message);
    haptic('confirm');
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp', 'WhatsApp install nahi hai');
    });
  }

  function handleCallCustomer() {
    if (!order?.customerPhone) return;
    haptic('tap');
    Linking.openURL(`tel:+91${order.customerPhone.replace(/\D/g, '').slice(-10)}`);
  }

  if (ordersQ.isLoading && !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.title}>Loading…</Text>
        </View>
        <View style={{ padding: Spacing.xl }}>
          <Skeleton height={180} radius={20} style={{ marginBottom: 12 }} />
          <Skeleton height={120} radius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.title}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const meta = ORDER_STATE_META[order.state] ?? {
    label: order.state,
    emoji: '📦',
    tone: 'trust' as const,
  };

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
          <Text style={styles.title}>Order #{order.orderId.slice(-6)}</Text>
          <Text style={styles.subtitle}>{meta.label}</Text>
        </View>
        <Pressable
          onPress={handleOpenInvoice}
          style={({ pressed }) => [
            styles.invoiceBtn,
            pressed && styles.invoiceBtnPressed,
          ]}
          accessibilityLabel="Open invoice"
        >
          <FileText color={Colors.saffron[600]} size={20} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={ordersQ.isFetching}
            onRefresh={() => ordersQ.refetch()}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Hero ─────────────────────────────────────── */}
        <FadeInUp delay={0}>
          <Card variant="elevated" padding="lg">
            <Text style={styles.heroEmoji}>{meta.emoji}</Text>
            <Text style={styles.heroAmt}>{format(order.total)}</Text>
            <View style={styles.heroBadgeRow}>
              <Badge label={meta.label} tone={meta.tone} />
              <Badge label={`${order.itemCount} items`} tone="neutral" />
            </View>
            <Text style={styles.heroDate}>
              {new Date(order.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Text>
          </Card>
        </FadeInUp>

        {/* ─── Status timeline ──────────────────────────── */}
        <FadeInUp delay={40}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status Timeline</Text>
            <View style={styles.timeline}>
              {ORDER_STATE_FLOW.filter((s) => s.key !== 'Cancelled').map(
                (step, i, arr) => {
                  const currentIdx = arr.findIndex((s) => s.key === order.state);
                  const isCompleted = currentIdx > i;
                  const isCurrent = currentIdx === i;
                  const isCancelled = order.state === 'Cancelled';
                  return (
                    <View key={step.key} style={styles.timelineStep}>
                      <View
                        style={[
                          styles.timelineDot,
                          isCompleted && styles.timelineDotDone,
                          isCurrent && styles.timelineDotCurrent,
                          isCancelled && styles.timelineDotRejected,
                        ]}
                      >
                        <Text style={styles.timelineEmoji}>{step.emoji}</Text>
                      </View>
                      {i < arr.length - 1 && (
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
                          (isCompleted || isCurrent) && styles.timelineLabelActive,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  );
                },
              )}
            </View>
          </View>
        </FadeInUp>

        {/* ─── Customer card ───────────────────────────── */}
        <FadeInUp delay={80}>
          <Card variant="elevated" padding="lg" style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <View style={styles.customerRow}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerInitial}>
                  {order.customerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{order.customerName}</Text>
                {order.customerPhone && (
                  <Text style={styles.customerPhone}>+91 {order.customerPhone}</Text>
                )}
              </View>
              {order.customerPhone && (
                <Pressable
                  onPress={handleCallCustomer}
                  style={({ pressed }) => [
                    styles.callBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityLabel="Call customer"
                >
                  <Phone color={Colors.profit[500]} size={18} strokeWidth={2.4} />
                </Pressable>
              )}
            </View>
          </Card>
        </FadeInUp>

        {/* ─── Action buttons ──────────────────────────── */}
        <FadeInUp delay={120}>
          <View style={styles.actions}>
            {order.state === 'Created' && (
              <>
                <Button
                  label="Accept order"
                  onPress={handleAccept}
                  size="lg"
                  fullWidth
                  loading={busy}
                  rightIcon={
                    <CheckCircle2
                      color={Colors.white}
                      size={18}
                      strokeWidth={2.4}
                    />
                  }
                />
                <Button
                  label="Cancel order"
                  onPress={handleReject}
                  size="md"
                  variant="ghost"
                  fullWidth
                  rightIcon={
                    <XCircle
                      color={Colors.loss[500]}
                      size={16}
                      strokeWidth={2.4}
                    />
                  }
                />
              </>
            )}
            {order.state === 'Accepted' && (
              <Button
                label="Mark as preparing"
                onPress={() => handleUpdateStatus('In-progress')}
                size="lg"
                fullWidth
                loading={busy}
                rightIcon={
                  <ChefHat color={Colors.white} size={18} strokeWidth={2.4} />
                }
              />
            )}
            {order.state === 'In-progress' && (
              <Button
                label="Mark as delivered"
                onPress={() => handleUpdateStatus('Completed')}
                size="lg"
                fullWidth
                loading={busy}
                rightIcon={
                  <Truck color={Colors.white} size={18} strokeWidth={2.4} />
                }
              />
            )}
            {order.state === 'Completed' && order.customerPhone && (
              <Button
                label="Share invoice on WhatsApp"
                onPress={handleShareInvoice}
                size="lg"
                fullWidth
                variant="secondary"
                rightIcon={
                  <Share2 color={Colors.ink[900]} size={18} strokeWidth={2.4} />
                }
              />
            )}
            <Button
              label="View invoice"
              onPress={handleOpenInvoice}
              size="md"
              variant="ghost"
              fullWidth
              rightIcon={
                <FileText
                  color={Colors.saffron[600]}
                  size={16}
                  strokeWidth={2.4}
                />
              }
            />
          </View>
        </FadeInUp>

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
  invoiceBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[50],
    borderWidth: 1,
    borderColor: Colors.saffron[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceBtnPressed: { backgroundColor: Colors.saffron[100] },
  scroll: { padding: Spacing.xl },

  // Hero
  heroEmoji: { fontSize: 36 },
  heroAmt: {
    fontFamily: FontFamily.mono,
    fontSize: 36,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    marginTop: Spacing.sm,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  heroDate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    marginTop: Spacing.md,
  },

  section: { marginTop: Spacing.lg },
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

  // Customer
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitial: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.h3,
    color: Colors.white,
    fontWeight: FontWeight.heavy,
  },
  customerName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  customerPhone: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.profit[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Actions
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
});
