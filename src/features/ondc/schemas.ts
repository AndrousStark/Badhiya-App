/**
 * ONDC feature schemas — seller management API surface.
 *
 * Backend endpoints (under /businesses/:id/ondc):
 *   GET  /config                          — current seller config (or {registered: false})
 *   POST /register                        — register as ONDC seller
 *   PATCH /config                         — update config
 *   POST /toggle                          — go live / pause
 *   POST /catalog/sync                    — sync products to ONDC
 *   GET  /catalog/items                   — list listed items
 *   POST /catalog/delist/:productId       — remove from catalog
 *   GET  /orders                          — list ONDC orders
 *   PATCH /orders/:orderId/status         — accept/progress/complete/cancel
 *   GET  /stats                           — dashboard KPIs
 *
 * Numeric fields come back as PG strings — coerce.
 */

import { z } from 'zod';

// ─── Seller config ──────────────────────────────────────
export const ondcConfigUnregisteredSchema = z.object({
  registered: z.literal(false),
  message: z.string().optional(),
});

export const ondcConfigRegisteredSchema = z
  .object({
    registered: z.literal(true).optional(),
    id: z.string().optional(),
    business_id: z.string().optional(),
    store_name: z.string().optional(),
    store_email: z.string().nullable().optional(),
    store_phone: z.string().optional(),
    store_address: z.unknown().optional(),
    fssai_license: z.string().nullable().optional(),
    gst_number: z.string().nullable().optional(),
    serviceability_radius_km: z.coerce.number().nullable().optional(),
    avg_preparation_time_min: z.coerce.number().nullable().optional(),
    delivery_mode: z.string().nullable().optional(),
    operating_hours: z.unknown().optional(),
    is_active: z.boolean().optional(),
    bpp_id: z.string().nullable().optional(),
    bpp_uri: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough()
  .transform((row) => ({
    registered: true as const,
    id: row.id ?? '',
    storeName: row.store_name ?? '',
    storeEmail: row.store_email ?? null,
    storePhone: row.store_phone ?? '',
    storeAddress: row.store_address ?? null,
    fssaiLicense: row.fssai_license ?? null,
    gstNumber: row.gst_number ?? null,
    serviceabilityRadiusKm: row.serviceability_radius_km ?? 5,
    avgPreparationTimeMin: row.avg_preparation_time_min ?? 30,
    deliveryMode: (row.delivery_mode as 'self' | 'logistics' | 'both') ?? 'self',
    operatingHours: row.operating_hours ?? null,
    isActive: row.is_active ?? false,
    bppId: row.bpp_id ?? null,
    bppUri: row.bpp_uri ?? null,
    createdAt: row.created_at ?? '',
  }));

export const ondcConfigResponseSchema = z.union([
  ondcConfigUnregisteredSchema,
  ondcConfigRegisteredSchema,
]);
export type OndcConfig = z.infer<typeof ondcConfigResponseSchema>;
export type OndcConfigRegistered = z.infer<typeof ondcConfigRegisteredSchema>;

// ─── Register seller request ────────────────────────────
export const registerSellerSchema = z.object({
  storeName: z.string().min(1, 'Shop name required').max(255),
  storeEmail: z.string().email('Invalid email').optional().or(z.literal('').transform(() => undefined)),
  storePhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  storeAddress: z.object({
    door: z.string().optional(),
    building: z.string().optional(),
    street: z.string().min(1, 'Street required'),
    locality: z.string().min(1, 'Locality required'),
    city: z.string().min(1, 'City required'),
    state: z.string().min(1, 'State required'),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
    gps: z
      .string()
      .regex(/^-?\d+\.\d+,\s*-?\d+\.\d+$/, 'Invalid GPS (lat,lng)'),
  }),
  fssaiLicense: z.string().max(20).optional().or(z.literal('').transform(() => undefined)),
  gstNumber: z
    .string()
    .regex(
      /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/,
      'Invalid GST number',
    )
    .optional()
    .or(z.literal('').transform(() => undefined)),
  serviceabilityRadiusKm: z.number().min(1).max(50).default(5),
  avgPreparationTimeMin: z.number().int().min(5).max(180).default(30),
  deliveryMode: z.enum(['self', 'logistics', 'both']).default('self'),
});
export type RegisterSellerDto = z.infer<typeof registerSellerSchema>;

// ─── Stats ──────────────────────────────────────────────
export const ondcStatsSchema = z.object({
  totalOrders: z.coerce.number(),
  totalRevenue: z.coerce.number(),
  pendingOrders: z.coerce.number(),
  completedOrders: z.coerce.number(),
  cancelledOrders: z.coerce.number(),
  avgOrderValue: z.coerce.number().optional(),
});
export type OndcStats = z.infer<typeof ondcStatsSchema>;

// ─── Catalog item ───────────────────────────────────────
export const ondcCatalogItemSchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    product_id: z.string().optional(),
    product_name: z.string().nullable().optional(),
    productName: z.string().nullable().optional(),
    ondc_category: z.string().nullable().optional(),
    list_price: z.coerce.number().nullable().optional(),
    is_listed: z.boolean().optional(),
    image_url: z.string().nullable().optional(),
    last_synced_at: z.string().nullable().optional(),
    created_at: z.string().optional(),
  })
  .transform((row) => ({
    id: row.id,
    productId: row.product_id ?? '',
    productName: row.productName ?? row.product_name ?? 'Unknown',
    ondcCategory: row.ondc_category ?? null,
    listPrice: row.list_price ?? 0,
    isListed: row.is_listed ?? true,
    imageUrl: row.image_url ?? null,
    lastSyncedAt: row.last_synced_at ?? null,
  }));
