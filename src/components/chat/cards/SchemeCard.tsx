/**
 * SchemeCard — generative card for the scheme_match intent.
 *
 * Fetches matched government schemes from the backend (which scores
 * each scheme against the business profile) and renders the top 3
 * with match %, max amount, subsidy, and category.
 *
 * Each scheme is its own gradient card (saffron / green / blue) for
 * visual variety. Tap navigates to a scheme detail screen (Phase 8).
 */

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Building2, Award, ChevronRight } from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@theme';
import { useSchemeMatches } from '@/features/businesses/hooks';
import { useCurrency } from '@/hooks/useCurrency';
import { Skeleton } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import type { SchemeMatch } from '@/features/businesses/schemas';

interface Props {
  responseText: string | null;
}

const GRADIENTS = [
  { start: Colors.saffron[500], end: Colors.saffron[600], badge: Colors.white },
  { start: Colors.profit[500], end: Colors.profit[700], badge: Colors.white },
  { start: Colors.trust[500], end: Colors.trust[700], badge: Colors.white },
];

export function SchemeCard({ responseText }: Props) {
  const schemesQ = useSchemeMatches();
  const schemes = schemesQ.data ?? [];

  // Sort by match score, take top 3
  const top3 = [...schemes]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.iconBg}>
            <Building2 color={Colors.trust[500]} size={18} strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>Sarkari Yojana</Text>
          {top3.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{top3.length} eligible</Text>
            </View>
          )}
        </View>

        {schemesQ.isLoading ? (
          <View style={{ gap: Spacing.sm }}>
            <Skeleton height={80} radius={12} />
            <Skeleton height={80} radius={12} />
          </View>
        ) : top3.length === 0 ? (
          <Text style={styles.emptyText}>
            Koi scheme nahi mili. GST add karne se aur options khulenge.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {top3.map((s, i) => (
              <SchemeMiniCard
                key={s.id}
                scheme={s}
                gradient={GRADIENTS[i % GRADIENTS.length]!}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {responseText && <Text style={styles.responseText}>{responseText}</Text>}
    </View>
  );
}

// ─── Single scheme card ──────────────────────────────────
function SchemeMiniCard({
  scheme,
  gradient,
}: {
  scheme: SchemeMatch;
  gradient: { start: string; end: string; badge: string };
}) {
  const { format } = useCurrency();

  return (
    <Pressable
      onPress={() => haptic('tap')}
      style={({ pressed }) => [
        styles.miniCard,
        { backgroundColor: gradient.start },
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.miniHeader}>
        <View style={styles.matchBadge}>
          <Award color={Colors.saffron[600]} size={12} strokeWidth={2.6} />
          <Text style={styles.matchText}>{scheme.matchScore}% match</Text>
        </View>
      </View>
      <Text style={styles.miniName} numberOfLines={1}>
        {scheme.name}
      </Text>
      {scheme.nameHi && (
        <Text style={styles.miniNameHi} numberOfLines={1}>
          {scheme.nameHi}
        </Text>
      )}
      {scheme.maxAmount && scheme.maxAmount > 0 && (
        <Text style={styles.miniAmount}>Up to {format(scheme.maxAmount)}</Text>
      )}
      {scheme.subsidy && (
        <Text style={styles.miniSubsidy} numberOfLines={1}>
          {scheme.subsidy}
        </Text>
      )}
      <View style={styles.miniFooter}>
        <Text style={styles.miniCategory}>
          {scheme.category ?? 'General'}
        </Text>
        <ChevronRight color={Colors.white} size={16} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  headerCard: {
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
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.trust[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  countPill: {
    backgroundColor: Colors.profit[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  countText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.profit[700],
    fontWeight: FontWeight.bold,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  cardsRow: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  miniCard: {
    width: 220,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.md,
  },
  miniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  matchText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.saffron[600],
    fontWeight: FontWeight.bold,
  },
  miniName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  miniNameHi: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  miniAmount: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.body,
    fontWeight: FontWeight.heavy,
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  miniSubsidy: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  miniFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  miniCategory: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.bold,
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
