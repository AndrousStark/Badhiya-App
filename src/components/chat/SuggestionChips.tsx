/**
 * SuggestionChips — contextual follow-up questions after an assistant response.
 *
 * The chip set depends on the assistant message's intent:
 *   daily_pnl       → kal/hafte/month/top items
 *   health_score    → improve / loans / schemes
 *   check_stock     → top selling / add product / supplier
 *   show_menu       → (no chips, the menu IS the suggestions)
 *   scheme_match    → more schemes / loan / GST
 *   record_*        → undo / show today's totals
 *   general / null  → menu fallback chips
 *
 * Each chip tap injects the example as a new user message via the
 * onSuggestion callback.
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@theme';
import { haptic } from '@/lib/haptics';

interface Props {
  intent: string | undefined;
  onSuggestion: (query: string) => void;
}

const SUGGESTIONS_BY_INTENT: Record<string, string[]> = {
  daily_pnl: [
    'kal kitna kamaya?',
    'is hafte ka',
    'top selling kya hai?',
  ],
  health_score: [
    'score kaise badhe?',
    'loan eligible hoon?',
    'sarkari yojana batao',
  ],
  check_stock: [
    'sabse zyada bika kya?',
    'naya saamaan add karo',
    'low stock dikhao',
  ],
  scheme_match: [
    'aur schemes',
    'loan chahiye',
    'GST kaise lagega?',
  ],
  record_sale: [
    'aaj ka total batao',
    'recent sales',
    'munafa kitna hua?',
  ],
  record_expense: [
    'is hafte ka kharcha',
    'category-wise',
    'munafa hua ki nahi?',
  ],
  give_credit: [
    'kiska udhaar zyada hai?',
    'reminders bhejo',
    'overdue dikhao',
  ],
  general: [
    'aaj kitna kamaya?',
    'mera score?',
    'kya kar sakte ho?',
  ],
};

export function SuggestionChips({ intent, onSuggestion }: Props) {
  // No chips for menu (the menu card already shows them)
  if (intent === 'show_menu' || intent === 'error') return null;

  const suggestions =
    SUGGESTIONS_BY_INTENT[intent ?? 'general'] ??
    SUGGESTIONS_BY_INTENT.general!;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {suggestions.map((s, i) => (
        <Pressable
          key={`${s}-${i}`}
          onPress={() => {
            haptic('tap');
            onSuggestion(s);
          }}
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
        >
          <Text style={styles.chipText}>{s}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  chip: {
    backgroundColor: Colors.saffron[50],
    borderWidth: 1,
    borderColor: Colors.saffron[200],
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chipPressed: {
    backgroundColor: Colors.saffron[100],
    transform: [{ scale: 0.97 }],
  },
  chipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.micro,
    color: Colors.saffron[700],
  },
});
