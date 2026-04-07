/**
 * Badge — small status indicator.
 *
 * Tones:
 *   profit   — green (paid, healthy)
 *   loss     — red (overdue, urgent)
 *   warning  — amber (aging)
 *   saffron  — brand (new, featured)
 *   trust    — blue (info)
 *   neutral  — gray (default)
 */

import { Text, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, FontFamily, FontWeight, Spacing, Radius } from '@theme';

type Tone = 'profit' | 'loss' | 'warning' | 'saffron' | 'trust' | 'neutral';

interface Props {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'neutral', style }: Props) {
  return (
    <View style={[styles.base, toneStyles[tone].base, style]}>
      <Text style={[styles.label, toneStyles[tone].text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const toneStyles: Record<Tone, { base: ViewStyle; text: { color: string } }> = {
  profit: {
    base: { backgroundColor: Colors.profit[50] },
    text: { color: Colors.profit[700] },
  },
  loss: {
    base: { backgroundColor: Colors.loss[50] },
    text: { color: Colors.loss[500] },
  },
  warning: {
    base: { backgroundColor: Colors.warning[50] },
    text: { color: Colors.warning[700] },
  },
  saffron: {
    base: { backgroundColor: Colors.saffron[50] },
    text: { color: Colors.saffron[600] },
  },
  trust: {
    base: { backgroundColor: Colors.trust[50] },
    text: { color: Colors.trust[700] },
  },
  neutral: {
    base: { backgroundColor: Colors.surfaceMuted },
    text: { color: Colors.ink[500] },
  },
};
