/**
 * AddProductSheet — record a new inventory item.
 *
 * Opened from:
 *   - Dukan tab + FAB (empty form)
 *   - Dukan tab camera FAB → barcode scan → pre-filled barcode
 *
 * Fields:
 *   - Name (required, 2-120 chars)
 *   - Category chip (8 kirana-friendly options with emojis)
 *   - Selling price (saffron mega input)
 *   - Cost price (smaller, optional, for margin calc)
 *   - Stock quantity (optional, defaults to 0)
 *   - Barcode (optional, pre-filled if scanned)
 *
 * Submits via useAddProduct, closes on success.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { Tag, Hash, ShoppingBag, Layers, Mic } from 'lucide-react-native';

import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui';
import { useSheets } from './SheetProvider';
import { haptic } from '@/lib/haptics';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  TouchTarget,
} from '@theme';
import { useAddProduct } from '@/features/products/hooks';
import {
  addProductSchema,
  productCategories,
  type ProductCategory,
} from '@/features/products/schemas';

export interface AddProductProps {
  visible: boolean;
  onClose: () => void;
  /** Pre-fill from a barcode scan */
  initialBarcode?: string;
  /** Pre-fill product name (e.g., from a barcode lookup service) */
  initialName?: string;
}

export function AddProductSheet({
  visible,
  onClose,
  initialBarcode,
  initialName,
}: AddProductProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('grocery');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [justSavedName, setJustSavedName] = useState<string | null>(null);

  const addMut = useAddProduct();
  const { openVoice } = useSheets();

  function handleVoiceName() {
    haptic('voiceStart');
    openVoice({
      onConfirm: (parsed) => {
        // Use the raw transcript as the product name. NLU may have stripped
        // type/amount keywords; pull from item field if it's longer than raw,
        // otherwise use raw text.
        const candidate = parsed.item && parsed.item.length > 3 ? parsed.item : parsed.raw;
        setName(candidate);
        // If user said an amount, use it as price
        if (parsed.amount && parsed.amount > 0) {
          setPrice(String(parsed.amount));
        }
      },
    });
  }

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setBarcode(initialBarcode ?? '');
      setCategory('grocery');
      setPrice('');
      setCostPrice('');
      setStock('');
      setError(null);
      setSessionCount(0);
      setJustSavedName(null);
    }
  }, [visible, initialBarcode, initialName]);

  const priceNum = parseFloat(price);
  const costNum = parseFloat(costPrice);
  const stockNum = parseInt(stock, 10);
  const margin =
    !isNaN(priceNum) && !isNaN(costNum) && costNum > 0 && priceNum > costNum
      ? Math.round(((priceNum - costNum) / priceNum) * 100)
      : null;

  const canSubmit =
    name.trim().length >= 2 &&
    !isNaN(priceNum) &&
    priceNum > 0 &&
    !addMut.isPending;

  async function handleSubmit(opts: { keepOpen?: boolean } = {}) {
    setError(null);
    const parsed = addProductSchema.safeParse({
      name: name.trim(),
      category,
      price: priceNum,
      costPrice: !isNaN(costNum) ? costNum : undefined,
      stockQuantity: !isNaN(stockNum) ? stockNum : 0,
      barcode: barcode.trim() || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your inputs');
      return;
    }
    try {
      await addMut.mutateAsync(parsed.data);
      if (opts.keepOpen) {
        // Keep category + cost + price as sensible defaults for the
        // next item in a bulk-entry session. Clear only what almost
        // always differs: name, stock qty, and the scanned barcode.
        setJustSavedName(parsed.data.name);
        setSessionCount((c) => c + 1);
        setName('');
        setBarcode('');
        setStock('');
      } else {
        onClose();
      }
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Failed to save');
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Naya saamaan</Text>
        <Text style={styles.subtitle}>
          {initialBarcode
            ? `Barcode: ${initialBarcode} · Details bharo`
            : 'Product details bharo'}
        </Text>

        {sessionCount > 0 && justSavedName ? (
          <View style={styles.sessionPill} accessibilityLiveRegion="polite">
            <Text style={styles.sessionPillText}>
              ✓ "{justSavedName}" add ho gaya · {sessionCount} is session mein
            </Text>
          </View>
        ) : null}

        {/* ─── Name + voice mic ─────────────────────── */}
        <Text style={styles.label}>Naam</Text>
        <View style={styles.inputWrap}>
          <ShoppingBag color={Colors.saffron[500]} size={20} strokeWidth={2.2} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Aashirvaad Atta 5kg"
            placeholderTextColor={Colors.ink[300]}
            autoCapitalize="words"
            autoFocus={!initialName}
            maxLength={120}
            style={styles.input}
            testID="add-product-name"
          />
          <Pressable
            onPress={handleVoiceName}
            style={({ pressed }) => [
              styles.micBtn,
              pressed && styles.micBtnPressed,
            ]}
            accessibilityLabel="Speak product name"
          >
            <Mic color={Colors.white} size={16} strokeWidth={2.4} />
          </Pressable>
        </View>
        <Text style={styles.helper}>
          Mic dabake bolo: "atta panch kilo do sau assi rupaye"
        </Text>

        {/* ─── Category chips ─────────────────────── */}
        <Text style={styles.label}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {productCategories.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setCategory(c.value)}
                style={[styles.catChip, active && styles.catChipActive]}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={[styles.catLabel, active && styles.catLabelActive]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ─── Selling price ──────────────────────── */}
        <Text style={styles.label}>Selling price</Text>
        <View style={styles.amountWrap}>
          <Text style={styles.rupeeSign}>₹</Text>
          <TextInput
            value={price}
            onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="decimal-pad"
            style={styles.amountInput}
            testID="add-product-price"
          />
        </View>

        {/* ─── Cost price + margin preview ─────────── */}
        <Text style={styles.label}>Cost price (optional)</Text>
        <View style={styles.inputWrap}>
          <Tag color={Colors.ink[400]} size={20} strokeWidth={2.2} />
          <Text style={styles.rupeeSmall}>₹</Text>
          <TextInput
            value={costPrice}
            onChangeText={(v) => setCostPrice(v.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="decimal-pad"
            style={styles.input}
            testID="add-product-cost"
          />
          {margin !== null && (
            <View style={styles.marginPill}>
              <Text style={styles.marginText}>{margin}% margin</Text>
            </View>
          )}
        </View>

        {/* ─── Stock + barcode in two columns ─────── */}
        <View style={styles.twoCol}>
          <View style={styles.colHalf}>
            <Text style={styles.label}>Stock</Text>
            <View style={styles.inputWrap}>
              <Layers color={Colors.ink[400]} size={20} strokeWidth={2.2} />
              <TextInput
                value={stock}
                onChangeText={(v) => setStock(v.replace(/\D/g, ''))}
                placeholder="0"
                placeholderTextColor={Colors.ink[300]}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>
          <View style={styles.colHalf}>
            <Text style={styles.label}>Barcode</Text>
            <View style={styles.inputWrap}>
              <Hash color={Colors.ink[400]} size={20} strokeWidth={2.2} />
              <TextInput
                value={barcode}
                onChangeText={setBarcode}
                placeholder="optional"
                placeholderTextColor={Colors.ink[300]}
                keyboardType="number-pad"
                maxLength={20}
                style={styles.input}
              />
            </View>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.submitWrap}>
          <Button
            label="Save · Saamaan add karo"
            onPress={() => handleSubmit()}
            size="hero"
            fullWidth
            loading={addMut.isPending}
            disabled={!canSubmit}
            hapticPattern="confirm"
            testID="add-product-submit"
          />
          <Pressable
            onPress={() => handleSubmit({ keepOpen: true })}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.addAnotherBtn,
              !canSubmit && styles.addAnotherDisabled,
              pressed && styles.addAnotherPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save and add another product"
            testID="add-product-save-another"
          >
            <Text
              style={[
                styles.addAnotherText,
                !canSubmit && styles.addAnotherTextDisabled,
              ]}
            >
              Save · Aur ek add karo
            </Text>
          </Pressable>
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
  input: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    padding: 0,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnPressed: { backgroundColor: Colors.saffron[600] },
  helper: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
    fontStyle: 'italic',
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
  rupeeSmall: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
  },
  amountInput: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: 36,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    padding: 0,
  },
  catRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.saffron[500],
    borderColor: Colors.saffron[500],
  },
  catEmoji: { fontSize: 16 },
  catLabel: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semibold,
    color: Colors.ink[700],
  },
  catLabelActive: { color: Colors.white },
  twoCol: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  colHalf: { flex: 1 },
  marginPill: {
    backgroundColor: Colors.profit[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  marginText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    color: Colors.profit[700],
    fontWeight: FontWeight.bold,
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
  addAnotherBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  addAnotherPressed: { backgroundColor: Colors.saffron[50] },
  addAnotherDisabled: { borderColor: Colors.ink[300] },
  addAnotherText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.saffron[600],
  },
  addAnotherTextDisabled: { color: Colors.ink[300] },
  sessionPill: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.profit[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.profit[500],
  },
  sessionPillText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semibold,
    color: Colors.profit[700],
  },
});
