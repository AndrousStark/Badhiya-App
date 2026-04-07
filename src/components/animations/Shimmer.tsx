/**
 * Shimmer — saffron-tinted loading placeholder.
 *
 * A translucent gradient slides left→right across a colored base.
 * Used inside the Skeleton component. Never gray — gray feels broken
 * on our warm-white background.
 *
 * Requires expo-linear-gradient.
 */

import { useEffect } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Radius } from '@theme';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Shimmer({
  width = '100%',
  height = 20,
  radius = Radius.sm,
  style,
}: Props) {
  const translate = useSharedValue(-1);

  useEffect(() => {
    translate.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [translate]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${translate.value * 100}%` }],
  }));

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius: radius },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            Colors.saffron[100],
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.saffron[50],
    overflow: 'hidden',
  },
});
