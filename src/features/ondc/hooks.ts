/**
 * TanStack Query hooks for ONDC commerce.
 *
 * Phase 9: ONLINE-FIRST. Order acceptance is critical and time-sensitive
 * — ONDC gives 2-minute windows for accept/reject — so offline writes
 * don't make sense here. Reads are cached for snappy UX.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getOndcConfig,
  registerOndcSeller,
  updateOndcConfig,
  toggleOndcActive,
  syncCatalog,
  getCatalogItems,
  delistProduct,
  listOndcOrders,
  updateOrderStatus,
  getOndcStats,
} from './api';
import type {
  OndcConfig,
  OndcStats,
  OndcCatalogItem,
  OndcOrderList,
  RegisterSellerDto,
  CatalogSyncDto,
  UpdateOrderStatusDto,
  OndcConfigRegistered,
} from './schemas';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';

export const ondcKeys = {
  all: ['ondc'] as const,
  config: (businessId: string) => [...ondcKeys.all, 'config', businessId] as const,
  stats: (businessId: string) => [...ondcKeys.all, 'stats', businessId] as const,
  orders: (businessId: string, state?: string) =>
    [...ondcKeys.all, 'orders', businessId, state ?? 'all'] as const,
  catalog: (businessId: string) =>
    [...ondcKeys.all, 'catalog', businessId] as const,
};

// ─── Reads ──────────────────────────────────────────────
export function useOndcConfig() {
  const businessId = auth$.businessId.get();
  return useQuery<OndcConfig>({
    queryKey: ondcKeys.config(businessId ?? 'none'),
    queryFn: () => getOndcConfig(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
}

export function useOndcStats() {
  const businessId = auth$.businessId.get();
  return useQuery<OndcStats>({
    queryKey: ondcKeys.stats(businessId ?? 'none'),
    queryFn: () => getOndcStats(businessId!),
    enabled: !!businessId,
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
  });
}

export function useOndcOrders(state?: string) {
  const businessId = auth$.businessId.get();
  return useQuery<OndcOrderList>({
    queryKey: ondcKeys.orders(businessId ?? 'none', state),
    queryFn: () => listOndcOrders(businessId!, { state, limit: 50 }),
    enabled: !!businessId,
    staleTime: 30_000,
    refetchInterval: 60_000, // poll for new orders
  });
}

export function useOndcCatalog() {
  const businessId = auth$.businessId.get();
  return useQuery<OndcCatalogItem[]>({
    queryKey: ondcKeys.catalog(businessId ?? 'none'),
    queryFn: () => getCatalogItems(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
}

// ─── Writes ─────────────────────────────────────────────
export function useRegisterOndcSeller() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();
  return useMutation<OndcConfigRegistered, Error, RegisterSellerDto>({
    mutationFn: (dto) => registerOndcSeller(businessId!, dto),
    onSuccess: () => {
      haptic('revealMoney');
      queryClient.invalidateQueries({ queryKey: ondcKeys.config(businessId ?? 'none') });
    },
    onError: () => haptic('error'),
  });
}

export function useUpdateOndcConfig() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();
  return useMutation<OndcConfigRegistered, Error, Partial<RegisterSellerDto>>({
    mutationFn: (updates) => updateOndcConfig(businessId!, updates),
    onSuccess: () => {
      haptic('confirm');
      queryClient.invalidateQueries({ queryKey: ondcKeys.config(businessId ?? 'none') });
    },
  });
}

export function useToggleOndcActive() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();
  return useMutation<{ isActive: boolean }, Error, boolean>({
    mutationFn: (isActive) => toggleOndcActive(businessId!, isActive),
    onSuccess: () => {
      haptic('confirm');
      queryClient.invalidateQueries({ queryKey: ondcKeys.config(businessId ?? 'none') });
    },
  });
}

export function useSyncCatalog() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();
  return useMutation<
    { synced: number; skipped: number; failed: number },
    Error,
    CatalogSyncDto
  >({
    mutationFn: (dto) => syncCatalog(businessId!, dto),
    onSuccess: () => {
      haptic('revealMoney');
      queryClient.invalidateQueries({ queryKey: ondcKeys.catalog(businessId ?? 'none') });
    },
    onError: () => haptic('error'),
  });
}

export function useDelistProduct() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();
  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (productId) => delistProduct(businessId!, productId),
    onSuccess: () => {
      haptic('confirm');
      queryClient.invalidateQueries({ queryKey: ondcKeys.catalog(businessId ?? 'none') });
    },
  });
}

export function useUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();
  return useMutation<unknown, Error, UpdateOrderStatusDto>({
    mutationFn: (dto) => updateOrderStatus(businessId!, orderId, dto),
    onSuccess: () => {
      haptic('confirm');
      queryClient.invalidateQueries({ queryKey: ondcKeys.orders(businessId ?? 'none') });
      queryClient.invalidateQueries({ queryKey: ondcKeys.stats(businessId ?? 'none') });
    },
    onError: () => haptic('error'),
  });
}
