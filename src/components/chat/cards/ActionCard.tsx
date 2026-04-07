/**
 * ActionCard — generic card with a CTA button.
 *
 * Used when the AI returns a recordable intent (record_sale, record_expense,
 * give_credit) — the user is in the chat screen, so we don't auto-open the
 * sheet. Instead we show a card that says "Open record sheet" and the user
 * confirms.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@theme';
import { Button } from '@/components/ui';

interface Props {
  responseText: string | null;
  intent: string;
  onAction?: (intent: string) => void;
}

const INTENT_LABELS: Record<
  string,
  { title: string; cta: string; emoji: string }
> = {
  record_sale: {
    title: 'Bikri record karein',
    cta: 'Open record sheet',
    emoji: '💰',
  },
  record_expense: {
    title: 'Kharcha record karein',
    cta: 'Open record sheet',
    emoji: '🧾',
  },
  give_credit: {
    title: 'Udhaar dijiye',
    cta: 'Open Khata',
    emoji: '📒',
  },
  scheme_match: {
    title: 'Sarkari scheme match',
    cta: 'Schemes dekho',
    emoji: '🏛️',
  },
  loan_match: {
    title: 'Loan match',
    cta: 'Loans dekho',
    emoji: '💳',
  },
};

export function ActionCard({ responseText, intent, onAction }: Props) {
  const config = INTENT_LABELS[intent] ?? {
    title: 'AI Suggestion',
    cta: 'Continue',
    emoji: '✨',
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.emoji}>{config.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{config.title}</Text>
            {responseText && (
              <Text style={styles.body} numberOfLines={3}>
                {responseText}
              </Text>
            )}
          </View>
        </View>
        <Button
          label={config.cta}
          onPress={() => onAction?.(intent)}
          size="md"
          fullWidth
          rightIcon={
            <ArrowRight color={Colors.white} size={16} strokeWidth={2.6} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.saffron[300],
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  emoji: { fontSize: 32 },
  title: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    marginTop: 4,
    lineHeight: 20,
  },
});
