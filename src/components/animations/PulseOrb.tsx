/**
 * PulseOrb — a breathing circle used for AI listening/thinking states.
 *
 * Saffron glow with a subtle 4% scale oscillation and opacity pulse.
 * Runs on the UI thread via Reanimated 4, zero JS re-renders.
 *
 * Usage:
 *   <PulseOrb size={60} color={Colors.saffron[500]} />
 *   <PulseOrb size={22} color={Colors.white} />  // inside AiPill
 */

import { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '@theme';

interface Props {
  size?: number;
  color?: string;
  duration?: number;
  style?: ViewStyle;
}

export function PulseOrb({
  size = 60,
  color = Colors.saffron[500],
  duration = 1400,
  style,
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.9);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 2 }),
        withTiming(0.7, { duration: duration / 2 }),
      ),
      -1,
      false,
    );
  }, [duration, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
        style,
      ]}
    />
  );
}
