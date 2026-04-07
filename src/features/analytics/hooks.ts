import { useQuery } from '@tanstack/react-query';
import {
  getRevenueChart,
  getMonthlyPnl,
  getExpenseBreakdown,
  getHealthScoreBreakdown,
  getMonthlyReport,
} from './api';
import type {
  RevenuePoint,
  MonthlyPnl,
  ExpenseBreakdown,
  HealthScoreBreakdown,
  MonthlyReport,
} from './schemas';
import { auth$ } from '@/stores/auth';

export const analyticsKeys = {
  all: ['analytics'] as const,
  revenueChart: (businessId: string, days: number) =>
    [...analyticsKeys.all, 'revenue-chart', businessId, days] as const,
  monthlyPnl: (businessId: string, year: number, month: number) =>
    [...analyticsKeys.all, 'pnl-monthly', businessId, year, month] as const,
  expenseBreakdown: (businessId: string, year: number, month: number) =>
    [...analyticsKeys.all, 'expenses', businessId, year, month] as const,
  healthScoreBreakdown: (businessId: string) =>
    [...analyticsKeys.all, 'health-score', businessId] as const,
  monthlyReport: (businessId: string, year: number, month: number) =>
    [...analyticsKeys.all, 'monthly-report', businessId, year, month] as const,
};

export function useRevenueChart(days: number = 30) {
  const businessId = auth$.businessId.get();
  return useQuery<RevenuePoint[]>({
    queryKey: analyticsKeys.revenueChart(businessId ?? 'none', days),
    queryFn: () => getRevenueChart(businessId!, days),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useMonthlyPnl(year?: number, month?: number) {
  const businessId = auth$.businessId.get();
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  return useQuery<MonthlyPnl>({
    queryKey: analyticsKeys.monthlyPnl(businessId ?? 'none', y, m),
    queryFn: () => getMonthlyPnl(businessId!, y, m),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
}

export function useExpenseBreakdown(year?: number, month?: number) {
  const businessId = auth$.businessId.get();
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  return useQuery<ExpenseBreakdown>({
    queryKey: analyticsKeys.expenseBreakdown(businessId ?? 'none', y, m),
    queryFn: () => getExpenseBreakdown(businessId!, y, m),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
}

export function useHealthScoreBreakdown() {
  const businessId = auth$.businessId.get();
  return useQuery<HealthScoreBreakdown>({
    queryKey: analyticsKeys.healthScoreBreakdown(businessId ?? 'none'),
    queryFn: () => getHealthScoreBreakdown(businessId!),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useMonthlyReport(year?: number, month?: number) {
  const businessId = auth$.businessId.get();
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  return useQuery<MonthlyReport>({
    queryKey: analyticsKeys.monthlyReport(businessId ?? 'none', y, m),
    queryFn: () => getMonthlyReport(businessId!, y, m),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
}
