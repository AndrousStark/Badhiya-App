/**
 * FadeInUp — entry animation for screen sections.
 *
 * Fades in (0 → 1) and translates up (12dp → 0) with an optional
 * stagger delay. Used at the top of every screen to give content a
 * calm, warm entry instead of popping.
 *
 * Usage:
 *   <FadeInUp delay={0}>   <Header /> </FadeInUp>
 *   <FadeInUp delay={80}>  <KpiBento /> </FadeInUp>
 *   <FadeInUp delay={160}> <TxnList /> </FadeInUp>
 */

import { useEffect, ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface Props {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle;
}

export function FadeInUp({
  children,
  delay = 0,
  duration = 500,
  distance = 12,
  style,
}: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, duration, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}
