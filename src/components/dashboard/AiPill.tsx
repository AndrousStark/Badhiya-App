/**
 * AiPill — floating AI assistant entry, shown above the tab bar on Home.
 *
 * Saffron gradient pill with a pulsing orb and "Pucho Kuch Bhi" text.
 * Tapping it opens the full chat screen in Phase 7. For Phase 2 it
 * bounces to an unimplemented alert.
 */

import { Pressable, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, Radius, Shadow } from '@theme';
import { haptic } from '@/lib/haptics';
import { PulseOrb } from '../animations/PulseOrb';

interface Props {
  label?: string;
  hint?: string;
  onPress?: () => void;
}

export function AiPill({
  label = 'Pucho Kuch Bhi',
  hint = '"kal kitna kamaya?"',
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={() => {
        haptic('tap');
        onPress?.();
      }}
      style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
    >
      <LinearGradient
        colors={[Colors.saffron[400], Colors.saffron[500], Colors.saffron[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pill}
      >
        <PulseOrb size={22} color={Colors.white} />
        <View style={styles.textCol}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.hint}>{hint}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius['2xl'],
    ...Shadow.saffronGlow,
  },
  textCol: { flex: 1 },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  hint: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.saffron[50],
    marginTop: 1,
  },
  arrow: {
    fontSize: 24,
    color: Colors.white,
    opacity: 0.9,
    marginLeft: -Spacing.xs,
  },
});
