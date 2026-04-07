/**
 * Button — primary CTA component.
 *
 * Variants:
 *   primary    — saffron gradient, white text, glow shadow (hero CTAs)
 *   secondary  — white fill, warm border, ink text
 *   ghost      — transparent, saffron text (inline actions)
 *   danger     — red fill, white text (destructive)
 *
 * Sizes:
 *   sm  — 40dp min (inline)
 *   md  — 48dp min (default, most buttons)
 *   lg  — 56dp min (Badhiya primary)
 *   hero — 64dp min (bottom-of-screen mega CTAs)
 *
 * Haptics fire automatically via the centralized service.
 */

import { ReactNode } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
  GestureResponderEvent,
} from 'react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  TouchTarget,
  Shadow,
} from '@theme';
import { haptic, type HapticPattern } from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'hero';

interface Props {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  hapticPattern?: HapticPattern;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const HEIGHT: Record<Size, number> = {
  sm: 40,
  md: TouchTarget.comfort,
  lg: TouchTarget.badhiya,
  hero: TouchTarget.heroCTA,
};

const HPAD: Record<Size, number> = {
  sm: Spacing.lg,
  md: Spacing.xl,
  lg: Spacing['2xl'],
  hero: Spacing['3xl'],
};

const LABEL_SIZE: Record<Size, number> = {
  sm: FontSize.caption,
  md: FontSize.label,
  lg: FontSize.label,
  hero: FontSize.body,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  hapticPattern = 'tap',
  accessibilityLabel,
  style,
  testID,
}: Props) {
  const isDisabled = disabled || loading;

  function handlePress(e: GestureResponderEvent) {
    if (isDisabled) return;
    haptic(hapticPattern);
    onPress(e);
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: HPAD[size],
        },
        fullWidth && styles.fullWidth,
        variantStyles[variant].base,
        pressed && !isDisabled && variantStyles[variant].pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles[variant].text.color}
        />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.labelBase,
              { fontSize: LABEL_SIZE[size] },
              variantStyles[variant].text,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center' },
  labelBase: {
    fontFamily: FontFamily.bodyBold,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
  },
  leftIcon: { marginRight: Spacing.sm },
  rightIcon: { marginLeft: Spacing.sm },
  disabled: { opacity: 0.5 },
});

const variantStyles: Record<
  Variant,
  { base: ViewStyle; pressed: ViewStyle; text: TextStyle }
> = {
  primary: {
    base: {
      backgroundColor: Colors.saffron[500],
      ...Shadow.saffronGlow,
    },
    pressed: { backgroundColor: Colors.saffron[600], opacity: 0.95 },
    text: { color: Colors.white },
  },
  secondary: {
    base: {
      backgroundColor: Colors.surface,
      borderWidth: 1.5,
      borderColor: Colors.borderStrong,
      ...Shadow.sm,
    },
    pressed: { backgroundColor: Colors.surfaceMuted },
    text: { color: Colors.ink[900] },
  },
  ghost: {
    base: {
      backgroundColor: 'transparent',
    },
    pressed: { backgroundColor: Colors.saffron[50] },
    text: { color: Colors.saffron[600] },
  },
  danger: {
    base: {
      backgroundColor: Colors.loss[500],
    },
    pressed: { backgroundColor: Colors.loss[700] },
    text: { color: Colors.white },
  },
};
