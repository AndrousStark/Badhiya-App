/**
 * Government Schemes — full list of matched schemes for the business.
 *
 * Reuses the existing useSchemeMatches hook from features/businesses
 * (added in Phase 7 deep finish). Each scheme is a tappable card with
 * gradient background, match score badge, max amount, subsidy.
 *
 * For Phase 8 the "Apply" button just shows an alert. A real apply
 * flow needs backend changes (link to actual scheme portal URLs +
 * per-scheme document collection) — Phase 8.5.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Award, ChevronRight, Building2 } from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@/theme';
import { haptic } from '@/lib/haptics';
import { FadeInUp } from '@/components/animations';
import { Skeleton, Card } from '@/components/ui';
import { useCurrency } from '@/hooks/useCurrency';
import { useSchemeMatches } from '@/features/businesses/hooks';
import type { SchemeMatch } from '@/features/businesses/schemas';

const GRADIENTS: Array<[string, string]> = [
  [Colors.saffron[500], Colors.saffron[600]],
  [Colors.profit[500], Colors.profit[700]],
  [Colors.trust[500], Colors.trust[700]],
  ['#7C3AED', '#A855F7'],
  ['#EC4899', '#F472B6'],
];

export default function SchemesScreen() {
  const schemesQ = useSchemeMatches();
  const { format } = useCurrency();
  const schemes = (schemesQ.data ?? []).slice().sort((a, b) => b.matchScore - a.matchScore);

  async function handleRefresh() {
    haptic('tap');
    await schemesQ.refetch();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Sarkari Yojana</Text>
          <Text style={styles.subtitle}>
            {schemes.length > 0
              ? `${schemes.length} schemes match karte hain aapke liye`
              : 'Schemes load ho rahi hain…'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={schemesQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {schemesQ.isLoading ? (
          <>
            <Skeleton height={180} radius={20} style={{ marginBottom: 12 }} />
            <Skeleton height={180} radius={20} style={{ marginBottom: 12 }} />
            <Skeleton height={180} radius={20} style={{ marginBottom: 12 }} />
          </>
        ) : schemes.length === 0 ? (
          <Card variant="elevated" padding="lg">
            <View style={styles.empty}>
              <Building2 color={Colors.ink[400]} size={48} strokeWidth={1.6} />
              <Text style={styles.emptyTitle}>Koi scheme match nahi hui</Text>
              <Text style={styles.emptyBody}>
                GST register karne se aur Udyam add karne se zyada schemes
                eligible ho jaayengi.
              </Text>
            </View>
          </Card>
        ) : (
          schemes.map((scheme, i) => (
            <FadeInUp key={scheme.id} delay={i * 40}>
              <SchemeBigCard
                scheme={scheme}
                gradient={GRADIENTS[i % GRADIENTS.length]!}
                format={format}
              />
            </FadeInUp>
          ))
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Scheme card ─────────────────────────────────────────
/**
 * Map scheme names → official Government portal URLs.
 *
 * For schemes not in this map, we fall back to a Google search for
 * "[scheme name] application" so the user lands on the closest official page.
 */
const SCHEME_PORTALS: Record<string, string> = {
  PMEGP: 'https://www.kviconline.gov.in/pmegpeportal/',
  Mudra: 'https://www.mudra.org.in/',
  'Mudra Shishu': 'https://www.mudra.org.in/',
  'Mudra Kishore': 'https://www.mudra.org.in/',
  'Mudra Tarun': 'https://www.mudra.org.in/',
  CGTMSE: 'https://www.cgtmse.in/',
  'Stand-Up India': 'https://www.standupmitra.in/',
  Udyogini: 'https://www.indiafilings.com/learn/udyogini-scheme/',
  'Stree Shakti': 'https://www.sbi.co.in/web/personal-banking/loans/agriculture-rural/stree-shakti-package',
  PMSVANidhi: 'https://pmsvanidhi.mohua.gov.in/',
  'PM SVANidhi': 'https://pmsvanidhi.mohua.gov.in/',
};

function SchemeBigCard({
  scheme,
  gradient,
  format,
}: {
  scheme: SchemeMatch;
  gradient: [string, string];
  format: (n: number) => string;
}) {
  async function openPortal(url: string) {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot open', 'Browser nahi khul saka');
      }
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  function handleApply() {
    haptic('tap');
    // Find a known portal URL by exact or fuzzy match
    const knownUrl =
      SCHEME_PORTALS[scheme.name] ??
      Object.entries(SCHEME_PORTALS).find(([key]) =>
        scheme.name.toLowerCase().includes(key.toLowerCase()),
      )?.[1];

    if (knownUrl) {
      Alert.alert(
        scheme.name,
        'Government portal kholne ke liye continue dabao. Documents ready rakho.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => openPortal(knownUrl),
          },
        ],
      );
      return;
    }

    // Fallback: Google search for the scheme
    const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(
      scheme.name + ' application india government scheme',
    )}`;
    Alert.alert(
      scheme.name,
      'Iss scheme ka official portal abhi mapped nahi hai. Google search kholun?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Search',
          onPress: () => openPortal(fallbackUrl),
        },
      ],
    );
  }

  return (
    <Pressable
      onPress={handleApply}
      style={({ pressed }) => [
        styles.bigCard,
        { backgroundColor: gradient[0] },
        pressed && { opacity: 0.94 },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.matchBadge}>
          <Award color={Colors.saffron[600]} size={14} strokeWidth={2.6} />
          <Text style={styles.matchText}>{scheme.matchScore}% match</Text>
        </View>
        {scheme.category && (
          <View style={styles.catPill}>
            <Text style={styles.catText}>{scheme.category}</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardName}>{scheme.name}</Text>
      {scheme.nameHi && <Text style={styles.cardNameHi}>{scheme.nameHi}</Text>}

      {scheme.maxAmount && scheme.maxAmount > 0 && (
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Max amount</Text>
          <Text style={styles.amountValue}>{format(scheme.maxAmount)}</Text>
        </View>
      )}

      {scheme.subsidy && (
        <View style={styles.subsidyBox}>
          <Text style={styles.subsidyText}>{scheme.subsidy}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.cardCta}>Tap to apply</Text>
        <ChevronRight color={Colors.white} size={18} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
  },
  scroll: { padding: Spacing.xl },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  bigCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
    fontSize: 11,
    color: Colors.saffron[600],
    fontWeight: FontWeight.bold,
  },
  catPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  catText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  cardNameHi: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  amountBlock: { marginTop: Spacing.lg },
  amountLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.heavy,
    color: Colors.white,
    marginTop: 2,
  },
  subsidyBox: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  subsidyText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    color: Colors.white,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  cardCta: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
