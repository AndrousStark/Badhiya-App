/**
 * MenuCard — generative card for the show_menu intent.
 *
 * Shows the AI's capabilities as tappable chips. Each tap injects
 * the example query as a new user message (handled by the parent
 * via the onExample callback).
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@theme';
import { haptic } from '@/lib/haptics';

interface Props {
  responseText: string | null;
  onExample?: (query: string) => void;
}

const CAPABILITIES = [
  { emoji: '💰', label: 'P&L', example: 'aaj kitna kamaya?' },
  { emoji: '🏆', label: 'Score', example: 'mera score kya hai?' },
  { emoji: '📦', label: 'Stock', example: 'kya stock kam hai?' },
  { emoji: '🏛️', label: 'Schemes', example: 'PMEGP scheme batao' },
  { emoji: '💳', label: 'Loans', example: 'mujhe loan chahiye' },
  { emoji: '📈', label: 'Tips', example: 'business kaise badhaun?' },
];

export function MenuCard({ responseText, onExample }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Sparkles color={Colors.saffron[600]} size={18} strokeWidth={2.4} />
          <Text style={styles.title}>Main yeh sab kar sakta hoon</Text>
        </View>

        <View style={styles.grid}>
          {CAPABILITIES.map((cap) => (
            <Pressable
              key={cap.label}
              onPress={() => {
                haptic('tap');
                onExample?.(cap.example);
              }}
              style={({ pressed }) => [
                styles.tile,
                pressed && styles.tilePressed,
              ]}
            >
              <Text style={styles.tileEmoji}>{cap.emoji}</Text>
              <Text style={styles.tileLabel}>{cap.label}</Text>
              <Text style={styles.tileExample} numberOfLines={1}>
                "{cap.example}"
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {responseText && <Text style={styles.responseText}>{responseText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tile: {
    width: '47%',
    backgroundColor: Colors.saffron[50],
    borderWidth: 1,
    borderColor: Colors.saffron[200],
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  tilePressed: {
    backgroundColor: Colors.saffron[100],
    transform: [{ scale: 0.98 }],
  },
  tileEmoji: { fontSize: 24, marginBottom: 4 },
  tileLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  tileExample: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[500],
    marginTop: 2,
    fontStyle: 'italic',
  },
  responseText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    lineHeight: 20,
  },
});
