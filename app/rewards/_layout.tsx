/**
 * /rewards/* — Badhiya Coins, Streaks, Achievements stack.
 *
 * Routes:
 *   /rewards               → main hub (coins, streak, level, today's challenges)
 *   /rewards/spin          → spin wheel screen
 *   /rewards/achievements  → grid of all achievements
 *   /rewards/leaderboard   → top stores ranking
 *   /rewards/history       → points transaction history
 */

import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function RewardsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
