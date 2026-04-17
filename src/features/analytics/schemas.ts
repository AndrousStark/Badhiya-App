/**
 * Analytics feature schemas.
 *
 * Backend endpoints (under /businesses/:id/analytics):
 *   GET /revenue/chart?days=N             — daily revenue points
 *   GET /pnl/monthly?year=&month=         — daily P&L breakdown for a month
 *   GET /expenses/breakdown?year=&month=  — expenses grouped by category
 *   GET /health-score/breakdown            — 6-component health score
 *   GET /report/monthly?year=&month=      — full monthly report
 *
 * All numeric fields come back as PG strings — coerce.
 */

import { z } from 'zod';

// ─── Revenue chart point ─────────────────────────────────
export const revenuePointSchema = z
  .object({
    date: z.string(),
    revenue: z.coerce.number(),
  })
  .transform((row) => ({
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : row.date,
    revenue: row.revenue,
  }));
export type RevenuePoint = z.infer<typeof revenuePointSchema>;
export const revenueChartSchema = z.array(revenuePointSchema);

// ─── Monthly P&L ─────────────────────────────────────────
export const pnlDayPointSchema = z
  .object({
    date: z.string(),
    revenue: z.coerce.number(),
    expenses: z.coerce.number(),
    profit: z.coerce.number(),
  })
  .transform((row) => ({
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : row.date,
    revenue: row.revenue,
    expenses: row.expenses,
    profit: row.profit,
  }));

export const monthlyPnlSchema = z.object({
  days: z.array(pnlDayPointSchema),
  totalRevenue: z.coerce.number(),
  totalExpenses: z.coerce.number(),
  totalProfit: z.coerce.number(),
});
export type MonthlyPnl = z.infer<typeof monthlyPnlSchema>;
export type PnlDayPoint = z.infer<typeof pnlDayPointSchema>;

// ─── Expense breakdown ───────────────────────────────────
export const expenseCategorySchema = z.object({
  category: z.string(),
  amount: z.coerce.number(),
  count: z.coerce.number(),
  percentage: z.coerce.number(),
});

export const expenseBreakdownSchema = z.object({
  categories: z.array(expenseCategorySchema),
  total: z.coerce.number(),
});
export type ExpenseBreakdown = z.infer<typeof expenseBreakdownSchema>;
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

// ─── Health score breakdown ─────────────────────────────
// 6 components, each with its own max:
//   bookkeeping (200) + revenueTrend (200) + digitalPayments (150)
//   + creditHealth (150) + compliance (100) + engagement (100) = 900 max
export const healthScoreBreakdownSchema = z.object({
  bookkeeping: z.coerce.number(),
  revenueTrend: z.coerce.number(),
  digitalPayments: z.coerce.number(),
  creditHealth: z.coerce.number(),
  compliance: z.coerce.number(),
  engagement: z.coerce.number(),
  total: z.coerce.number(),
  level: z.string(),
});
export type HealthScoreBreakdown = z.infer<typeof healthScoreBreakdownSchema>;

// ─── Component metadata for the breakdown screen ───────
export const HEALTH_COMPONENTS = [
  {
    key: 'bookkeeping' as const,
    max: 200,
    labelHi: 'Bookkeeping',
    descHi: 'Roz transactions record kar rahe ho ya nahi',
    emoji: '📒',
  },
  {
    key: 'revenueTrend' as const,
    max: 200,
    labelHi: 'Revenue Trend',
    descHi: 'Pichle mahine se kitna grow kiya',
    emoji: '📈',
  },
  {
    key: 'digitalPayments' as const,
    max: 150,
    labelHi: 'Digital Payments',
    descHi: 'UPI / cards ka hissa kitna hai cash ki tulna mein',
    emoji: '💳',
  },
  {
    key: 'creditHealth' as const,
    max: 150,
    labelHi: 'Credit Health',
    descHi: 'Customers se udhaar wapas mil raha ya nahi',
    emoji: '⚠',
  },
  {
    key: 'compliance' as const,
    max: 100,
    labelHi: 'Compliance',
    descHi: 'GST, Udyam, FSSAI registrations',
    emoji: '📋',
  },
  {
    key: 'engagement' as const,
    max: 100,
    labelHi: 'Engagement',
    descHi: 'Daily app / WhatsApp use',
    emoji: '🔥',
  },
] as const;

export type HealthComponentKey = (typeof HEALTH_COMPONENTS)[number]['key'];

// ─── Monthly report (composite) ─────────────────────────
// Returned by GET /analytics/report/monthly. Wraps totals, top-selling
// items, expense categories, and credit summary into one payload.
export const topSellingItemSchema = z.object({
  item: z.string(),
  // Backend may use either `quantity` or `count`; normalize to `count`.
  count: z.coerce.number(),
  revenue: z.coerce.number(),
});
export type TopSellingItem = z.infer<typeof topSellingItemSchema>;

export const reportCreditSummarySchema = z.object({
  totalOutstanding: z.coerce.number(),
  totalCollected: z.coerce.number().default(0),
  overdueAmount: z.coerce.number().default(0),
  overdueCount: z.coerce.number().optional(),
  activeCustomers: z.coerce.number().optional(),
});
export type ReportCreditSummary = z.infer<typeof reportCreditSummarySchema>;

export const monthlyReportSchema = z.object({
  businessName: z.string(),
  year: z.coerce.number(),
  month: z.coerce.number(),
  totalRevenue: z.coerce.number(),
  totalExpenses: z.coerce.number(),
  netProfit: z.coerce.number(),
  profitMargin: z.coerce.number(),
  totalTransactions: z.coerce.number().default(0),
  averageDailyRevenue: z.coerce.number().default(0),
  topSellingItems: z.array(topSellingItemSchema).default([]),
  expenseBreakdown: z.array(expenseCategorySchema).default([]),
  creditSummary: reportCreditSummarySchema,
  healthScore: z.coerce.number(),
  healthLevel: z.string(),
});
export type MonthlyReport = z.infer<typeof monthlyReportSchema>;
