/**
 * Crash reporting + product analytics wrappers.
 *
 * Both Sentry and PostHog are already installed. This module
 * initializes them lazily from `process.env.EXPO_PUBLIC_*` keys and
 * no-ops gracefully when a key is missing — so dev builds without
 * secrets don't break, and production builds without configured keys
 * log a one-time warning but keep running.
 *
 * Usage from app/_layout.tsx:
 *
 *   import { initObservability } from '@/lib/observability';
 *   useEffect(() => { initObservability(); }, []);
 */

import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

interface ObservabilityState {
  sentryReady: boolean;
  posthog: PostHog | null;
}

const state: ObservabilityState = {
  sentryReady: false,
  posthog: null,
};

let warned = false;
function warnOnce(reason: string): void {
  if (warned || !__DEV__) return;
  warned = true;
  // Use console.warn so the dev build surfaces the warning in Metro.
  // Production silently proceeds without observability — no spam.
  // eslint-disable-next-line no-console
  console.warn(`[observability] ${reason}`);
}

function readEnv(key: string): string | undefined {
  // expo-constants surfaces EXPO_PUBLIC_ vars at build time; also fall
  // back to process.env for dev / test.
  const extra = Constants.expoConfig?.extra ?? {};
  return (
    (extra as Record<string, string | undefined>)[key] ??
    (process.env as Record<string, string | undefined>)[key]
  );
}

function initSentry(): void {
  const dsn = readEnv('EXPO_PUBLIC_SENTRY_DSN');
  if (!dsn) {
    warnOnce('EXPO_PUBLIC_SENTRY_DSN not set — crash reporting disabled.');
    return;
  }
  Sentry.init({
    dsn,
    environment: readEnv('EXPO_PUBLIC_ENVIRONMENT') ?? 'production',
    tracesSampleRate: 0.1,
    enableAutoPerformanceTracing: true,
    attachStacktrace: true,
    // Only enable in production / preview builds — dev reloads produce
    // too much noise to be useful in Sentry.
    enabled: !__DEV__,
  });
  state.sentryReady = true;
}

function initPosthog(): void {
  const apiKey = readEnv('EXPO_PUBLIC_POSTHOG_KEY');
  if (!apiKey) {
    warnOnce('EXPO_PUBLIC_POSTHOG_KEY not set — analytics disabled.');
    return;
  }
  const host = readEnv('EXPO_PUBLIC_POSTHOG_HOST') ?? 'https://app.posthog.com';
  state.posthog = new PostHog(apiKey, {
    host,
    // PostHog v3 batches events; flush on app background is default.
    flushAt: 20,
    flushInterval: 10_000,
  });
}

export function initObservability(): void {
  try {
    initSentry();
    initPosthog();
  } catch (err) {
    warnOnce(
      `init failed: ${(err as Error).message ?? 'unknown error'}`,
    );
  }
}

/** Identify the logged-in user across Sentry + PostHog. */
export function identify(userId: string, phone?: string): void {
  if (state.sentryReady) {
    Sentry.setUser({ id: userId, username: phone });
  }
  state.posthog?.identify(userId, phone ? { phone } : {});
}

/** Clear identity on logout. */
export function resetIdentity(): void {
  if (state.sentryReady) {
    Sentry.setUser(null);
  }
  state.posthog?.reset();
}

type TrackableValue = string | number | boolean | null;

/** Record a product event. Silently drops if PostHog isn't initialized. */
export function track(
  event: string,
  properties?: Record<string, TrackableValue>,
): void {
  if (!state.posthog) return;
  if (properties) {
    // PostHog rejects `undefined` values; strip them before send.
    const filtered: Record<string, TrackableValue> = {};
    for (const [k, v] of Object.entries(properties)) {
      if (v !== undefined) filtered[k] = v;
    }
    state.posthog.capture(event, filtered);
  } else {
    state.posthog.capture(event);
  }
}

/** Capture an exception to Sentry with optional context. */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!state.sentryReady) return;
  if (error instanceof Error) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureMessage(String(error), { extra: context });
  }
}
