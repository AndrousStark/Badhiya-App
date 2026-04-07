/**
 * StockUpdateSheet — quick +/- adjustments for a product.
 *
 * Opened by tapping a product card on the Dukan tab. Shows current
 * stock prominently, then large +/- buttons + a free-form quantity
 * field. Submits a delta via PATCH /inventory/products/:id/stock.
 *
 *   Current: 12  →  After: 7  ✓ Save
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Plus, Minus, Package } from 'lucide-react-native';

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
import { haptic } from '@/lib/haptics';
import { useUpdateStock } from '@/features/products/hooks';
import { updateStockSchema } from '@/features/products/schemas';

export interface StockUpdateProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentStock: number;
  lowStockThreshold: number;
}

const QUICK_DELTAS = [-10, -5, -1, +1, +5, +10];

export function StockUpdateSheet({
  visible,
  onClose,
  productId,
  productName,
  currentStock,
  lowStockThreshold,
}: StockUpdateProps) {
  const [delta, setDelta] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const updateMut = useUpdateStock(productId);

  useEffect(() => {
    if (visible) {
      setDelta(0);
      setError(null);
    }
  }, [visible]);

  const newStock = Math.max(0, currentStock + delta);
  const willBeLow = newStock <= lowStockThreshold;
  const willBeOut = newStock <= 0;
  const canSubmit = delta !== 0 && !updateMut.isPending;

  function adjust(d: number) {
    haptic('select');
    setDelta((curr) => curr + d);
  }

  function setDeltaDirect(text: string) {
    const sign = text.startsWith('-') ? -1 : 1;
    const num = parseInt(text.replace(/\D/g, ''), 10);
    if (isNaN(num)) {
      setDelta(0);
      return;
    }
    setDelta(num * sign);
  }

  async function handleSubmit() {
    setError(null);
    const parsed = updateStockSchema.safeParse({ quantityChange: delta });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid quantity');
      return;
    }
    try {
      await updateMut.mutateAsync(parsed.data);
      onClose();
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Failed to update');
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>{productName}</Text>
      <Text style={styles.subtitle}>Stock update karo</Text>

      {/* ─── Current → After preview ───────────────── */}
      <View style={styles.previewCard}>
        <View style={styles.previewSide}>
          <Text style={styles.previewLabel}>Current</Text>
          <Text style={styles.previewValue}>{currentStock}</Text>
        </View>
        <View style={styles.previewArrow}>
          <Package color={Colors.saffron[500]} size={24} strokeWidth={2.2} />
        </View>
        <View style={styles.previewSide}>
          <Text style={styles.previewLabel}>After</Text>
          <Text
            style={[
              styles.previewValue,
              willBeOut && styles.previewValueOut,
              !willBeOut && willBeLow && styles.previewValueLow,
            ]}
          >
            {newStock}
          </Text>
          {willBeOut && <Text style={styles.warnText}>Stock khatam!</Text>}
          {!willBeOut && willBeLow && (
            <Text style={styles.warnText}>Low stock</Text>
          )}
        </View>
      </View>

      {/* ─── Quick delta chips ─────────────────────── */}
      <Text style={styles.label}>Quick adjust</Text>
      <View style={styles.deltaRow}>
        {QUICK_DELTAS.map((d) => (
          <Pressable
            key={d}
            onPress={() => adjust(d)}
            style={({ pressed }) => [
              styles.deltaChip,
              d > 0 && styles.deltaChipPlus,
              d < 0 && styles.deltaChipMinus,
              pressed && styles.deltaChipPressed,
            ]}
          >
            <Text
              style={[
                styles.deltaText,
                d > 0 && styles.deltaTextPlus,
                d < 0 && styles.deltaTextMinus,
              ]}
            >
              {d > 0 ? `+${d}` : d}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ─── Big +/- buttons + manual entry ────────── */}
      <View style={styles.bigControls}>
        <Pressable
          onPress={() => adjust(-1)}
          style={({ pressed }) => [
            styles.bigBtn,
            styles.bigBtnMinus,
            pressed && styles.bigBtnPressed,
          ]}
          accessibilityLabel="Decrease stock by 1"
        >
          <Minus color={Colors.white} size={28} strokeWidth={3} />
        </Pressable>

        <View style={styles.deltaInputWrap}>
          <Text style={styles.deltaInputLabel}>Change</Text>
          <TextInput
            value={delta === 0 ? '' : String(delta)}
            onChangeText={setDeltaDirect}
            placeholder="0"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="number-pad"
            style={[
              styles.deltaInput,
              delta > 0 && styles.deltaInputPlus,
              delta < 0 && styles.deltaInputMinus,
            ]}
            testID="stock-delta"
          />
        </View>

        <Pressable
          onPress={() => adjust(1)}
          style={({ pressed }) => [
            styles.bigBtn,
            styles.bigBtnPlus,
            pressed && styles.bigBtnPressed,
          ]}
          accessibilityLabel="Increase stock by 1"
        >
          <Plus color={Colors.white} size={28} strokeWidth={3} />
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.submitWrap}>
        <Button
          label="Save · Stock update"
          onPress={handleSubmit}
          size="hero"
          fullWidth
          loading={updateMut.isPending}
          disabled={!canSubmit}
          hapticPattern="confirm"
          testID="stock-update-submit"
        />
      </View>
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
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.saffron[50],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  previewSide: { flex: 1, alignItems: 'center' },
  previewArrow: { width: 40, alignItems: 'center' },
  previewLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewValue: {
    fontFamily: FontFamily.mono,
    fontSize: 36,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    marginTop: 4,
  },
  previewValueLow: { color: Colors.warning[500] },
  previewValueOut: { color: Colors.loss[500] },
  warnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.loss[500],
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  deltaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  deltaChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minWidth: 56,
    alignItems: 'center',
  },
  deltaChipPlus: { borderColor: Colors.profit[400] },
  deltaChipMinus: { borderColor: Colors.loss[500] },
  deltaChipPressed: { transform: [{ scale: 0.95 }] },
  deltaText: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
  },
  deltaTextPlus: { color: Colors.profit[500] },
  deltaTextMinus: { color: Colors.loss[500] },

  bigControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  bigBtn: {
    width: TouchTarget.heroCTA,
    height: TouchTarget.heroCTA,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBtnPlus: { backgroundColor: Colors.profit[500] },
  bigBtnMinus: { backgroundColor: Colors.loss[500] },
  bigBtnPressed: { opacity: 0.85 },
  deltaInputWrap: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  deltaInputLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deltaInput: {
    fontFamily: FontFamily.mono,
    fontSize: 24,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    padding: 0,
    textAlign: 'center',
    minWidth: 60,
  },
  deltaInputPlus: { color: Colors.profit[500] },
  deltaInputMinus: { color: Colors.loss[500] },
  errorText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
    marginTop: Spacing.md,
  },
  submitWrap: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
});
