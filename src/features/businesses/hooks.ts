import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createBusiness,
  getDashboard,
  getStoreStats,
  getSchemeMatches,
} from './api';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';
import type {
  Business,
  CreateBusinessDto,
  Dashboard,
  StoreStats,
  SchemeMatch,
} from './schemas';

// ─── Query keys ──────────────────────────────────────────
export const businessKeys = {
  all: ['businesses'] as const,
  dashboard: (id: string) => [...businessKeys.all, 'dashboard', id] as const,
  storeStats: (id: string) => [...businessKeys.all, 'store-stats', id] as const,
  schemes: (id: string) => [...businessKeys.all, 'schemes', id] as const,
};

// ─── Dashboard query ────────────────────────────────────
export function useDashboard() {
  const businessId = auth$.businessId.get();
  return useQuery<Dashboard>({
    queryKey: businessKeys.dashboard(businessId ?? 'none'),
    queryFn: () => getDashboard(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
    refetchInterval: 60_000, // background refresh every minute
  });
}

// ─── Store stats query ──────────────────────────────────
export function useStoreStats() {
  const businessId = auth$.businessId.get();
  return useQuery<StoreStats>({
    queryKey: businessKeys.storeStats(businessId ?? 'none'),
    queryFn: () => getStoreStats(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

// ─── Government schemes query ───────────────────────────
export function useSchemeMatches() {
  const businessId = auth$.businessId.get();
  return useQuery<SchemeMatch[]>({
    queryKey: businessKeys.schemes(businessId ?? 'none'),
    queryFn: () => getSchemeMatches(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60_000, // schemes don't change often
  });
}

/**
 * Create business mutation — called on submit of the onboarding wizard.
 * On success hydrates the auth store with business context so the
 * dashboard tabs have everything they need.
 */
export function useCreateBusiness() {
  return useMutation<Business, Error, CreateBusinessDto>({
    mutationFn: (dto) => createBusiness(dto),
    onSuccess: (biz) => {
      auth$.set({
        ...auth$.get(),
        businessId: biz.id,
        businessName: biz.name,
        businessType: biz.type,
        businessCity: biz.city,
        healthScore: biz.healthScore ?? null,
        healthTier: (biz.healthLevel as never) ?? null,
      });
      haptic('revealMoney');
    },
    onError: () => {
      haptic('error');
    },
  });
}
