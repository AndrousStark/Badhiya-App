/**
 * /admin/* — Super-admin panel stack.
 *
 * Auth guard: redirects to admin login if not authenticated.
 * Uses separate adminAuth$ store (not regular user auth).
 *
 * Routes:
 *   /admin              → login (if not auth'd) or dashboard
 *   /admin/businesses   → business search + list
 *   /admin/business/[id] → business detail
 *   /admin/users        → user search + stats
 *   /admin/user/[id]    → user 360 detail
 *   /admin/content      → banners + schemes management
 *   /admin/audit        → audit logs + system health
 */

import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function AdminLayout() {
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
