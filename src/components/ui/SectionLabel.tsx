/**
 * SectionLabel — small uppercase label above a list or group of cards.
 *
 * Consistent across all screens. Optional trailing action (e.g., "See all").
 */

import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing } from '@theme';
import { haptic } from '@/lib/haptics';

interface Props {
  label: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionLabel({ label, actionLabel, onActionPress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {actionLabel && onActionPress ? (
        <Pressable
          onPress={() => {
            haptic('tap');
            onActionPress();
          }}
          hitSlop={8}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  action: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semibold,
    color: Colors.saffron[600],
  },
});
