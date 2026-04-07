/**
 * Admin panel schemas — super-admin management endpoints.
 *
 * Admin uses SEPARATE auth (email+password) from regular users (OTP).
 * All endpoints under /admin/* with AdminAuthGuard.
 *
 * 29 endpoints across: auth, dashboard, businesses, users, analytics,
 * content (banners/schemes), audit logs, system health.
 */

import { z } from 'zod';

// ─── Admin auth ─────────────────────────────────────────
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});
export type AdminLoginDto = z.infer<typeof adminLoginSchema>;

export const adminProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  permissions: z.array(z.string()),
});
export type AdminProfile = z.infer<typeof adminProfileSchema>;

export const adminLoginResponseSchema = z.object({
  token: z.string(),
  admin: adminProfileSchema,
});
export type AdminLoginResponse = z.infer<typeof adminLoginResponseSchema>;

// ─── Dashboard ──────────────────────────────────────────
export const adminDashboardSchema = z.object({
  totalBusinesses: z.coerce.number(),
  totalUsers: z.coerce.number(),
  dau: z.coerce.number(),
  mau: z.coerce.number(),
  revenueThisMonth: z.coerce.number(),
  avgHealthScore: z.coerce.number(),
  signups: z.object({
    today: z.coerce.number(),
    thisWeek: z.coerce.number(),
    thisMonth: z.coerce.number(),
  }),
});
export type AdminDashboard = z.infer<typeof adminDashboardSchema>;

// ─── Business ───────────────────────────────────────────
export const adminBusinessRowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    health_score: z.coerce.number().nullable().optional(),
    gst_number: z.string().nullable().optional(),
    created_at: z.string().optional(),
    user_id: z.string().nullable().optional(),
    user_name: z.string().nullable().optional(),
    user_phone: z.string().nullable().optional(),
    total_revenue: z.coerce.number().nullable().optional(),
    total_transactions: z.coerce.number().nullable().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    name: row.name,
    type: row.type ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    isActive: row.is_active ?? true,
    healthScore: row.health_score ?? 0,
    gstNumber: row.gst_number ?? null,
    createdAt: row.created_at ?? '',
    userId: row.user_id ?? null,
    userName: row.user_name ?? null,
    userPhone: row.user_phone ?? null,
    totalRevenue: row.total_revenue ?? 0,
    totalTransactions: row.total_transactions ?? 0,
  }));
export type AdminBusinessRow = z.infer<typeof adminBusinessRowSchema>;

export const adminBusinessListSchema = z.object({
  data: z.array(adminBusinessRowSchema),
  meta: z.object({
    total: z.coerce.number(),
    limit: z.coerce.number(),
    offset: z.coerce.number(),
  }),
});
export type AdminBusinessList = z.infer<typeof adminBusinessListSchema>;

export const adminBusinessDetailSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    health_score: z.coerce.number().nullable().optional(),
    gst_number: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    owner_name: z.string().nullable().optional(),
    owner_phone: z.string().nullable().optional(),
    owner_id: z.string().nullable().optional(),
    recentTransactions: z.array(z.unknown()).optional(),
    creditSummary: z.unknown().optional(),
    productCount: z.coerce.number().optional(),
    ondcOrderCount: z.coerce.number().optional(),
    lastActive: z.string().nullable().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    name: row.name,
    type: row.type ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    area: row.area ?? null,
    isActive: row.is_active ?? true,
    healthScore: row.health_score ?? 0,
    gstNumber: row.gst_number ?? null,
    createdAt: row.created_at ?? '',
    ownerName: row.owner_name ?? null,
    ownerPhone: row.owner_phone ?? null,
    ownerId: row.owner_id ?? null,
    recentTransactions: (row.recentTransactions ?? []) as unknown[],
    creditSummary: row.creditSummary as { totalOutstanding: number; customerCount: number } | null,
    productCount: row.productCount ?? 0,
    ondcOrderCount: row.ondcOrderCount ?? 0,
    lastActive: row.lastActive ?? null,
  }));
