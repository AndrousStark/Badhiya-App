/**
 * RecordSaleSheet — confirm + edit before saving a transaction.
 *
 * Opened either:
 *   1. From VoiceInputSheet's onConfirm callback (pre-filled from NLU)
 *   2. Manually from a Home/Khata "Add transaction" button (empty)
 *
 * On submit: writes to local Drizzle SQLite via createTransactionOffline()
 * → optimistic UI update → background sync via syncPendingTransactions().
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';

import { BottomSheet } from './BottomSheet';
import { Button, Chip } from '@/components/ui';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  TouchTarget,
} from '@theme';
import { haptic } from '@/lib/haptics';
import { createTransactionOffline, syncPendingTransactions } from '@/services/sync';
import { txnKeys } from '@/features/transactions/hooks';
import { businessKeys } from '@/features/businesses/hooks';
import type { TransactionTypeMobile } from '@/features/transactions/schemas';
import type { ParsedTransaction } from '@/features/transactions/nlu';

export interface RecordSaleProps {
  visible: boolean;
  onClose: () => void;
  /** Pre-fill the form from a NLU parse result. */
  initial?: ParsedTransaction | null;
}

const TYPE_CHIPS: {
  value: TransactionTypeMobile;
  label: string;
  icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }>;
  color: string;
}[] = [
  { value: 'sale', label: 'Bikri', icon: TrendingUp, color: Colors.profit[500] },
  { value: 'expense', label: 'Kharcha', icon: TrendingDown, color: Colors.loss[500] },
  { value: 'payment', label: 'Paise mile', icon: Wallet, color: Colors.trust[500] },
];

export function RecordSaleSheet({ visible, onClose, initial }: RecordSaleProps) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<TransactionTypeMobile>('sale');
  const [amount, setAmount] = useState('');
  const [item, setItem] = useState('');
  const [customer, setCustomer] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from NLU result on open
  useEffect(() => {
    if (visible && initial) {
      if (initial.type) setType(initial.type);
      if (initial.amount !== null) setAmount(String(initial.amount));
      if (initial.item) setItem(initial.item);
      if (initial.customerName) setCustomer(initial.customerName);
    } else if (visible) {
      // Manual open — reset
      setType('sale');
      setAmount('');
      setItem('');
      setCustomer('');
      setNotes('');
    }
  }, [visible, initial]);

  const amountNum = parseFloat(amount);
  const canSubmit = !isNaN(amountNum) && amountNum > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createTransactionOffline({
        type,
        amount: amountNum,
        item: item.trim() || undefined,
        customerId: customer.trim() || undefined,
        notes: notes.trim() || undefined,
        recordedVia: initial?.raw ? 'voice' : 'manual',
      });
      haptic('revealMoney');

      // Optimistically refetch dashboard + transactions list
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
      queryClient.invalidateQueries({ queryKey: txnKeys.all });

      // Fire-and-forget background sync
      void syncPendingTransactions();

      onClose();
    } catch (err) {
      haptic('error');
      // TODO: surface inline error
      console.warn('Failed to record txn', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Record karo</Text>
        <Text style={styles.subtitle}>
          {initial?.raw
            ? `From voice: "${initial.raw.slice(0, 50)}${initial.raw.length > 50 ? '…' : ''}"`
            : 'Naya transaction'}
        </Text>

        {/* ─── Type chips ─────────────────────────────── */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {TYPE_CHIPS.map((t) => {
            const Icon = t.icon;
            const active = type === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => {
                  haptic('select');
                  setType(t.value);
                }}
                style={[
                  styles.typeBtn,
                  active && styles.typeBtnActive,
                  active && { borderColor: t.color },
                ]}
              >
                <Icon
                  color={active ? t.color : Colors.ink[400]}
                  size={20}
                  strokeWidth={2.4}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    active && { color: t.color, fontWeight: FontWeight.bold },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ─── Amount ─────────────────────────────────── */}
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountWrap}>
          <Text style={styles.rupeeSign}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.ink[300]}
            autoFocus
            style={styles.amountInput}
          />
        </View>

        {/* ─── Item ───────────────────────────────────── */}
        <Text style={styles.label}>Item / Description</Text>
        <TextInput
          value={item}
          onChangeText={setItem}
          placeholder={type === 'sale' ? 'e.g., 5 kg atta' : type === 'expense' ? 'e.g., bijli bill' : 'e.g., received from Ravi'}
          placeholderTextColor={Colors.ink[300]}
          style={styles.input}
          maxLength={200}
        />

        {/* ─── Customer (sale/payment only) ───────────── */}
        {type !== 'expense' && (
          <>
            <Text style={styles.label}>Customer (optional)</Text>
            <TextInput
              value={customer}
              onChangeText={setCustomer}
              placeholder="Ravi Sharma"
              placeholderTextColor={Colors.ink[300]}
              autoCapitalize="words"
              style={styles.input}
              maxLength={120}
            />
          </>
        )}

        {/* ─── Notes (optional) ───────────────────────── */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else?"
          placeholderTextColor={Colors.ink[300]}
          multiline
          numberOfLines={2}
          style={[styles.input, styles.notesInput]}
          maxLength={500}
        />

        {/* ─── Submit ─────────────────────────────────── */}
        <View style={styles.submitWrap}>
          <Button
            label="Save"
            onPress={handleSubmit}
            size="hero"
            fullWidth
            loading={submitting}
            disabled={!canSubmit}
            hapticPattern="confirm"
          />
        </View>
      </ScrollView>
    </BottomSheet>
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
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: Colors.saffron[50] },
  typeBtnText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semibold,
    color: Colors.ink[400],
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.saffron[50],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.saffron[200],
    minHeight: 76,
  },
  rupeeSign: {
    fontFamily: FontFamily.mono,
    fontSize: 36,
    fontWeight: FontWeight.heavy,
    color: Colors.saffron[600],
  },
  amountInput: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: 36,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    padding: 0,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    minHeight: TouchTarget.badhiya,
  },
  notesInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  submitWrap: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
