/**
 * Admin API — 29 endpoints under /admin/*.
 *
 * Admin uses SEPARATE auth from regular users. The admin JWT is
 * stored in adminAuth$ observable and passed via a custom admin
 * API client that injects the admin token.
 */

import { z } from 'zod';
import { api } from '@/lib/api';
import { adminAuth$ } from './store';
import {
  adminLoginResponseSchema,
  adminDashboardSchema,
  adminBusinessListSchema,
  adminBusinessDetailSchema,
  adminUserListSchema,
  adminUserStatsSchema,
  adminUserDetailSchema,
  adminActivitySchema,
  adminNoteSchema,
  cohortRowSchema,
  funnelStepSchema,
  adminBannerListSchema,
  adminBannerSchema,
  adminSchemeListSchema,
  adminSchemeSchema,
  auditLogListSchema,
  systemHealthSchema,
  type AdminLoginDto,
  type AdminLoginResponse,
  type AdminDashboard,
  type AdminBusinessList,
  type AdminBusinessDetail,
  type AdminUserList,
  type AdminUserStats,
  type AdminUserDetail,
  type AdminActivity,
  type AdminNote,
  type CohortRow,
  type FunnelStep,
  type AdminBannerList,
  type AdminBanner,
  type AdminSchemeList,
  type AdminScheme,
  type AuditLogList,
  type SystemHealth,
  type CreateBannerDto,
  type CreateSchemeDto,
} from './schemas';

/**
 * Admin API helper — injects admin JWT token.
 * Falls back to regular api client but overrides Authorization header.
 */
function adminHeaders(): { headers: Record<string, string> } {
  const token = adminAuth$.token.get();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : { headers: {} };
}

async function adminGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  return api.get<T>(`/admin${path}`, { params, ...adminHeaders() });
}

async function adminPost<T>(path: string, body?: unknown): Promise<T> {
  return api.post<T>(`/admin${path}`, body, adminHeaders());
}

async function adminPatch<T>(path: string, body?: unknown): Promise<T> {
  return api.patch<T>(`/admin${path}`, body, adminHeaders());
}

async function adminDelete<T>(path: string): Promise<T> {
  return api.delete<T>(`/admin${path}`, adminHeaders());
}

// ═══════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════

export async function adminLogin(dto: AdminLoginDto): Promise<AdminLoginResponse> {
  const data = await api.post<unknown>('/admin/auth/login', dto);
  return adminLoginResponseSchema.parse(data);
}

// ═══════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const data = await adminGet<unknown>('/dashboard');
  return adminDashboardSchema.parse(data);
}

// ═══════════════════════════════════════════════════════
//  BUSINESSES
// ═══════════════════════════════════════════════════════

export async function searchBusinesses(
  options: {
    query?: string;
    status?: string;
    city?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<AdminBusinessList> {
  const params: Record<string, string> = {};
  if (options.query) params.query = options.query;
  if (options.status) params.status = options.status;
  if (options.city) params.city = options.city;
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.offset !== undefined) params.offset = String(options.offset);
  const data = await adminGet<unknown>('/businesses', params);
  return adminBusinessListSchema.parse(data);
}

export async function getBusinessDetail(id: string): Promise<AdminBusinessDetail> {
  const data = await adminGet<unknown>(`/businesses/${id}`);
  return adminBusinessDetailSchema.parse(data);
}

export async function suspendBusiness(
  id: string,
  reason: string,
): Promise<{ success: boolean; message: string }> {
  return adminPost(`/businesses/${id}/suspend`, { reason });
}

export async function reactivateBusiness(
  id: string,
): Promise<{ success: boolean; message: string }> {
  return adminPost(`/businesses/${id}/reactivate`);
}

export async function impersonateBusiness(
  id: string,
  reason: string,
): Promise<{ token: string; expiresIn: number }> {
  return adminPost(`/businesses/${id}/impersonate`, { reason });
}

// ═══════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════

export async function searchUsers(
  options: { query?: string; isActive?: string; limit?: number; offset?: number } = {},
): Promise<AdminUserList> {
  const params: Record<string, string> = {};
  if (options.query) params.query = options.query;
  if (options.isActive) params.isActive = options.isActive;
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.offset !== undefined) params.offset = String(options.offset);
  const data = await adminGet<unknown>('/users', params);
  return adminUserListSchema.parse(data);
}

export async function getUserStats(): Promise<AdminUserStats> {
  const data = await adminGet<unknown>('/users/stats');
  return adminUserStatsSchema.parse(data);
}

export async function getUserDetail(id: string): Promise<AdminUserDetail> {
  const data = await adminGet<unknown>(`/users/${id}`);
  return adminUserDetailSchema.parse(data);
}

export async function getUserActivity(
  id: string,
  limit = 50,
  offset = 0,
): Promise<AdminActivity> {
  const data = await adminGet<unknown>(`/users/${id}/activity`, {
    limit: String(limit),
    offset: String(offset),
  });
  return adminActivitySchema.parse(data);
}

