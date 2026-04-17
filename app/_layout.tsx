/**
 * Root layout — providers for the entire app.
 *
 * Provider order (outside → in):
 *   GestureHandlerRootView  (required for Reanimated 4 gestures)
 *     SafeAreaProvider      (safe area insets for notches/status bars)
 *       QueryClientProvider (TanStack Query for server state)
 *         Stack             (expo-router file-based navigation)
 *
 * Fonts loaded here (Phase 2): Hind, Anek Devanagari, JetBrains Mono.
 * Splash screen stays up until fonts are ready to avoid flash.
 */

import '../src/i18n'; // side-effect: initialize i18next
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import {
  useFonts,
  Hind_400Regular,
  Hind_500Medium,
  Hind_600SemiBold,
  Hind_700Bold,
} from '@expo-google-fonts/hind';
import {
  AnekDevanagari_700Bold,
  AnekDevanagari_800ExtraBold,
} from '@expo-google-fonts/anek-devanagari';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import { Colors } from '../src/theme';
import { useAutoLock } from '../src/hooks/useAutoLock';
import { useNotificationSetup } from '../src/lib/notifications';
import { SheetProvider } from '../src/components/sheets';
import { initObservability } from '../src/lib/observability';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore — hook may fail in dev reload */
});

// Side-effect: initialize Sentry + PostHog at module load so they
// capture even the earliest render errors. Safe to call multiple
// times — the underlying SDKs guard against re-init.
initObservability();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Hind_400Regular,
    Hind_500Medium,
    Hind_600SemiBold,
    Hind_700Bold,
    AnekDevanagari_700Bold,
    AnekDevanagari_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  // Biometric re-auth after 10 min idle (no-op if not authenticated)
  useAutoLock(true);

  // Push notification registration + handlers
  useNotificationSetup();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SheetProvider>
            <StatusBar style="dark" backgroundColor={Colors.bg} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.bg },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen
                name="lock"
                options={{ animation: 'fade', gestureEnabled: false }}
              />
              <Stack.Screen name="finance" />
              <Stack.Screen name="ondc" />
              <Stack.Screen name="rewards" />
              <Stack.Screen name="team" />
              <Stack.Screen name="insights" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="admin" />
              <Stack.Screen
                name="chat"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen name="_debug" options={{ presentation: 'modal' }} />
            </Stack>
          </SheetProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
