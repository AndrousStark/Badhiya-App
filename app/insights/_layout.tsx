/**
 * /insights/* — Smart Insights stack (Intelligence + Forecasting).
 *
 * Routes:
 *   /insights            → hub (alerts, festival banner, trends)
 *   /insights/prices     → price tracker (tracked products, comparisons)
 *   /insights/forecast   → demand forecast (prediction chart, festivals, alerts)
 */

import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function InsightsLayout() {
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
