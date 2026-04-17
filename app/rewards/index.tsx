/**
 * /rewards — Badhiya Coins hub.
 *
 * Wires:
 *   - useGamificationProfile() — coins, streak, level, calendar, spin status
 *   - useChallenges()          — today's active challenges with progress
 *
 * Layout:
 *   1. Hero card: animated coin counter + level badge + level progress bar
 *   2. Streak card: 7-day mini-calendar + current/longest streak
 *   3. Spin teaser: spins remaining → big "Spin now" CTA
 *   4. Today's challenges (challenge cards with progress bars)
 *   5. Quick links: Achievements, Leaderboard, History
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Trophy,
  Flame,
  Sparkles,
  ChevronRight,
  Gift,
  Star,
  History,
  Target,
} from 'lucide-react-native';

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
import { FadeInUp, NumberTicker } from '@/components/animations';
import { Skeleton, SectionLabel, Badge } from '@/components/ui';
import {
  useGamificationProfile,
  useChallenges,
} from '@/features/gamification/hooks';
import {
  LEVEL_META,
  getLevelMeta,
  CHALLENGE_TYPE_LABELS,
  type UserChallenge,
  type GamificationProfile,
} from '@/features/gamification/schemas';

export default function RewardsHubScreen() {
  const profileQ = useGamificationProfile();
  const challengesQ = useChallenges();

  const profile = profileQ.data;
  const challenges = challengesQ.data ?? [];

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([profileQ.refetch(), challengesQ.refetch()]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Badhiya Rewards</Text>
          <Text style={styles.subtitle}>Coins · Streak · Achievements</Text>
        </View>
        <Pressable
          onPress={() => {
            haptic('tap');
            router.push('/rewards/history');
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          accessibilityLabel="Points history"
        >
          <History color={Colors.ink[700]} size={20} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={profileQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {profileQ.isLoading && !profile ? (
          <>
            <Skeleton height={180} radius={20} style={{ marginBottom: 16 }} />
            <Skeleton height={120} radius={16} style={{ marginBottom: 16 }} />
            <Skeleton height={80} radius={16} />
          </>
        ) : profile ? (
          <>
            <FadeInUp delay={0}>
              <CoinsHero profile={profile} />
            </FadeInUp>

            <FadeInUp delay={60}>
              <StreakCard profile={profile} />
            </FadeInUp>

            <FadeInUp delay={120}>
              <SpinTeaser
                spinsRemaining={profile.spinStatus.spinsRemaining}
                lastPrize={profile.spinStatus.lastPrize?.prizeName ?? null}
              />
            </FadeInUp>

            <FadeInUp delay={180}>
              <SectionLabel
                label={`Aaj ke Challenges · ${challenges.length}`}
                actionLabel="Sab dekho"
                onActionPress={() => router.push('/rewards/achievements')}
              />
              {challengesQ.isLoading && challenges.length === 0 ? (
                <Skeleton height={100} radius={12} />
              ) : challenges.length === 0 ? (
                <View style={styles.emptyChallenges}>
                  <Target color={Colors.ink[300]} size={32} strokeWidth={1.6} />
                  <Text style={styles.emptyText}>
                    Aaj koi challenge nahi · Kal dekho
                  </Text>
                </View>
              ) : (
                challenges.slice(0, 5).map((c, i) => (
                  <FadeInUp key={c.id} delay={200 + i * 30}>
                    <ChallengeCard challenge={c} />
                  </FadeInUp>
                ))
              )}
            </FadeInUp>

            <FadeInUp delay={300}>
              <SectionLabel label="Aur dekho" />
              <View style={styles.linkGrid}>
                <LinkTile
                  icon={<Trophy color={Colors.gold[500]} size={22} strokeWidth={2.4} />}
                  label="Achievements"
                  hint={`${profile.achievements.unlocked} / ${profile.achievements.total}`}
                  onPress={() => {
                    haptic('tap');
                    router.push('/rewards/achievements');
                  }}
                />
                <LinkTile
                  icon={<Star color={Colors.saffron[500]} size={22} strokeWidth={2.4} />}
                  label="Leaderboard"
                  hint="Top stores"
                  onPress={() => {
                    haptic('tap');
                    router.push('/rewards/leaderboard');
                  }}
                />
              </View>
            </FadeInUp>
          </>
        ) : (
          <View style={styles.emptyChallenges}>
            <Text style={styles.emptyText}>Profile load nahi hua</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Coins hero ──────────────────────────────────────────
function CoinsHero({ profile }: { profile: GamificationProfile }) {
  const levelKey = profile.points.level;
  const levelMeta = getLevelMeta(levelKey);

  return (
    <View style={styles.hero}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeEmoji}>{levelMeta.emoji}</Text>
          <Text style={[styles.heroBadgeLabel, { color: levelMeta.color }]}>
            {levelMeta.label.toUpperCase()}
          </Text>
        </View>
        <View style={styles.heroLifetime}>
          <Text style={styles.heroLifetimeLabel}>Lifetime</Text>
          <Text style={styles.heroLifetimeValue}>
            {profile.points.lifetimeEarned.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <Text style={styles.heroLabel}>Badhiya Coins</Text>
      <View style={styles.heroNumberRow}>
        <Text style={styles.coinEmoji}>🪙</Text>
        <NumberTicker
          value={profile.points.currentPoints}
          duration={900}
          style={styles.heroNumber}
        />
      </View>

      {/* Level progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(100, profile.points.levelProgress)}%` },
          ]}
        />
      </View>
      <Text style={styles.progressHint}>
        {profile.points.levelProgress}% to next level
      </Text>
    </View>
  );
}

// ─── Streak card ─────────────────────────────────────────
function StreakCard({ profile }: { profile: GamificationProfile }) {
  const days = profile.streakCalendar;
  const current = profile.streak.currentStreak;
  const longest = profile.streak.longestStreak;
  const isHot = current >= 3;

  return (
    <View style={[styles.streakCard, isHot && styles.streakCardHot]}>
      <View style={styles.streakHeaderRow}>
        <View style={styles.streakIcon}>
          <Flame
            color={isHot ? Colors.saffron[500] : Colors.ink[400]}
            size={22}
            strokeWidth={2.4}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakLabel}>Streak</Text>
          <Text style={styles.streakValue}>
            {current} din{current === 1 ? '' : ''}
          </Text>
        </View>
        <View style={styles.streakLongest}>
          <Text style={styles.streakLongestLabel}>Longest</Text>
          <Text style={styles.streakLongestValue}>{longest}</Text>
        </View>
      </View>

      {/* 7-day calendar dots */}
      <View style={styles.calendarRow}>
        {days.map((d) => (
          <View
            key={d.date}
            style={[
              styles.calendarDot,
              d.active && styles.calendarDotActive,
            ]}
          >
            {d.active && <Text style={styles.calendarDotEmoji}>🔥</Text>}
          </View>
        ))}
      </View>
      <Text style={styles.calendarHint}>Pichle 7 din</Text>
    </View>
  );
}

