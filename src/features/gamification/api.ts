/**
 * Gamification API — wraps the 6 backend gamification endpoints.
 *
 *   GET  /businesses/:id/gamification/profile        — coins, streak, level, calendar, spin status
 *   GET  /businesses/:id/gamification/leaderboard    — top stores (optional city filter)
 *   GET  /businesses/:id/gamification/achievements   — all achievements w/ unlock state
 *   GET  /businesses/:id/gamification/challenges     — active challenges w/ progress
 *   POST /businesses/:id/gamification/spin           — spin the reward wheel
 *   GET  /businesses/:id/gamification/history        — points transaction log
 *
 * The current user is implicit (req.user.sub on backend) — frontend
 * just sends the businessId.
 */

import { z } from 'zod';
import { api } from '@/lib/api';
import {
  gamificationProfileSchema,
  achievementSchema,
  challengeSchema,
  spinResultSchema,
  leaderboardEntrySchema,
  pointHistorySchema,
  type GamificationProfile,
  type UserAchievement,
  type UserChallenge,
  type SpinResult,
  type LeaderboardEntry,
  type PointHistory,
} from './schemas';

export async function getGamificationProfile(
  businessId: string,
): Promise<GamificationProfile> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/gamification/profile`,
  );
  return gamificationProfileSchema.parse(data);
}

export async function getAchievements(
  businessId: string,
): Promise<UserAchievement[]> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/gamification/achievements`,
  );
  return z.array(achievementSchema).parse(data);
}

export async function getChallenges(
  businessId: string,
): Promise<UserChallenge[]> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/gamification/challenges`,
  );
  return z.array(challengeSchema).parse(data);
}

export async function spinWheel(businessId: string): Promise<SpinResult> {
  const data = await api.post<unknown>(
    `/businesses/${businessId}/gamification/spin`,
  );
  return spinResultSchema.parse(data);
}

export async function getLeaderboard(
  businessId: string,
  options: { limit?: number; city?: string } = {},
): Promise<LeaderboardEntry[]> {
  const params: Record<string, string> = {};
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.city) params.city = options.city;
  const data = await api.get<unknown>(
    `/businesses/${businessId}/gamification/leaderboard`,
    { params },
  );
  return z.array(leaderboardEntrySchema).parse(data);
}

export async function getPointsHistory(
  businessId: string,
  options: {
    limit?: number;
    offset?: number;
    type?: string;
    source?: string;
  } = {},
): Promise<PointHistory> {
  const params: Record<string, string> = {};
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.offset !== undefined) params.offset = String(options.offset);
  if (options.type) params.type = options.type;
  if (options.source) params.source = options.source;
  const data = await api.get<unknown>(
    `/businesses/${businessId}/gamification/history`,
    { params },
  );
  return pointHistorySchema.parse(data);
}
