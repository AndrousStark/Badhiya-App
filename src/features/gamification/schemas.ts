/**
 * Gamification feature schemas — Badhiya Coins, Streaks, Achievements,
 * Challenges, Spin Wheel, Leaderboard.
 *
 * Backend uses camelCase already (services already transform), so most
 * schemas are passthrough validation. Numeric strings from PG are
 * coerced. The only snake_case carryover is `name_hindi` / `title_hindi`
 * inside achievements & challenges row mapping — handled at the service
 * layer in the backend, so we just shape-validate here.
 */

import { z } from 'zod';

// ─── Enums (mirror backend) ─────────────────────────────
export const pointTypeEnum = z.enum(['earned', 'spent', 'bonus', 'penalty']);
export type PointType = z.infer<typeof pointTypeEnum>;

export const pointSourceEnum = z.enum([
  'sale_recorded',
  'credit_paid',
  'inventory_updated',
  'streak_bonus',
  'challenge_completed',
  'spin_reward',
  'referral',
  'ondc_order',
]);
export type PointSource = z.infer<typeof pointSourceEnum>;

export const levelEnum = z.enum([
  'beginner',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
]);
export type Level = z.infer<typeof levelEnum>;

export const challengeTypeEnum = z.enum(['daily', 'weekly', 'monthly']);
export type ChallengeType = z.infer<typeof challengeTypeEnum>;

export const prizeTypeEnum = z.enum([
  'points',
  'badge',
  'discount',
  'freebie',
  'nothing',
]);
export type PrizeType = z.infer<typeof prizeTypeEnum>;

// ─── Profile (composite) ────────────────────────────────
export const pointBalanceSchema = z.object({
  currentPoints: z.coerce.number(),
  lifetimeEarned: z.coerce.number(),
  level: z.string(), // backend-generated, not strictly enum (defensive)
  levelProgress: z.coerce.number(),
});
export type PointBalance = z.infer<typeof pointBalanceSchema>;

export const streakInfoSchema = z.object({
  currentStreak: z.coerce.number(),
  longestStreak: z.coerce.number(),
  lastActiveDate: z.string().nullable(),
  streakBrokenAt: z.string().nullable(),
});
export type StreakInfo = z.infer<typeof streakInfoSchema>;

export const streakCalendarDaySchema = z.object({
  date: z.string(),
  active: z.boolean(),
});
export type StreakCalendarDay = z.infer<typeof streakCalendarDaySchema>;

export const spinStatusSchema = z.object({
  spinsUsed: z.coerce.number(),
  spinsRemaining: z.coerce.number(),
  lastPrize: z
    .object({
      prizeName: z.string(),
      prizeValue: z.coerce.number(),
    })
    .nullable(),
});
export type SpinStatus = z.infer<typeof spinStatusSchema>;

export const gamificationProfileSchema = z.object({
  points: pointBalanceSchema,
  streak: streakInfoSchema,
  streakCalendar: z.array(streakCalendarDaySchema),
  achievements: z.object({
    unlocked: z.coerce.number(),
    total: z.coerce.number(),
  }),
  spinStatus: spinStatusSchema,
});
export type GamificationProfile = z.infer<typeof gamificationProfileSchema>;

// ─── Achievement ────────────────────────────────────────
export const achievementSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  nameHindi: z.string(),
  description: z.string().nullable(),
  icon: z.string(),
  category: z.string(),
  pointsReward: z.coerce.number(),
  criteria: z.record(z.unknown()).optional().default({}),
  isActive: z.boolean(),
  unlocked: z.boolean(),
  unlockedAt: z.string().nullable(),
});
export type UserAchievement = z.infer<typeof achievementSchema>;

// ─── Challenge ──────────────────────────────────────────
export const challengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  titleHindi: z.string(),
  description: z.string().nullable(),
  challengeType: z.string(),
  pointsReward: z.coerce.number(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
  progress: z.coerce.number(),
  target: z.coerce.number(),
  completed: z.boolean(),
  completedAt: z.string().nullable(),
});
export type UserChallenge = z.infer<typeof challengeSchema>;

// ─── Spin wheel ─────────────────────────────────────────
export const spinPrizeSchema = z.object({
  id: z.string(),
  prizeName: z.string(),
  prizeNameHindi: z.string(),
  prizeType: z.string(),
  prizeValue: z.coerce.number(),
  probability: z.coerce.number(),
  icon: z.string(),
  color: z.string(),
});
export type SpinPrize = z.infer<typeof spinPrizeSchema>;

export const spinResultSchema = z.object({
  prize: spinPrizeSchema,
  spinsRemaining: z.coerce.number(),
  pointsAwarded: z.coerce.number(),
});
export type SpinResult = z.infer<typeof spinResultSchema>;

// ─── Leaderboard ────────────────────────────────────────
export const leaderboardEntrySchema = z.object({
  rank: z.coerce.number(),
  businessId: z.string(),
  businessName: z.string(),
  points: z.coerce.number(),
  level: z.string(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

// ─── Points history ─────────────────────────────────────
export const pointTransactionSchema = z.object({
  id: z.string(),
  points: z.coerce.number(),
  type: z.string(),
  source: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
});
export type PointTransaction = z.infer<typeof pointTransactionSchema>;

export const pointHistorySchema = z.object({
  data: z.array(pointTransactionSchema),
  total: z.coerce.number(),
});
export type PointHistory = z.infer<typeof pointHistorySchema>;

// ─── Static metadata: levels & sources ──────────────────
export const LEVEL_META: Record<
  string,
  { label: string; emoji: string; color: string; threshold: number }
> = {
  beginner: { label: 'Shuruati',   emoji: '🌱', color: '#9CA3AF', threshold: 0 },
  bronze:   { label: 'Bronze',     emoji: '🥉', color: '#B45309', threshold: 100 },
  silver:   { label: 'Silver',     emoji: '🥈', color: '#6B7280', threshold: 500 },
  gold:     { label: 'Gold',       emoji: '🥇', color: '#F59E0B', threshold: 2000 },
  platinum: { label: 'Platinum',   emoji: '💎', color: '#7C3AED', threshold: 5000 },
  diamond:  { label: 'Diamond',    emoji: '💠', color: '#0EA5E9', threshold: 10000 },
};

export const POINT_SOURCE_LABELS: Record<string, string> = {
  sale_recorded:       'Sale recorded',
  credit_paid:         'Credit paid',
  inventory_updated:   'Stock updated',
  streak_bonus:        'Streak bonus',
  challenge_completed: 'Challenge done',
  spin_reward:         'Spin wheel',
  referral:            'Referral',
  ondc_order:          'ONDC order',
};

export const CHALLENGE_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  daily:   { label: 'Daily',   emoji: '☀️' },
  weekly:  { label: 'Weekly',  emoji: '📅' },
  monthly: { label: 'Monthly', emoji: '🗓️' },
};
