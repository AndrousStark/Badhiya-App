/**
 * _debug group — Sprint 1 de-risk screens.
 *
 * These screens prove the riskiest unknowns work end-to-end:
 *   - voice.tsx: expo-audio record → Bhashini STT round-trip
 *   - sync.tsx:  Drizzle write → offline queue → server sync round-trip
 *
 * Delete this entire group in Phase 3 once real features ship.
 */

import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

export default function DebugLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.saffron[500] },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="voice" options={{ title: '🎤 Voice De-risk' }} />
      <Stack.Screen name="sync" options={{ title: '🔄 Sync De-risk' }} />
    </Stack>
  );
}
