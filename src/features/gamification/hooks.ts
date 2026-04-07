/**
 * TanStack Query hooks for the gamification feature.
 *
 * Online-first. Profile is the most-read query — keep stale time low so
 * coin/streak counts feel "live" after the user records a sale or marks
 * a payment. Leaderboard refreshes hourly.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getGamificationProfile,
  getAchievements,
  getChallenges,
  spinWheel,
  getLeaderboard,
  getPointsHistory,
} from './api';
import type {
  GamificationProfile,
  UserAchievement,
  UserChallenge,
  SpinResult,
  LeaderboardEntry,
  PointHistory,
} from './schemas';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';

// ─── Query keys ─────────────────────────────────────────
export const gamificationKeys = {
  all: ['gamification'] as const,
  profile: (businessId: string) =>
    [...gamificationKeys.all, 'profile', businessId] as const,
  achievements: (businessId: string) =>
    [...gamificationKeys.all, 'achievements', businessId] as const,
  challenges: (businessId: string) =>
    [...gamificationKeys.all, 'challenges', businessId] as const,
  leaderboard: (businessId: string, city?: string) =>
    [...gamificationKeys.all, 'leaderboard', businessId, city ?? 'global'] as const,
  history: (
    businessId: string,
    type?: string,
    source?: string,
  ) =>
    [
      ...gamificationKeys.all,
      'history',
      businessId,
      type ?? 'all',
      source ?? 'all',
    ] as const,
};

// ─── Reads ──────────────────────────────────────────────
export function useGamificationProfile() {
  const businessId = auth$.businessId.get();
  return useQuery<GamificationProfile>({
    queryKey: gamificationKeys.profile(businessId ?? 'none'),
    queryFn: () => getGamificationProfile(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function useAchievements() {
  const businessId = auth$.businessId.get();
  return useQuery<UserAchievement[]>({
    queryKey: gamificationKeys.achievements(businessId ?? 'none'),
    queryFn: () => getAchievements(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
}

export function useChallenges() {
  const businessId = auth$.businessId.get();
  return useQuery<UserChallenge[]>({
    queryKey: gamificationKeys.challenges(businessId ?? 'none'),
    queryFn: () => getChallenges(businessId!),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useLeaderboard(city?: string, limit = 20) {
  const businessId = auth$.businessId.get();
  return useQuery<LeaderboardEntry[]>({
    queryKey: gamificationKeys.leaderboard(businessId ?? 'none', city),
    queryFn: () => getLeaderboard(businessId!, { city, limit }),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
}

export function usePointsHistory(filters: { type?: string; source?: string } = {}) {
  const businessId = auth$.businessId.get();
  return useQuery<PointHistory>({
    queryKey: gamificationKeys.history(
      businessId ?? 'none',
      filters.type,
      filters.source,
    ),
    queryFn: () =>
      getPointsHistory(businessId!, {
        limit: 50,
        offset: 0,
        type: filters.type,
        source: filters.source,
      }),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

// ─── Writes ─────────────────────────────────────────────
export function useSpinWheel() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();
  return useMutation<SpinResult, Error, void>({
    mutationFn: () => spinWheel(businessId!),
    onSuccess: () => {
      haptic('revealMoney');
      // Refresh profile (coins may have changed) + history
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.profile(businessId ?? 'none'),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.history(businessId ?? 'none'),
      });
    },
    onError: () => haptic('error'),
  });
}