export async function getUserTransactions(id: string): Promise<unknown[]> {
  return adminGet<unknown[]>(`/users/${id}/transactions`);
}

export async function getUserCredit(id: string): Promise<unknown> {
  return adminGet(`/users/${id}/credit`);
}

export async function getUserBilling(id: string): Promise<unknown> {
  return adminGet(`/users/${id}/billing`);
}

export async function getUserNotes(id: string): Promise<AdminNote[]> {
  const data = await adminGet<unknown>(`/users/${id}/notes`);
  return z.array(adminNoteSchema).parse(data);
}

export async function addUserNote(
  id: string,
  content: string,
): Promise<AdminNote> {
  const data = await adminPost<unknown>(`/users/${id}/notes`, { content });
  return adminNoteSchema.parse(data);
}

export async function blockUser(
  id: string,
  reason: string,
): Promise<{ success: boolean }> {
  return adminPost(`/users/${id}/block`, { reason });
}

export async function unblockUser(id: string): Promise<{ success: boolean }> {
  return adminPost(`/users/${id}/unblock`);
}

// ═══════════════════════════════════════════════════════
//  ANALYTICS
// ═══════════════════════════════════════════════════════

export async function getAnalyticsOverview(): Promise<AdminDashboard> {
  const data = await adminGet<unknown>('/analytics/overview');
  return adminDashboardSchema.parse(data);
}

export async function getCohortRetention(months = 6): Promise<CohortRow[]> {
  const data = await adminGet<unknown>('/analytics/cohorts', {
    months: String(months),
  });
  return z.array(cohortRowSchema).parse(data);
}

export async function getFunnelData(): Promise<FunnelStep[]> {
  const data = await adminGet<unknown>('/analytics/funnels');
  return z.array(funnelStepSchema).parse(data);
}

// ═══════════════════════════════════════════════════════
//  CONTENT — BANNERS
// ═══════════════════════════════════════════════════════

export async function getBanners(
  options: { isActive?: string; position?: string; limit?: number; offset?: number } = {},
): Promise<AdminBannerList> {
  const params: Record<string, string> = {};
  if (options.isActive) params.isActive = options.isActive;
  if (options.position) params.position = options.position;
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.offset !== undefined) params.offset = String(options.offset);
  const data = await adminGet<unknown>('/content/banners', params);
  return adminBannerListSchema.parse(data);
}

export async function createBanner(dto: CreateBannerDto): Promise<AdminBanner> {
  const data = await adminPost<unknown>('/content/banners', dto);
  return adminBannerSchema.parse(data);
}

export async function updateBanner(
  id: string,
  dto: Partial<CreateBannerDto>,
): Promise<AdminBanner> {
  const data = await adminPatch<unknown>(`/content/banners/${id}`, dto);
  return adminBannerSchema.parse(data);
}

export async function deleteBanner(id: string): Promise<{ success: boolean }> {
  return adminDelete(`/content/banners/${id}`);
}

// ═══════════════════════════════════════════════════════
//  CONTENT — SCHEMES
// ═══════════════════════════════════════════════════════

export async function getSchemes(
  options: { category?: string; isActive?: string; limit?: number; offset?: number } = {},
): Promise<AdminSchemeList> {
  const params: Record<string, string> = {};
  if (options.category) params.category = options.category;
  if (options.isActive) params.isActive = options.isActive;
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.offset !== undefined) params.offset = String(options.offset);
  const data = await adminGet<unknown>('/content/schemes', params);
  return adminSchemeListSchema.parse(data);
}

export async function createScheme(dto: CreateSchemeDto): Promise<AdminScheme> {
  const data = await adminPost<unknown>('/content/schemes', dto);
  return adminSchemeSchema.parse(data);
}

// ═══════════════════════════════════════════════════════
//  AUDIT LOGS
// ═══════════════════════════════════════════════════════

export async function getAuditLogs(
  options: {
    action?: string;
    resourceType?: string;
    adminUserId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<AuditLogList> {
  const params: Record<string, string> = {};
  if (options.action) params.action = options.action;
  if (options.resourceType) params.resourceType = options.resourceType;
  if (options.adminUserId) params.adminUserId = options.adminUserId;
  if (options.dateFrom) params.dateFrom = options.dateFrom;
  if (options.dateTo) params.dateTo = options.dateTo;
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.offset !== undefined) params.offset = String(options.offset);
  const data = await adminGet<unknown>('/audit-logs', params);
  return auditLogListSchema.parse(data);
}

// ═══════════════════════════════════════════════════════
//  SYSTEM HEALTH
// ═══════════════════════════════════════════════════════

export async function getSystemHealth(): Promise<SystemHealth> {
  const data = await adminGet<unknown>('/system/health');
  return systemHealthSchema.parse(data);
}
