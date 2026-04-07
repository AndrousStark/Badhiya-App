/**
 * /team/* — Team management stack.
 *
 * Routes:
 *   /team                → dashboard (stats, members, attendance summary)
 *   /team/[memberId]     → member detail + attendance calendar
 *   /team/attendance     → daily attendance marking
 *   /team/payroll        → monthly payroll summary + actions
 *   /team/shifts         → weekly shift schedule
 *   /team/compliance     → PF/ESI/overtime status + config
 */

import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function TeamLayout() {
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
