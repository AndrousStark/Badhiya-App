/**
 * Notifications feature schemas.
 *
 * Backend GET /businesses/:id/notifications returns:
 *   Array<{ type: 'stock' | 'credit' | 'sale' | string, message: string, time: string }>
 *
 * The shape is loose so we permissively parse and add a normalized
 * 'tone' for the UI.
 */

import { z } from 'zod';

export const notificationTypes = [
  'stock',
  'credit',
  'sale',
  'milestone',
  'scheme',
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notificationSchema = z
  .object({
    type: z.string(),
    message: z.string(),
    time: z.string(),
  })
  .transform((row) => {
    const t = row.type as NotificationType;
    return {
      id: `${row.type}-${row.message.slice(0, 20)}-${row.time}`,
      type: t,
      message: row.message,
      time: row.time,
      tone: toneFor(t),
      icon: iconFor(t),
    };
  });

export type Notification = z.infer<typeof notificationSchema>;

function toneFor(t: NotificationType): 'profit' | 'loss' | 'warning' | 'trust' | 'saffron' {
  switch (t) {
    case 'sale':
      return 'profit';
    case 'credit':
      return 'warning';
    case 'stock':
      return 'loss';
    case 'milestone':
      return 'saffron';
    case 'scheme':
      return 'trust';
    default:
      return 'trust';
  }
}

function iconFor(t: NotificationType): string {
  switch (t) {
    case 'sale':
      return '💰';
    case 'credit':
      return '💳';
    case 'stock':
      return '📦';
    case 'milestone':
      return '🏆';
    case 'scheme':
      return '🏛️';
    default:
      return '🔔';
  }
}
