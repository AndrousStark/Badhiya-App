/**
 * TxnRow — one transaction in a list.
 *
 * WhatsApp-style row: avatar (initial or icon) + primary name + meta +
 * amount. Amount color-coded (green for positive, red for negative).
 *
 * Tappable with haptic feedback. Press-opacity for feedback.
 */

import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, Radius } from '@theme';
import { haptic } from '@/lib/haptics';

type TxnType = 'sale' | 'expense' | 'payment';

interface Props {
  name: string;
  meta: string;
  amount: number;
  type: TxnType;
  onPress?: () => void;
}

const AVATAR_BG: Record<TxnType, string> = {
  sale: Colors.saffron[50],
  payment: Colors.profit[50],
  expense: Colors.loss[50],
};

const AVATAR_FG: Record<TxnType, string> = {
  sale: Colors.saffron[600],
  payment: Colors.profit[500],
  expense: Colors.loss[500],
};

function formatAmount(n: number): string {
  return n.toLocaleString('en-IN');
}

export function TxnRow({ name, meta, amount, type, onPress }: Props) {
  const positive = type !== 'expense';
  const initial = name.charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          haptic('tap');
          onPress();
        }
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: AVATAR_BG[type] },
        ]}
      >
        <Text style={[styles.avatarText, { color: AVATAR_FG[type] }]}>
          {initial}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          positive ? styles.amountPos : styles.amountNeg,
        ]}
      >
        {positive ? '+' : '−'}₹{formatAmount(Math.abs(amount))}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowPressed: { opacity: 0.7 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.ink[900],
  },
  meta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 2,
  },
  amount: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
  },
  amountPos: { color: Colors.profit[500] },
  amountNeg: { color: Colors.loss[500] },
});
