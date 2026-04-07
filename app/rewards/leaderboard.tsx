/**
 * /rewards/leaderboard — Top Badhiya stores ranking.
 *
 * Wires:
 *   - useLeaderboard(city?) → top 20 stores by lifetime points
 *
 * Layout:
 *   - Header: city filter chips (Global / Local city)
 *   - Podium: top 3 stores in a special podium card
 *   - List: ranks 4-20 as standard rows
 *   - Highlights current business if it appears
 */

import { useState, useMemo } from 'react';
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
import { ArrowLeft, Trophy, Crown, Award } from 'lucide-react-native';

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
import { Skeleton, Chip, EmptyState } from '@/components/ui';
import { useLeaderboard } from '@/features/gamification/hooks';
import { LEVEL_META, type LeaderboardEntry } from '@/features/gamification/schemas';
import { auth$ } from '@/stores/auth';

export default function LeaderboardScreen() {
  const myBusinessId = auth$.businessId.get();
  const myCity = auth$.businessCity.get();
  const [scope, setScope] = useState<'global' | 'city'>('global');

  const cityFilter = scope === 'city' && myCity ? myCity : undefined;
  const leaderboardQ = useLeaderboard(cityFilter, 20);

  const entries = leaderboardQ.data ?? [];

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const myEntry = useMemo(
    () => entries.find((e) => e.businessId === myBusinessId),
    [entries, myBusinessId],
  );

  async function handleRefresh() {
    haptic('tap');
    await leaderboardQ.refetch();
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
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>Top Badhiya stores</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={leaderboardQ.isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.saffron[500]}
          />
        }
      >
        {/* ─── Scope chips ───────────────────────────── */}
        <FadeInUp delay={0}>
          <View style={styles.chipRow}>
            <Chip
              label="Pure Bharat"
              active={scope === 'global'}
              onPress={() => {
                haptic('tap');
                setScope('global');
              }}
            />
            {myCity && (
              <Chip
                label={myCity}
                active={scope === 'city'}
                onPress={() => {
                  haptic('tap');
                  setScope('city');
                }}
              />
            )}
          </View>
        </FadeInUp>

        {/* ─── My rank chip ──────────────────────────── */}
        {myEntry && (
          <FadeInUp delay={40}>
            <View style={styles.myRankCard}>
              <View style={styles.myRankBadge}>
                <Text style={styles.myRankBadgeText}>#{myEntry.rank}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.myRankLabel}>Aapka rank</Text>
                <Text style={styles.myRankValue}>
                  {myEntry.points.toLocaleString('en-IN')} 🪙
                </Text>
              </View>
              <Trophy color={Colors.saffron[500]} size={24} strokeWidth={2.2} />
            </View>
          </FadeInUp>
        )}

        {/* ─── Loading / Empty / Content ─────────────── */}
        {leaderboardQ.isLoading && entries.length === 0 ? (
          <>
            <Skeleton height={200} radius={20} style={{ marginVertical: 16 }} />
            <Skeleton height={60} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={60} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={60} radius={12} />
          </>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Trophy color={Colors.ink[300]} size={48} strokeWidth={1.6} />}
            title="Leaderboard khaali"
            body="Pehle dukandar bano · Sale record karke points kamao"
          />
        ) : (
          <>
            {/* ─── Podium (top 3) ──────────────────────── */}
            {top3.length > 0 && (
              <FadeInUp delay={80}>
                <Podium entries={top3} myBusinessId={myBusinessId ?? undefined} />
              </FadeInUp>
            )}

            {/* ─── Rest of the list ────────────────────── */}
            {rest.length > 0 && (
              <View style={styles.list}>
                {rest.map((entry, i) => (
                  <FadeInUp key={entry.businessId} delay={140 + i * 25}>
                    <RankRow
                      entry={entry}
                      isMe={entry.businessId === myBusinessId}
                    />
                  </FadeInUp>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Podium ──────────────────────────────────────────────
function Podium({
  entries,
  myBusinessId,
}: {
  entries: LeaderboardEntry[];
  myBusinessId?: string;
}) {
  // Order: 2nd, 1st, 3rd for the visual stagger
  const layout = [entries[1], entries[0], entries[2]].filter(Boolean);
  return (
    <View style={styles.podium}>
      {layout.map((entry) => {
        if (!entry) return null;
        const isMe = entry.businessId === myBusinessId;
        const rank = entry.rank;
        const isFirst = rank === 1;
        return (
          <View
            key={entry.businessId}
            style={[
              styles.podiumCol,
              isFirst && styles.podiumColFirst,
              isMe && styles.podiumColMe,
            ]}
          >
            {isFirst && (
              <Crown
                color={Colors.gold[500]}
                size={24}
                strokeWidth={2.4}
                style={{ marginBottom: -8, marginTop: -16 }}
              />
            )}
            <View style={[styles.podiumAvatar, podiumAvatarColor(rank)]}>
              <Text style={styles.podiumAvatarText}>
                {entry.businessName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.podiumRankBadge}>
              <Text style={styles.podiumRankText}>#{rank}</Text>
            </View>
            <Text
              style={[styles.podiumName, isMe && styles.podiumNameMe]}
              numberOfLines={1}
            >
              {entry.businessName}
            </Text>
            <Text style={styles.podiumPoints}>
              {entry.points.toLocaleString('en-IN')} 🪙
            </Text>
            <View
              style={[
                styles.podiumPlatform,
                isFirst && styles.podiumPlatformFirst,
                rank === 2 && styles.podiumPlatformSecond,
                rank === 3 && styles.podiumPlatformThird,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

function podiumAvatarColor(rank: number): { backgroundColor: string } {
  if (rank === 1) return { backgroundColor: Colors.gold[500] };
  if (rank === 2) return { backgroundColor: '#9CA3AF' };
  return { backgroundColor: '#B45309' };
}

// ─── Rank row ────────────────────────────────────────────
function RankRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const levelMeta = LEVEL_META[entry.level] ?? LEVEL_META.beginner;
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={styles.rankNum}>
        <Text style={[styles.rankNumText, isMe && styles.rankNumTextMe]}>
          #{entry.rank}
        </Text>
      </View>
      <View style={styles.rowAvatar}>
        <Text style={styles.rowAvatarText}>
          {entry.businessName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, isMe && styles.rowNameMe]} numberOfLines={1}>
          {entry.businessName}
        </Text>
        <View style={styles.rowMetaRow}>
          <Text style={styles.rowMetaEmoji}>{levelMeta.emoji}</Text>
          <Text style={styles.rowMeta}>{levelMeta.label}</Text>
        </View>
      </View>
      <Text style={styles.rowPoints}>
        {entry.points.toLocaleString('en-IN')} 🪙
      </Text>
      {isMe && <Award color={Colors.saffron[500]} size={16} strokeWidth={2.4} />}
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

  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // My rank pill
  myRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.saffron[50],
    borderWidth: 1.5,
    borderColor: Colors.saffron[500],
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  myRankBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  myRankBadgeText: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
    color: Colors.white,
  },
  myRankLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  myRankValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },

  // Podium
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 0,
    marginBottom: Spacing.lg,
    minHeight: 220,
    ...Shadow.sm,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  podiumColFirst: {
    transform: [{ translateY: -16 }],
  },
  podiumColMe: {},
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  podiumAvatarText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.heavy,
    color: Colors.white,
  },
  podiumRankBadge: {
    backgroundColor: Colors.ink[900],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  podiumRankText: {
    fontFamily: FontFamily.monoBold,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  podiumName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    textAlign: 'center',
    maxWidth: 100,
  },
  podiumNameMe: { color: Colors.saffron[600] },
  podiumPoints: {
    fontFamily: FontFamily.monoBold,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.ink[500],
  },
  podiumPlatform: {
    width: '100%',
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
  },
  podiumPlatformFirst: { height: 60 },
  podiumPlatformSecond: { height: 40 },
  podiumPlatformThird: { height: 24 },

  // Rank rows
  list: {},
  row: {
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
  rowMe: {
    backgroundColor: Colors.saffron[50],
    borderColor: Colors.saffron[500],
    borderWidth: 1.5,
  },
  rankNum: {
    width: 36,
    alignItems: 'center',
  },
  rankNumText: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[400],
  },
  rankNumTextMe: { color: Colors.saffron[600] },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.ink[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  rowNameMe: { color: Colors.saffron[600] },
  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rowMetaEmoji: { fontSize: 11 },
  rowMeta: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
  },
  rowPoints: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
  },
});
