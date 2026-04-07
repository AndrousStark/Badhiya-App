import { useQuery } from '@tanstack/react-query';
import { listNotifications } from './api';
import type { Notification } from './schemas';
import { auth$ } from '@/stores/auth';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (businessId: string) =>
    [...notificationKeys.all, 'list', businessId] as const,
};

export function useNotifications() {
  const businessId = auth$.businessId.get();
  return useQuery<Notification[]>({
    queryKey: notificationKeys.list(businessId ?? 'none'),
    queryFn: () => listNotifications(businessId!),
    enabled: !!businessId,
    staleTime: 60_000,
    refetchInterval: 2 * 60_000, // refresh every 2 min
  });
}
