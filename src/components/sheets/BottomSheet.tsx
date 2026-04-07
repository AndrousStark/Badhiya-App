/**
 * BottomSheet — modal that slides up from the bottom.
 *
 * Built on React Native's Modal + Reanimated. No external dep.
 *
 * Features:
 *   - Backdrop tap to dismiss (with optional confirm)
 *   - Spring slide-up entry, smooth slide-down exit
 *   - SafeArea aware
 *   - Drag handle visual cue (no drag-to-dismiss yet — Phase 5)
 *   - KeyboardAvoiding (sheet pushes up when keyboard opens)
 *
 * Usage:
 *   <BottomSheet visible={open} onClose={() => setOpen(false)}>
 *     <Text>Sheet content</Text>
 *   </BottomSheet>
 */

import { ReactNode, useEffect } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { Colors, Radius, Spacing } from '@theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Disable backdrop tap to close (e.g., during a critical operation). */
  preventClose?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 180,
  mass: 0.6,
};

export function BottomSheet({
  visible,
  onClose,
  children,
  preventClose = false,
  contentStyle,
}: Props) {
  const translateY = useSharedValue(800);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING_CONFIG);
      backdropOpacity.value = withTiming(1, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateY.value = withTiming(800, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  function handleBackdropPress() {
    if (preventClose) return;
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        if (!preventClose) onClose();
      }}
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
            accessibilityLabel="Close sheet"
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kbWrap}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.sheet, sheetStyle, contentStyle]}>
            <SafeAreaView edges={['bottom']} style={styles.safe}>
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>
              {children}
            </SafeAreaView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 22, 17, 0.55)',
  },
  kbWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    maxHeight: '90%',
    shadowColor: Colors.ink[900],
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  safe: { paddingHorizontal: Spacing.xl },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.borderStrong,
  },
});
