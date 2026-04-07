/**
 * ReceivePaymentSheet — record a payment received from a customer.
 *
 * Opened from CustomerDetailScreen with the customerId pre-bound.
 * Single field: amount. Submits via useReceivePayment, closes on success.
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';

import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '@theme';
import { useReceivePayment } from '@/features/customers/hooks';
import { receivePaymentSchema } from '@/features/customers/schemas';

export interface ReceivePaymentProps {
  visible: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  outstanding: number;
}

export function ReceivePaymentSheet({
  visible,
  onClose,
  customerId,
  customerName,
  outstanding,
}: ReceivePaymentProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const receiveMut = useReceivePayment(customerId);

  useEffect(() => {
    if (visible) {
      setAmount(String(outstanding));
      setError(null);
    }
  }, [visible, outstanding]);

  const amountNum = parseFloat(amount);
  const canSubmit = !isNaN(amountNum) && amountNum > 0 && !receiveMut.isPending;
  const newBalance = Math.max(0, outstanding - (amountNum || 0));

  async function handleSubmit() {
    setError(null);
    const parsed = receivePaymentSchema.safeParse({ amount: amountNum });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid amount');
      return;
    }
    try {
      await receiveMut.mutateAsync(parsed.data);
      onClose();
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Failed to save');
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Paise mile</Text>
        <Text style={styles.subtitle}>{customerName} ne kitna diya?</Text>

        {/* ─── Outstanding context ──────────────── */}
        <View style={styles.outstandingCard}>
          <Text style={styles.outstandingLabel}>Total outstanding</Text>
          <Text style={styles.outstandingAmt}>
            ₹{outstanding.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* ─── Amount ────────────────────────────── */}
        <Text style={styles.label}>Payment amount</Text>
        <View style={styles.amountWrap}>
          <Text style={styles.rupeeSign}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            style={styles.amountInput}
            testID="receive-payment-amount"
          />
        </View>

        {/* ─── Quick chips ───────────────────────── */}
        <View style={styles.quickRow}>
          <QuickChip
            label="Half"
            onPress={() => setAmount(String(Math.round(outstanding / 2)))}
          />
          <QuickChip
            label="Full"
            onPress={() => setAmount(String(outstanding))}
          />
          <QuickChip label="₹500" onPress={() => setAmount('500')} />
          <QuickChip label="₹1000" onPress={() => setAmount('1000')} />
        </View>

        {/* ─── New balance preview ───────────────── */}
        {amountNum > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>After this payment</Text>
            <Text style={styles.previewValue}>
              ₹{newBalance.toLocaleString('en-IN')}{' '}
              <Text style={styles.previewSub}>baaki rahega</Text>
            </Text>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.submitWrap}>
          <Button
            label="Confirm · Paise mile"
            onPress={handleSubmit}
            size="hero"
            fullWidth
            loading={receiveMut.isPending}
            disabled={!canSubmit}
            hapticPattern="confirm"
            testID="receive-payment-submit"
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function QuickChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={styles.quickChip}
      accessibilityRole="button"
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  outstandingCard: {
    backgroundColor: Colors.warning[50],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  outstandingLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.warning[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  outstandingAmt: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    marginTop: 4,
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.profit[50],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.profit[400],
    minHeight: 76,
  },
  rupeeSign: {
    fontFamily: FontFamily.mono,
    fontSize: 36,
    fontWeight: FontWeight.heavy,
    color: Colors.profit[500],
  },
  amountInput: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: 36,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    padding: 0,
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  quickChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.micro,
    color: Colors.ink[700],
    fontWeight: FontWeight.semibold,
    overflow: 'hidden',
  },
  previewCard: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.profit[50],
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  previewLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.profit[700],
  },
  previewValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.h3,
    color: Colors.ink[900],
    marginTop: 2,
  },
  previewSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    fontWeight: FontWeight.regular,
  },
  errorText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
    marginTop: Spacing.md,
  },
  submitWrap: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
