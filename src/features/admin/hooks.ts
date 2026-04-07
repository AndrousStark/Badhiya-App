/**
 * TanStack Query hooks for admin panel.
 *
 * All hooks check adminAuth$.isAuthenticated before enabling queries.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminLogin,
  getAdminDashboard,
  searchBusinesses,
  getBusinessDetail,
  suspendBusiness,
  reactivateBusiness,
  searchUsers,
  getUserStats,
  getUserDetail,
  getUserActivity,
  getUserNotes,
  addUserNote,
  blockUser,
  unblockUser,
  getCohortRetention,
  getFunnelData,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getSchemes,
  createScheme,
  getAuditLogs,
  getSystemHealth,
} from './api';
import { adminAuth$, hydrateAdminAuth } from './store';
import type {
  AdminLoginDto,
  AdminDashboard,
  AdminBusinessList,
  AdminBusinessDetail,
  AdminUserList,
  AdminUserStats,
  AdminUserDetail,
  AdminActivity,
  AdminNote,
  CohortRow,
  FunnelStep,
  AdminBannerList,
  AdminBanner,
  AdminSchemeList,
  AdminScheme,
  AuditLogList,
  SystemHealth,
  CreateBannerDto,
  CreateSchemeDto,
} from './schemas';
import { haptic } from '@/lib/haptics';

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  businesses: (query?: string) => [...adminKeys.all, 'businesses', query ?? ''] as const,
  business: (id: string) => [...adminKeys.all, 'business', id] as const,
  users: (query?: string) => [...adminKeys.all, 'users', query ?? ''] as const,
  userStats: () => [...adminKeys.all, 'user-stats'] as const,
  user: (id: string) => [...adminKeys.all, 'user', id] as const,
  userActivity: (id: string) => [...adminKeys.all, 'user-activity', id] as const,
  userNotes: (id: string) => [...adminKeys.all, 'user-notes', id] as const,
  cohorts: () => [...adminKeys.all, 'cohorts'] as const,
  funnels: () => [...adminKeys.all, 'funnels'] as const,
  banners: () => [...adminKeys.all, 'banners'] as const,
  schemes: () => [...adminKeys.all, 'schemes'] as const,
  auditLogs: () => [...adminKeys.all, 'audit-logs'] as const,
  health: () => [...adminKeys.all, 'health'] as const,
};

const isAdmin = () => adminAuth$.isAuthenticated.get();

// ─── Auth ───────────────────────────────────────────────
export function useAdminLogin() {
  return useMutation<{ token: string; admin: any }, Error, AdminLoginDto>({
    mutationFn: adminLogin,
    onSuccess: (data) => {
      haptic('confirm');
      hydrateAdminAuth(data.token, data.admin);
    },
    onError: () => haptic('error'),
  });
}

// ─── Dashboard ──────────────────────────────────────────
export function useAdminDashboard() {
  return useQuery<AdminDashboard>({
    queryKey: adminKeys.dashboard(),
    queryFn: getAdminDashboard,
    enabled: isAdmin(),
    staleTime: 60_000,
  });
}

// ─── Businesses ─────────────────────────────────────────
export function useAdminBusinesses(query?: string) {
  return useQuery<AdminBusinessList>({
    queryKey: adminKeys.businesses(query),
    queryFn: () => searchBusinesses({ query, limit: 30 }),
    enabled: isAdmin(),
    staleTime: 30_000,
  });
}

export function useAdminBusinessDetail(id: string | undefined) {
  return useQuery<AdminBusinessDetail>({
    queryKey: adminKeys.business(id ?? 'none'),
    queryFn: () => getBusinessDetail(id!),
    enabled: isAdmin() && !!id,
    staleTime: 30_000,
  });
}

export function useSuspendBusiness() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => suspendBusiness(id, reason),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: () => haptic('error'),
  });
}

export function useReactivateBusiness() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: reactivateBusiness,
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: () => haptic('error'),
  });
}

// ─── Users ──────────────────────────────────────────────
export function useAdminUsers(query?: string) {
  return useQuery<AdminUserList>({
    queryKey: adminKeys.users(query),
    queryFn: () => searchUsers({ query, limit: 30 }),
    enabled: isAdmin(),
    staleTime: 30_000,
  });
}

export function useAdminUserStats() {
  return useQuery<AdminUserStats>({
    queryKey: adminKeys.userStats(),
    queryFn: getUserStats,
    enabled: isAdmin(),
    staleTime: 60_000,
  });
}

export function useAdminUserDetail(id: string | undefined) {
  return useQuery<AdminUserDetail>({
    queryKey: adminKeys.user(id ?? 'none'),
    queryFn: () => getUserDetail(id!),
    enabled: isAdmin() && !!id,
    staleTime: 30_000,
  });
}

export function useAdminUserActivity(id: string | undefined) {
  return useQuery<AdminActivity>({
    queryKey: adminKeys.userActivity(id ?? 'none'),
    queryFn: () => getUserActivity(id!),
    enabled: isAdmin() && !!id,
    staleTime: 60_000,
  });
}

export function useAdminUserNotes(id: string | undefined) {
  return useQuery<AdminNote[]>({
    queryKey: adminKeys.userNotes(id ?? 'none'),
    queryFn: () => getUserNotes(id!),
    enabled: isAdmin() && !!id,
    staleTime: 30_000,
  });
}

export function useAddUserNote(userId: string) {
  const qc = useQueryClient();
  return useMutation<AdminNote, Error, string>({
    mutationFn: (content) => addUserNote(userId, content),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: adminKeys.userNotes(userId) });
    },
    onError: () => haptic('error'),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => blockUser(id, reason),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: () => haptic('error'),
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: unblockUser,
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: () => haptic('error'),
  });
}

// ─── Analytics ──────────────────────────────────────────
export function useAdminCohorts(months = 6) {
  return useQuery<CohortRow[]>({
    queryKey: adminKeys.cohorts(),
    queryFn: () => getCohortRetention(months),
    enabled: isAdmin(),
    staleTime: 5 * 60_000,
  });
}

export function useAdminFunnels() {
  return useQuery<FunnelStep[]>({
    queryKey: adminKeys.funnels(),
    queryFn: getFunnelData,
    enabled: isAdmin(),
    staleTime: 5 * 60_000,
  });
}

// ─── Content ────────────────────────────────────────────
export function useAdminBanners() {
  return useQuery<AdminBannerList>({
    queryKey: adminKeys.banners(),
    queryFn: () => getBanners({ limit: 50 }),
    enabled: isAdmin(),
    staleTime: 60_000,
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation<AdminBanner, Error, CreateBannerDto>({
    mutationFn: createBanner,
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: adminKeys.banners() });
    },
    onError: () => haptic('error'),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation<AdminBanner, Error, { id: string; dto: Partial<CreateBannerDto> }>({
    mutationFn: ({ id, dto }) => updateBanner(id, dto),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: adminKeys.banners() });
    },
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteBanner,
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: adminKeys.banners() });
    },
  });
}

export function useAdminSchemes() {
  return useQuery<AdminSchemeList>({
    queryKey: adminKeys.schemes(),
    queryFn: () => getSchemes({ limit: 50 }),
    enabled: isAdmin(),
    staleTime: 60_000,
  });
}

export function useCreateScheme() {
  const qc = useQueryClient();
  return useMutation<AdminScheme, Error, CreateSchemeDto>({
    mutationFn: createScheme,
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: adminKeys.schemes() });
    },
    onError: () => haptic('error'),
  });
}

// ─── Audit + System ─────────────────────────────────────
export function useAuditLogs(filters: { action?: string; resourceType?: string } = {}) {
  return useQuery<AuditLogList>({
    queryKey: [...adminKeys.auditLogs(), filters.action ?? '', filters.resourceType ?? ''],
    queryFn: () => getAuditLogs({ ...filters, limit: 50 }),
    enabled: isAdmin(),
    staleTime: 30_000,
  });
}

export function useSystemHealth() {
  return useQuery<SystemHealth>({
    queryKey: adminKeys.health(),
    queryFn: getSystemHealth,
    enabled: isAdmin(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
