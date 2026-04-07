/**
 * /ondc/* — ONDC commerce stack layout.
 *
 * Routes:
 *   /ondc                       → dashboard (config + stats + orders list)
 *   /ondc/orders/[orderId]      → single order detail with status timeline
 *   /ondc/catalog               → catalog management + product picker
 */

import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function OndcLayout() {
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
