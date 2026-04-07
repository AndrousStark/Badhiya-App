/**
 * TanStack Query hooks for the products feature.
 *
 * Phase 6: ONLINE-FIRST. Phase 6.5 will add offline-first writes via
 * the local Drizzle products table (already scaffolded).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listProducts,
  getLowStockAlerts,
  addProduct,
  updateStock,
} from './api';
import type {
  Product,
  AddProductDto,
  UpdateStockDto,
} from './schemas';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';
import { businessKeys } from '@/features/businesses/hooks';

// ─── Query keys ──────────────────────────────────────────
export const productKeys = {
  all: ['products'] as const,
  list: (businessId: string) => [...productKeys.all, 'list', businessId] as const,
  lowStock: (businessId: string) =>
    [...productKeys.all, 'low-stock', businessId] as const,
};

// ─── Reads ──────────────────────────────────────────────
export function useProducts() {
  const businessId = auth$.businessId.get();
  return useQuery<Product[]>({
    queryKey: productKeys.list(businessId ?? 'none'),
    queryFn: () => listProducts(businessId!),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useLowStockAlerts() {
  const businessId = auth$.businessId.get();
  return useQuery<Product[]>({
    queryKey: productKeys.lowStock(businessId ?? 'none'),
    queryFn: () => getLowStockAlerts(businessId!),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

// ─── Writes ─────────────────────────────────────────────
export function useAddProduct() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();

  return useMutation<Product, Error, AddProductDto>({
    mutationFn: (dto) => addProduct(businessId!, dto),
    onSuccess: () => {
      haptic('confirm');
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
    },
    onError: () => haptic('error'),
  });
}

export function useUpdateStock(productId: string) {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();

  return useMutation<Product, Error, UpdateStockDto>({
    mutationFn: (dto) => updateStock(businessId!, productId, dto),
    onSuccess: () => {
      haptic('confirm');
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: () => haptic('error'),
  });
}
