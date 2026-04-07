/**
 * Stepper — wizard progress indicator.
 *
 * N saffron dots, current one filled, completed ones green,
 * pending ones warm-border outline. Animated transition between states.
 *
 *  ● ● ● ○    (step 3 of 4, 2 completed)
 */

import { View, Text, StyleSheet } from 'react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '@/theme';

interface Props {
  total: number;
  current: number; // 1-indexed
  label?: string;
}

export function Stepper({ total, current, label }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => {
          const step = i + 1;
          const isCompleted = step < current;
          const isCurrent = step === current;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                isCompleted && styles.dotCompleted,
                isCurrent && styles.dotCurrent,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.label}>
        {label ?? `Step ${current} of ${total}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dot: {
    width: 24,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
  },
  dotCompleted: { backgroundColor: Colors.profit[500] },
  dotCurrent: { backgroundColor: Colors.saffron[500], width: 32 },
  label: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semibold,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
