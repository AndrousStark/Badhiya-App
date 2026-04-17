/**
 * NumberTicker — animates a numeric value using Reanimated 4.
 *
 * Uses the TextInput `animatedProps.text` trick so we animate on the UI
 * thread without re-rendering the component tree. Digits roll up when
 * the value increases. Rupees are formatted with Indian digit grouping.
 *
 * Usage:
 *   <NumberTicker value={14200} prefix="₹" duration={800} />
 */

import { useEffect } from 'react';
import { TextInput, TextInputProps, StyleProp, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Colors, FontFamily, FontSize, FontWeight } from '@theme';

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  style?: StyleProp<TextStyle>;
  decimals?: number;
}

function formatIndian(n: number, decimals: number): string {
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function NumberTicker({
  value,
  prefix = '',
  suffix = '',
  duration = 800,
  style,
  decimals = 0,
}: Props) {
  const shared = useSharedValue(0);

  useEffect(() => {
    shared.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration, shared]);

  const animatedProps = useAnimatedProps(() => {
    const n = Math.max(0, shared.value);
    const text = `${prefix}${formatIndian(n, decimals)}${suffix}`;
    return { text, defaultValue: text } as unknown as TextInputProps;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={undefined}
      defaultValue={`${prefix}${formatIndian(0, decimals)}${suffix}`}
      animatedProps={animatedProps}
      style={[
        {
          fontFamily: FontFamily.mono,
          fontSize: FontSize.h2,
          fontWeight: FontWeight.heavy,
          color: Colors.ink[900],
          padding: 0,
          margin: 0,
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