// ─── Spin wheel teaser ───────────────────────────────────
function SpinTeaser({
  spinsRemaining,
  lastPrize,
}: {
  spinsRemaining: number;
  lastPrize: string | null;
}) {
  const canSpin = spinsRemaining > 0;
  return (
    <Pressable
      onPress={() => {
        haptic('tap');
        router.push('/rewards/spin');
      }}
      style={({ pressed }) => [
        styles.spinCard,
        canSpin ? styles.spinCardActive : styles.spinCardDisabled,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.spinIcon}>
        <Gift
          color={canSpin ? Colors.saffron[500] : Colors.ink[400]}
          size={28}
          strokeWidth={2.4}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.spinTitle}>
          {canSpin ? 'Spin the wheel!' : 'Aaj ke spin khatam'}
        </Text>
        <Text style={styles.spinSub}>
          {canSpin
            ? `${spinsRemaining} spin baki · Tap to spin`
            : lastPrize
              ? `Last: ${lastPrize}`
              : 'Kal phir try karo'}
        </Text>
      </View>
      <ChevronRight color={Colors.ink[400]} size={20} strokeWidth={2.2} />
    </Pressable>
  );
}

// ─── Challenge card ──────────────────────────────────────
function ChallengeCard({ challenge }: { challenge: UserChallenge }) {
  const progress = Math.min(100, (challenge.progress / challenge.target) * 100);
  const meta = CHALLENGE_TYPE_LABELS[challenge.challengeType] ?? {
    label: challenge.challengeType,
    emoji: '🎯',
  };

  return (
    <View
      style={[
        styles.challengeCard,
        challenge.completed && styles.challengeCardDone,
      ]}
    >
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeEmoji}>{meta.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.challengeTitle} numberOfLines={1}>
            {challenge.titleHindi || challenge.title}
          </Text>
          {challenge.description && (
            <Text style={styles.challengeDesc} numberOfLines={1}>
              {challenge.description}
            </Text>
          )}
        </View>
        <Badge
          label={`+${challenge.pointsReward} 🪙`}
          tone={challenge.completed ? 'profit' : 'warning'}
        />
      </View>
      <View style={styles.challengeProgressRow}>
        <View style={styles.challengeProgressTrack}>
          <View
            style={[
              styles.challengeProgressFill,
              {
                width: `${progress}%`,
                backgroundColor: challenge.completed
                  ? Colors.profit[500]
                  : Colors.saffron[500],
              },
            ]}
          />
        </View>
        <Text style={styles.challengeProgressText}>
          {challenge.progress} / {challenge.target}
        </Text>
      </View>
    </View>
  );
}

