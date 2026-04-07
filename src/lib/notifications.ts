/**
 * Push notifications — expo-notifications setup.
 *
 * Handles:
 *   1. Permission request + push token registration
 *   2. Foreground notification display
 *   3. Notification tap → deep link routing
 *   4. Local notification inbox (persisted in MMKV)
 *
 * Called once from _layout.tsx after auth hydration.
 * Token is sent to backend via POST /users/:id/push-token (if endpoint exists).
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { api } from './api';
import { auth$ } from '@/stores/auth';

// ─── Notification inbox (local persistence) ─────────────
export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  receivedAt: string;
  isRead: boolean;
}

export const notificationInbox$ = observable<{
  items: LocalNotification[];
  unreadCount: number;
}>({
  items: [],
  unreadCount: 0,
});

syncObservable(notificationInbox$, {
  persist: {
    name: 'badhiya.notification-inbox',
    plugin: ObservablePersistMMKV,
  },
});

export function addToInbox(notification: Notifications.Notification): void {
  const content = notification.request.content;
  const item: LocalNotification = {
    id: notification.request.identifier,
    title: content.title ?? '',
    body: content.body ?? '',
    data: (content.data ?? {}) as Record<string, unknown>,
    receivedAt: new Date().toISOString(),
    isRead: false,
  };
  const current = notificationInbox$.items.get();
  notificationInbox$.items.set([item, ...current].slice(0, 100)); // keep 100 max
  notificationInbox$.unreadCount.set(
    notificationInbox$.unreadCount.get() + 1,
  );
}

export function markAllRead(): void {
  const items = notificationInbox$.items.get().map((i) => ({ ...i, isRead: true }));
  notificationInbox$.items.set(items);
  notificationInbox$.unreadCount.set(0);
}

export function markRead(id: string): void {
  const items = notificationInbox$.items.get().map((i) =>
    i.id === id ? { ...i, isRead: true } : i,
  );
  notificationInbox$.items.set(items);
  notificationInbox$.unreadCount.set(items.filter((i) => !i.isRead).length);
}

export function clearInbox(): void {
  notificationInbox$.items.set([]);
  notificationInbox$.unreadCount.set(0);
}

// ─── Foreground handler ─────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Token registration ─────────────────────────────────
async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Badhiya',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  return tokenData.data;
}

async function sendTokenToBackend(token: string): Promise<void> {
  const userId = auth$.userId.get();
  if (!userId) return;
  try {
    await api.post(`/users/${userId}/push-token`, {
      token,
      platform: Platform.OS,
    });
  } catch {
    // Endpoint may not exist yet — silently ignore
  }
}

// ─── Deep link handler ──────────────────────────────────
function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const data = response.notification.request.content.data as Record<
    string,
    string
  >;
  if (data?.route) {
    router.push(data.route as any);
  }
}

// ─── Hook to initialize in _layout.tsx ──────────────────
export function useNotificationSetup(): void {
  const responseListener = useRef<Notifications.EventSubscription>();
  const receivedListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Register token
    registerForPushNotifications().then((token) => {
      if (token) sendTokenToBackend(token);
    });

    // Listen for received (foreground)
    receivedListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        addToInbox(notification);
      });

    // Listen for tap
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse,
      );

    return () => {
      if (receivedListener.current) {
        Notifications.removeNotificationSubscription(
          receivedListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(
          responseListener.current,
        );
      }
    };
  }, []);
}
