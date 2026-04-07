/**
 * /finance/* — finance hub stack layout.
 *
 * Routes:
 *   /finance/health-score  → 6-component breakdown
 *   /finance/loans         → NBFC marketplace
 *   /finance/schemes       → Govt schemes
 */

import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function FinanceLayout() {
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
