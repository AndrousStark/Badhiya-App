/**
 * /rewards/achievements — All Badhiya achievements grid.
 *
 * Wires:
 *   - useAchievements() → all achievements with unlock state
 *   - useChallenges() → today's active challenges section
 *
 * Layout:
 *   - Header: unlocked / total counter + filter chips by category
 *   - Today's challenges (in-progress)
 *   - Grid of achievement cards (locked/unlocked)
 */

import { useMemo, useState } from 'react';
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
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react-native';

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
import { Skeleton, Chip, SectionLabel, Badge, EmptyState } from '@/components/ui';
import {
  useAchievements,
  useChallenges,
} from '@/features/gamification/hooks';
import {
  CHALLENGE_TYPE_LABELS,
  type UserAchievement,
  type UserChallenge,
} from '@/features/gamification/schemas';

export default function AchievementsScreen() {
  const achievementsQ = useAchievements();
  const challengesQ = useChallenges();

  const achievements = achievementsQ.data ?? [];
  const challenges = challengesQ.data ?? [];

  // Build category list dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    achievements.forEach((a) => set.add(a.category));
    return ['all', ...Array.from(set).sort()];
  }, [achievements]);

  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return achievements;
    return achievements.filter((a) => a.category === activeCategory);
  }, [achievements, activeCategory]);

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;

  async function handleRefresh() {
    haptic('tap');
    await Promise.all([achievementsQ.refetch(), challengesQ.refetch()]);
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
          <Text style={styles.title}>Achievements</Text>
          <Text style={styles.subtitle}>
            {unlocked} / {total} unlocked
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={achievementsQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Progress hero ─────────────────────────── */}
        <FadeInUp delay={0}>
          <View style={styles.progressHero}>
            <View style={styles.progressBig}>
              <Text style={styles.progressBigNum}>{unlocked}</Text>
              <Text style={styles.progressBigDenom}>/ {total}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressTitle}>Badhiya progress!</Text>
              <Text style={styles.progressSub}>
                {total > 0
                  ? `${Math.round((unlocked / total) * 100)}% complete`
                  : 'Loading achievements…'}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${total > 0 ? (unlocked / total) * 100 : 0}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </FadeInUp>

        {/* ─── Today's challenges ────────────────────── */}
        {challenges.length > 0 && (
          <FadeInUp delay={60}>
            <SectionLabel label={`Active Challenges · ${challenges.length}`} />
            {challenges.map((c, i) => (
              <FadeInUp key={c.id} delay={80 + i * 30}>
                <ChallengeRow challenge={c} />
              </FadeInUp>
            ))}
          </FadeInUp>
        )}

        {/* ─── Category filters ──────────────────────── */}
        <FadeInUp delay={140}>
          <SectionLabel label="All Achievements" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat === 'all' ? 'Sab' : cat}
                active={activeCategory === cat}
                onPress={() => {
                  haptic('tap');
                  setActiveCategory(cat);
                }}
              />
            ))}
          </ScrollView>
        </FadeInUp>

        {/* ─── Grid ──────────────────────────────────── */}
        {achievementsQ.isLoading && achievements.length === 0 ? (
          <View style={styles.gridLoading}>
            <Skeleton height={120} radius={16} style={{ marginBottom: 8 }} />
            <Skeleton height={120} radius={16} style={{ marginBottom: 8 }} />
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Koi achievement nahi"
            body="Is category mein abhi tak koi achievement add nahi hua hai"
          />
        ) : (
          <View style={styles.grid}>
            {filtered.map((a, i) => (
              <FadeInUp key={a.id} delay={160 + i * 25} style={styles.gridItem}>
                <AchievementCard achievement={a} />
              </FadeInUp>
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Achievement card ────────────────────────────────────
function AchievementCard({ achievement }: { achievement: UserAchievement }) {
  const isUnlocked = achievement.unlocked;
  return (
    <View
      style={[
        styles.achievementCard,
        isUnlocked ? styles.achievementCardUnlocked : styles.achievementCardLocked,
      ]}
    >
      <View
        style={[
          styles.achievementIcon,
          isUnlocked && styles.achievementIconUnlocked,
        ]}
      >
        {isUnlocked ? (
          <Text style={styles.achievementEmoji}>{achievement.icon || '🏆'}</Text>
        ) : (
          <Lock color={Colors.ink[400]} size={20} strokeWidth={2.2} />
        )}
      </View>
      <Text
        style={[
          styles.achievementName,
          !isUnlocked && styles.achievementNameLocked,
        ]}
        numberOfLines={2}
      >
        {achievement.nameHindi || achievement.name}
      </Text>
      {achievement.description && (
        <Text style={styles.achievementDesc} numberOfLines={2}>
          {achievement.description}
        </Text>
      )}
      <View style={styles.achievementFooter}>
        <Text style={styles.achievementReward}>+{achievement.pointsReward} 🪙</Text>
        {isUnlocked && (
          <CheckCircle2 color={Colors.profit[500]} size={14} strokeWidth={2.4} />
        )}
      </View>
    </View>
  );
}

// ─── Challenge row ───────────────────────────────────────
function ChallengeRow({ challenge }: { challenge: UserChallenge }) {
  const progress = Math.min(100, (challenge.progress / challenge.target) * 100);
  const meta = CHALLENGE_TYPE_LABELS[challenge.challengeType] ?? {
    label: challenge.challengeType,
    emoji: '🎯',
  };
  return (
    <View
      style={[
        styles.challengeRow,
        challenge.completed && styles.challengeRowDone,
      ]}
    >
      <Text style={styles.challengeEmoji}>{meta.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.challengeTitle} numberOfLines={1}>
          {challenge.titleHindi || challenge.title}
        </Text>
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
            {challenge.progress}/{challenge.target}
          </Text>
        </View>
      </View>
      <Badge
        label={`+${challenge.pointsReward}`}
        tone={challenge.completed ? 'profit' : 'warning'}
      />
    </View>
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

  // Progress hero
  progressHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.saffron[500],
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  progressBig: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  progressBigNum: {
    fontFamily: FontFamily.mono,
    fontSize: 44,
    fontWeight: FontWeight.heavy,
    color: Colors.saffron[600],
  },
  progressBigDenom: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    color: Colors.ink[400],
  },
  progressTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  progressSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.saffron[500],
    borderRadius: 3,
  },

  // Challenges row
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  challengeRowDone: {
    backgroundColor: Colors.profit[50],
    borderColor: Colors.profit[500],
  },
  challengeEmoji: { fontSize: 24 },
  challengeTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  challengeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  challengeProgressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.bg,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  challengeProgressFill: { height: '100%', borderRadius: 2.5 },
  challengeProgressText: {
    fontFamily: FontFamily.monoBold,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
    minWidth: 36,
    textAlign: 'right',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // Grid
  gridLoading: { gap: Spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridItem: {
    width: '48.5%',
  },
  achievementCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: 160,
    ...Shadow.sm,
  },
  achievementCardUnlocked: {
    borderColor: Colors.gold[500],
    backgroundColor: Colors.gold[50],
  },
  achievementCardLocked: {
    opacity: 0.85,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  achievementIconUnlocked: {
    backgroundColor: Colors.gold[500],
    borderColor: Colors.gold[500],
  },
  achievementEmoji: { fontSize: 24 },
  achievementName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  achievementNameLocked: {
    color: Colors.ink[500],
  },
  achievementDesc: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: 2,
    lineHeight: 14,
  },
  achievementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: Spacing.sm,
  },
  achievementReward: {
    fontFamily: FontFamily.monoBold,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.saffron[600],
  },
});
