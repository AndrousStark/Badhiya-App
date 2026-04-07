import { z } from 'zod';
import { api } from '@/lib/api';
import { notificationSchema, type Notification } from './schemas';

/**
 * GET /businesses/:id/notifications
 *
 * Backend aggregates 3 categories on the fly:
 *   - low-stock products (top 3)
 *   - overdue customers (top 3)
 *   - recent sales (top 3)
 */
export async function listNotifications(
  businessId: string,
): Promise<Notification[]> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/notifications`,
  );
  return z.array(notificationSchema).parse(data);
}
