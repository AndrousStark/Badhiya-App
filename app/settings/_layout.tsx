/**
 * /settings/* — Settings & account management stack.
 *
 * Routes:
 *   /settings/profile       → Dukan Profile editing
 *   /settings/gst           → GST & Udyam info
 *   /settings/language      → Language picker
 *   /settings/notifications → Notification preferences
 *   /settings/biometric     → Biometric lock toggle
 *   /settings/help          → Help & support
 *   /settings/subscription  → Plan & subscription management
 */

import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function SettingsLayout() {
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
