/**
 * TypingBubble — assistant loading state.
 *
 * Three dots that pulse with staggered delays via Reanimated.
 * Renders inside a left-aligned assistant bubble for visual continuity.
 */

import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { Colors, Spacing, Radius } from '@theme';

const DOT_DURATION = 600;

export function TypingBubble() {
  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Dot delay={0} />
        <Dot delay={200} />
        <Dot delay={400} />
      </View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: DOT_DURATION, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: DOT_DURATION, easing: Easing.inOut(Easing.ease) }),
        ),
      ),
      -1,
      false,
    );
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    borderBottomLeftRadius: Radius.sm,
    minWidth: 64,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.saffron[500],
  },
});