export type AdminBusinessDetail = z.infer<typeof adminBusinessDetailSchema>;

// ─── Users ──────────────────────────────────────────────
export const adminUserRowSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  language: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  lastActive: z.string().nullable().optional(),
  businessId: z.string().nullable().optional(),
  businessName: z.string().nullable().optional(),
  businessType: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  healthScore: z.coerce.number().optional(),
  transactionCount: z.coerce.number().optional(),
  totalRevenue: z.coerce.number().optional(),
  status: z.string().optional(),
});
export type AdminUserRow = z.infer<typeof adminUserRowSchema>;

export const adminUserListSchema = z.object({
  users: z.array(adminUserRowSchema),
  total: z.coerce.number(),
});
export type AdminUserList = z.infer<typeof adminUserListSchema>;

export const adminUserStatsSchema = z.object({
  total: z.coerce.number(),
  active7d: z.coerce.number(),
  new7d: z.coerce.number(),
  churned: z.coerce.number(),
});
export type AdminUserStats = z.infer<typeof adminUserStatsSchema>;

export const adminUserDetailSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  preferred_language: z.string().nullable().optional(),
  created_at: z.string().optional(),
  last_active_at: z.string().nullable().optional(),
  businesses: z.array(z.unknown()).optional(),
  subscription: z.unknown().nullable().optional(),
});
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

export const adminActivitySchema = z.object({
  activities: z.array(
    z.object({
      source: z.string(),
      id: z.string(),
      action: z.string(),
      details: z.unknown().nullable().optional(),
      created_at: z.string().optional(),
    }),
  ),
  total: z.coerce.number(),
});
export type AdminActivity = z.infer<typeof adminActivitySchema>;

export const adminNoteSchema = z.object({
  id: z.string(),
  admin_user_id: z.string().optional(),
  user_id: z.string().optional(),
  content: z.string(),
  created_at: z.string().optional(),
  admin_name: z.string().nullable().optional(),
});
export type AdminNote = z.infer<typeof adminNoteSchema>;

// ─── Analytics ──────────────────────────────────────────
export const cohortRowSchema = z.object({
  cohortMonth: z.string(),
  cohortSize: z.coerce.number(),
  retention: z.record(z.coerce.number()),
});
export type CohortRow = z.infer<typeof cohortRowSchema>;

export const funnelStepSchema = z.object({
  step: z.string(),
  count: z.coerce.number(),
  conversionFromStart: z.coerce.number(),
  conversionFromPrevious: z.coerce.number(),
});
export type FunnelStep = z.infer<typeof funnelStepSchema>;

// ─── Content — Banners ──────────────────────────────────
export const bannerTargetEnum = z.enum([
  'all',
  'free',
  'paid',
  'new_users',
  'inactive',
]);
export const bannerPositionEnum = z.enum([
  'dashboard_top',
  'dashboard_bottom',
  'sidebar',
  'modal',
  'whatsapp',
]);

export const adminBannerSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    title_hindi: z.string().nullable().optional(),
    subtitle: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    link_url: z.string().nullable().optional(),
    target_audience: z.string(),
    position: z.string(),
    priority: z.coerce.number(),
    is_active: z.boolean().optional(),
    starts_at: z.string().nullable().optional(),
    expires_at: z.string().nullable().optional(),
    created_at: z.string().optional(),
    created_by_name: z.string().nullable().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    title: row.title,
    titleHindi: row.title_hindi ?? null,
    subtitle: row.subtitle ?? null,
    imageUrl: row.image_url ?? null,
    linkUrl: row.link_url ?? null,
    targetAudience: row.target_audience,
    position: row.position,
    priority: row.priority,
    isActive: row.is_active ?? true,
    startsAt: row.starts_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at ?? '',
    createdByName: row.created_by_name ?? null,
  }));
export type AdminBanner = z.infer<typeof adminBannerSchema>;