export type OndcCatalogItem = z.infer<typeof ondcCatalogItemSchema>;

// ─── ONDC order row ─────────────────────────────────────
export const ondcOrderRowSchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    order_id: z.string().nullable().optional(),
    transaction_id: z.string().nullable().optional(),
    state: z.string(),
    customer_name: z.string().nullable().optional(),
    customer_phone: z.string().nullable().optional(),
    items: z.unknown().optional(),
    quote: z.unknown().optional(),
    fulfillment_state: z.string().nullable().optional(),
    tracking_url: z.string().nullable().optional(),
    bap_id: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough()
  .transform((row) => {
    // Try to extract total amount from quote.price.value
    let total = 0;
    try {
      const quote = row.quote as { price?: { value?: string | number } } | null;
      if (quote?.price?.value) {
        total = parseFloat(String(quote.price.value));
      }
    } catch {
      /* ignore */
    }
    let itemCount = 0;
    try {
      const items = row.items as Array<unknown> | null;
      if (Array.isArray(items)) itemCount = items.length;
    } catch {
      /* ignore */
    }
    return {
      id: row.id,
      orderId: row.order_id ?? row.transaction_id ?? row.id,
      transactionId: row.transaction_id ?? null,
      state: row.state,
      customerName: row.customer_name ?? 'Anonymous',
      customerPhone: row.customer_phone ?? null,
      total,
      itemCount,
      items: row.items,
      quote: row.quote,
      fulfillmentState: row.fulfillment_state ?? null,
      trackingUrl: row.tracking_url ?? null,
      bapId: row.bap_id ?? null,
      createdAt: row.created_at ?? '',
      updatedAt: row.updated_at ?? '',
    };
  });
export type OndcOrder = z.infer<typeof ondcOrderRowSchema>;

export const ondcOrderListSchema = z.object({
  data: z.array(ondcOrderRowSchema),
  total: z.coerce.number(),
});
export type OndcOrderList = z.infer<typeof ondcOrderListSchema>;

// ─── Update order status ────────────────────────────────
export const updateOrderStatusSchema = z.object({
  state: z.enum(['Accepted', 'In-progress', 'Completed', 'Cancelled']),
  cancellationReasonCode: z.string().optional(),
  trackingUrl: z.string().url().optional(),
});
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

// ─── Catalog sync request ───────────────────────────────
export const catalogSyncSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(500),
  categoryId: z.string().optional(),
});
export type CatalogSyncDto = z.infer<typeof catalogSyncSchema>;

// ─── Order state metadata ───────────────────────────────
export const ORDER_STATE_FLOW = [
  { key: 'Created', label: 'Naya order', emoji: '🆕', tone: 'trust' as const },
  { key: 'Accepted', label: 'Accepted', emoji: '✅', tone: 'profit' as const },
  { key: 'In-progress', label: 'Tayyari mein', emoji: '👨‍🍳', tone: 'warning' as const },
  { key: 'Completed', label: 'Delivered', emoji: '📦', tone: 'profit' as const },
  { key: 'Cancelled', label: 'Cancel', emoji: '❌', tone: 'loss' as const },
] as const;

export const ORDER_STATE_META: Record<
  string,
  { label: string; emoji: string; tone: 'trust' | 'profit' | 'warning' | 'loss' }
> = Object.fromEntries(
  ORDER_STATE_FLOW.map((s) => [s.key, { label: s.label, emoji: s.emoji, tone: s.tone }]),
);

// ─── ONDC categories (RET10 Grocery) ────────────────────
export const ONDC_CATEGORIES = [
  'Fruits and Vegetables',
  'Masala & Seasoning',
  'Oil & Ghee',
  'Foodgrains',
  'Eggs, Meat & Fish',
  'Cleaning & Household',
  'Beverages',
  'Beauty & Hygiene',
  'Bakery, Cakes & Dairy',
  'Snacks & Branded Foods',
  'Baby Care',
  'Pet Care',
  'Stationery',
] as const;
export type OndcCategoryKey = (typeof ONDC_CATEGORIES)[number];
