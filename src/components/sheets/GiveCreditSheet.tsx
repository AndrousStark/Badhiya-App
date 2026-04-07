/**
 * GiveCreditSheet — record udhar given to a customer.
 *
 * Form fields:
 *   - customer name (required, find-or-create on backend)
 *   - phone (optional but enables WhatsApp reminders later)
 *   - amount (required, > 0)
 *   - description (optional, what was sold)
 *
 * Submits via useGiveCredit mutation. On success closes the sheet
 * and invalidates customer queries so the Khata list updates instantly.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { User, Phone, Tag } from 'lucide-react-native';

import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  TouchTarget,
} from '@theme';
import { useGiveCredit } from '@/features/customers/hooks';
import { giveCreditSchema } from '@/features/customers/schemas';

export interface GiveCreditProps {
  visible: boolean;
  onClose: () => void;
  /** Pre-fill customer name when opening from a customer detail page. */
  initialCustomerName?: string;
  initialCustomerPhone?: string;
}

export function GiveCreditSheet({
  visible,
  onClose,
  initialCustomerName,
  initialCustomerPhone,
}: GiveCreditProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const giveMut = useGiveCredit();

  useEffect(() => {
    if (visible) {
      setName(initialCustomerName ?? '');
      setPhone(initialCustomerPhone?.replace(/^\+91/, '') ?? '');
      setAmount('');
      setDescription('');
      setError(null);
    }
  }, [visible, initialCustomerName, initialCustomerPhone]);

  const amountNum = parseFloat(amount);
  const canSubmit =
    name.trim().length >= 2 && !isNaN(amountNum) && amountNum > 0 && !giveMut.isPending;

  async function handleSubmit() {
    setError(null);
    const parsed = giveCreditSchema.safeParse({
      customerName: name.trim(),
      customerPhone: phone.trim() || undefined,
      amount: amountNum,
      description: description.trim() || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your inputs');
      return;
    }
    try {
      await giveMut.mutateAsync(parsed.data);
      onClose();
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Failed to save');
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Udhaar dijiye</Text>
        <Text style={styles.subtitle}>Customer ka naam aur amount daalo</Text>

        {/* ─── Customer name ─────────────────────── */}
        <Text style={styles.label}>Customer name</Text>
        <View style={styles.inputWrap}>
          <User color={Colors.saffron[500]} size={20} strokeWidth={2.2} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ravi Sharma"
            placeholderTextColor={Colors.ink[300]}
            autoCapitalize="words"
            autoFocus
            maxLength={120}
            style={styles.input}
            testID="give-credit-name"
          />
        </View>

        {/* ─── Phone (optional) ──────────────────── */}
        <Text style={styles.label}>Phone (optional, but recommended)</Text>
        <View style={styles.inputWrap}>
          <Phone color={Colors.ink[400]} size={20} strokeWidth={2.2} />
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
            placeholder="93197 88556"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
            testID="give-credit-phone"
          />
        </View>

        {/* ─── Amount ────────────────────────────── */}
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountWrap}>
          <Text style={styles.rupeeSign}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="decimal-pad"
            style={styles.amountInput}
            testID="give-credit-amount"
          />
        </View>

        {/* ─── Description (optional) ────────────── */}
        <Text style={styles.label}>Kya diya? (optional)</Text>
        <View style={styles.inputWrap}>
          <Tag color={Colors.ink[400]} size={20} strokeWidth={2.2} />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="5 kg atta + 2 kg dal"
            placeholderTextColor={Colors.ink[300]}
            maxLength={500}
            style={styles.input}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.submitWrap}>
          <Button
            label="Save · Udhaar diya"
            onPress={handleSubmit}
            size="hero"
            fullWidth
            loading={giveMut.isPending}
            disabled={!canSubmit}
            hapticPattern="confirm"
            testID="give-credit-submit"
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: TouchTarget.badhiya,
  },
  prefix: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    padding: 0,
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
