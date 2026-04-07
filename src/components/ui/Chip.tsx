/**
 * Chip — filter/toggle chip used in lists (Khata filters, product categories).
 *
 * Active: saffron fill, white text.
 * Inactive: white fill, warm border, ink text.
 */

import { Pressable, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, Radius } from '@theme';
import { haptic } from '@/lib/haptics';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, active = false, onPress, count, style }: Props) {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          haptic('select');
          onPress();
        }
      }}
      style={({ pressed }) => [
        styles.base,
        active ? styles.active : styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          styles.label,
          active ? styles.labelActive : styles.labelInactive,
        ]}
        numberOfLines={1}
      >
        {label}
        {count !== undefined ? ` · ${count}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  active: {
    backgroundColor: Colors.saffron[500],
    borderColor: Colors.saffron[500],
  },
  inactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderStrong,
  },
  pressed: { opacity: 0.85 },
  label: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semibold,
  },
  labelActive: { color: Colors.white },
  labelInactive: { color: Colors.ink[700] },
});