export const adminBannerListSchema = z.object({
  data: z.array(adminBannerSchema),
  meta: z.object({
    total: z.coerce.number(),
    limit: z.coerce.number(),
    offset: z.coerce.number(),
  }),
});
export type AdminBannerList = z.infer<typeof adminBannerListSchema>;

export const createBannerSchema = z.object({
  title: z.string().min(1).max(255),
  titleHindi: z.string().max(255).optional(),
  subtitle: z.string().optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().optional(),
  targetAudience: bannerTargetEnum.default('all'),
  position: bannerPositionEnum.default('dashboard_top'),
  priority: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});
export type CreateBannerDto = z.infer<typeof createBannerSchema>;

// ─── Content — Schemes ──────────────────────────────────
export const adminSchemeSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    name_hindi: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    eligibility: z.unknown().optional(),
    benefits: z.string().nullable().optional(),
    max_amount: z.coerce.number().nullable().optional(),
    category: z.string().nullable().optional(),
    application_url: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    created_at: z.string().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    name: row.name,
    nameHindi: row.name_hindi ?? null,
    description: row.description ?? null,
    eligibility: row.eligibility as Record<string, unknown>,
    benefits: row.benefits ?? null,
    maxAmount: row.max_amount ?? null,
    category: row.category ?? null,
    applicationUrl: row.application_url ?? null,
    isActive: row.is_active ?? true,
    createdAt: row.created_at ?? '',
  }));
export type AdminScheme = z.infer<typeof adminSchemeSchema>;

export const adminSchemeListSchema = z.object({
  data: z.array(adminSchemeSchema),
  meta: z.object({
    total: z.coerce.number(),
    limit: z.coerce.number(),
    offset: z.coerce.number(),
  }),
});
export type AdminSchemeList = z.infer<typeof adminSchemeListSchema>;

export const createSchemeSchema = z.object({
  name: z.string().min(1).max(255),
  nameHindi: z.string().max(255).optional(),
  description: z.string().min(1),
  eligibility: z.record(z.unknown()),
  benefits: z.string().optional(),
  maxAmount: z.number().positive().optional(),
  category: z.string().optional(),
  applicationUrl: z.string().url().optional(),
});
export type CreateSchemeDto = z.infer<typeof createSchemeSchema>;

// ─── Audit logs ─────────────────────────────────────────
export const auditLogSchema = z
  .object({
    id: z.string(),
    admin_user_id: z.string().optional(),
    action: z.string(),
    resource_type: z.string().nullable().optional(),
    resource_id: z.string().nullable().optional(),
    metadata: z.unknown().nullable().optional(),
    created_at: z.string().optional(),
    admin_name: z.string().nullable().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    adminUserId: row.admin_user_id ?? '',
    action: row.action,
    resourceType: row.resource_type ?? null,
    resourceId: row.resource_id ?? null,
    metadata: row.metadata,
    createdAt: row.created_at ?? '',
    adminName: row.admin_name ?? null,
  }));
export type AuditLog = z.infer<typeof auditLogSchema>;

export const auditLogListSchema = z.object({
  data: z.array(auditLogSchema),
  meta: z.object({
    total: z.coerce.number(),
    limit: z.coerce.number(),
    offset: z.coerce.number(),
  }),
});
export type AuditLogList = z.infer<typeof auditLogListSchema>;

// ─── System health ──────────────────────────────────────
export const systemHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded']),
  timestamp: z.string(),
  database: z.object({
    connected: z.boolean(),
    latencyMs: z.coerce.number(),
    totalClients: z.coerce.number().optional(),
    idleClients: z.coerce.number().optional(),
    waitingClients: z.coerce.number().optional(),
    error: z.string().optional(),
  }),
  redis: z.object({
    connected: z.boolean(),
    latencyMs: z.coerce.number(),
    usedMemory: z.string().optional(),
    connectedClients: z.coerce.number().optional(),
    error: z.string().optional(),
  }),
});
export type SystemHealth = z.infer<typeof systemHealthSchema>;