// ─── Link tile ───────────────────────────────────────────
function LinkTile({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkTile, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.linkIcon}>{icon}</View>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.linkHint}>{hint}</Text>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: Colors.saffron[50] },
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

  // Hero
  hero: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.saffron[500],
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  heroBadgeEmoji: { fontSize: 14 },
  heroBadgeLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  heroLifetime: { alignItems: 'flex-end' },
  heroLifetimeLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroLifetimeValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
  },
  heroLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    color: Colors.saffron[600],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  coinEmoji: { fontSize: 32 },
  heroNumber: {
    fontFamily: FontFamily.mono,
    fontSize: 42,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.bg,
    borderRadius: 4,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.saffron[500],
    borderRadius: 4,
  },
  progressHint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 4,
  },

  // Streak card
  streakCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadow.sm,
  },
  streakCardHot: {
    borderColor: Colors.saffron[500],
    backgroundColor: Colors.saffron[50],
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  streakIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },
  streakLongest: {
    alignItems: 'flex-end',
  },
  streakLongestLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakLongestValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  calendarDot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDotActive: {
    backgroundColor: Colors.saffron[500],
    borderColor: Colors.saffron[500],
  },
  calendarDotEmoji: { fontSize: 12 },
  calendarHint: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[400],
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Spin teaser
  spinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1.5,
  },
  spinCardActive: {
    backgroundColor: Colors.saffron[50],
    borderColor: Colors.saffron[500],
  },
  spinCardDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  spinIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  spinSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    marginTop: 2,
  },

  // Challenges
  emptyChallenges: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: Spacing.sm,
  },
  challengeCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  challengeCardDone: {
    backgroundColor: Colors.profit[50],
    borderColor: Colors.profit[500],
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  challengeEmoji: { fontSize: 20 },
  challengeTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  challengeDesc: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 1,
  },
  challengeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  challengeProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: { height: '100%', borderRadius: 3 },
  challengeProgressText: {
    fontFamily: FontFamily.monoBold,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
    minWidth: 50,
    textAlign: 'right',
  },

  // Link tiles
  linkGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  linkTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  linkLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  linkHint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
  },
});
