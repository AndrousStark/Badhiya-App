/**
 * (auth) group layout — unauthenticated routes.
 *
 * Login → Onboarding wizard. No tab bar, no chrome.
 */

import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
