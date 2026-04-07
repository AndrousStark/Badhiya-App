/**
 * Card — generic content container.
 *
 * Variants:
 *   elevated — white fill, warm border, subtle shadow (default)
 *   flat     — white fill, warm border, no shadow
 *   warm     — saffron-50 fill, no border (hero tiles)
 *   profit   — green-50 fill with thin green border
 *   loss     — red-50 fill with thin red border
 *   warning  — amber-50 fill
 */

import { ReactNode } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';

import { Colors, Spacing, Radius, Shadow } from '@theme';
import { haptic } from '@/lib/haptics';

type Variant = 'elevated' | 'flat' | 'warm' | 'profit' | 'loss' | 'warning' | 'trust';

interface Props {
  children: ReactNode;
  variant?: Variant;
  padding?: keyof typeof Spacing;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'lg',
  onPress,
  style,
  testID,
}: Props) {
  const base = [
    styles.base,
    { padding: Spacing[padding] },
    variantStyles[variant],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          haptic('tap');
          onPress();
        }}
        style={({ pressed }) => [base, pressed && styles.pressed]}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={base} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  elevated: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  flat: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  warm: {
    backgroundColor: Colors.saffron[50],
  },
  profit: {
    backgroundColor: Colors.profit[50],
    borderWidth: 1,
    borderColor: Colors.profit[400],
  },
  loss: {
    backgroundColor: Colors.loss[50],
    borderWidth: 1,
    borderColor: Colors.loss[500],
  },
  warning: {
    backgroundColor: Colors.warning[50],
    borderWidth: 1,
    borderColor: Colors.warning[500],
  },
  trust: {
    backgroundColor: Colors.trust[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.trust[500],
  },
};
