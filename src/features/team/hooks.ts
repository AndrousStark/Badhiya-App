/**
 * TanStack Query hooks for team management.
 *
 * Sub-domains: members, attendance, payroll, shifts, compliance.
 * Online-first — team operations are time-sensitive (attendance,
 * payroll) so offline writes don't make sense here.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listMembers,
  getTeamStats,
  getTeamActivity,
  addMember,
  getMemberDetail,
  updateMember,
  removeMember,
  getMemberActivity,
  markAttendance,
  getTodayAttendance,
  getMonthlyTeamSummary,
  getMemberAttendance,
  markSelfieAttendance,
  getGeofenceConfig,
  verifyLocation,
  getPayrollSummary,
  calculatePayroll,
  markAsPaid,
  sendPayslips,
  giveAdvance,
  listAdvances,
  listShifts,
  createShift,
  deleteShift,
  assignShift,
  getWeekSchedule,
  seedDefaultShifts,
  getComplianceStatus,
  updateComplianceConfig,
  getOvertimeReport,
} from './api';
import type {
  TeamMember,
  TeamStats,
  ActivityLog,
  TodayAttendance,
  MemberAttendanceSummary,
  MemberMonthlyAttendance,
  GeofenceConfig,
  PayrollSummary,
  AdvanceList,
  Shift,
  WeekSchedule,
  ComplianceStatus,
  OvertimeReport,
  AddMemberDto,
  UpdateMemberDto,
  MarkAttendanceEntry,
  SelfieAttendanceDto,
  CreateShiftDto,
  AssignShiftDto,
  UpdateComplianceDto,
} from './schemas';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';

// ─── Query keys ─────────────────────────────────────────
export const teamKeys = {
  all: ['team'] as const,
  members: (bId: string) => [...teamKeys.all, 'members', bId] as const,
  stats: (bId: string) => [...teamKeys.all, 'stats', bId] as const,
  activity: (bId: string) => [...teamKeys.all, 'activity', bId] as const,
  member: (bId: string, mId: string) =>
    [...teamKeys.all, 'member', bId, mId] as const,
  memberActivity: (bId: string, mId: string) =>
    [...teamKeys.all, 'member-activity', bId, mId] as const,
  todayAttendance: (bId: string) =>
    [...teamKeys.all, 'today-attendance', bId] as const,
  monthlySummary: (bId: string, y: number, m: number) =>
    [...teamKeys.all, 'monthly-summary', bId, y, m] as const,
  memberAttendance: (bId: string, mId: string, y: number, m: number) =>
    [...teamKeys.all, 'member-attendance', bId, mId, y, m] as const,
  geofence: (bId: string) => [...teamKeys.all, 'geofence', bId] as const,
  payroll: (bId: string, y: number, m: number) =>
    [...teamKeys.all, 'payroll', bId, y, m] as const,
  advances: (bId: string, mId: string) =>
    [...teamKeys.all, 'advances', bId, mId] as const,
  shifts: (bId: string) => [...teamKeys.all, 'shifts', bId] as const,
  weekSchedule: (bId: string, weekStart?: string) =>
    [...teamKeys.all, 'week-schedule', bId, weekStart ?? 'current'] as const,
  compliance: (bId: string) =>
    [...teamKeys.all, 'compliance', bId] as const,
  overtime: (bId: string) =>
    [...teamKeys.all, 'overtime', bId] as const,
};

// ═══════════════════════════════════════════════════════
//  MEMBERS — reads
// ═══════════════════════════════════════════════════════

export function useTeamMembers() {
  const bId = auth$.businessId.get();
  return useQuery<TeamMember[]>({
    queryKey: teamKeys.members(bId ?? 'none'),
    queryFn: () => listMembers(bId!),
    enabled: !!bId,
    staleTime: 60_000,
  });
}

export function useTeamStats() {
  const bId = auth$.businessId.get();
  return useQuery<TeamStats>({
    queryKey: teamKeys.stats(bId ?? 'none'),
    queryFn: () => getTeamStats(bId!),
    enabled: !!bId,
    staleTime: 60_000,
  });
}

export function useTeamActivity() {
  const bId = auth$.businessId.get();
  return useQuery<ActivityLog[]>({
    queryKey: teamKeys.activity(bId ?? 'none'),
    queryFn: () => getTeamActivity(bId!),
    enabled: !!bId,
    staleTime: 60_000,
  });
}

export function useMemberDetail(memberId: string | undefined) {
  const bId = auth$.businessId.get();
  return useQuery<TeamMember>({
    queryKey: teamKeys.member(bId ?? 'none', memberId ?? 'none'),
    queryFn: () => getMemberDetail(bId!, memberId!),
    enabled: !!bId && !!memberId,
    staleTime: 30_000,
  });
}

export function useMemberActivity(memberId: string | undefined) {
  const bId = auth$.businessId.get();
  return useQuery<ActivityLog[]>({
    queryKey: teamKeys.memberActivity(bId ?? 'none', memberId ?? 'none'),
    queryFn: () => getMemberActivity(bId!, memberId!),
    enabled: !!bId && !!memberId,
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════════════
//  MEMBERS — writes
// ═══════════════════════════════════════════════════════

export function useAddMember() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<TeamMember, Error, AddMemberDto>({
    mutationFn: (dto) => addMember(bId!, dto),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: teamKeys.members(bId ?? 'none') });
      qc.invalidateQueries({ queryKey: teamKeys.stats(bId ?? 'none') });
    },
    onError: () => haptic('error'),
  });
}

export function useUpdateMember(memberId: string) {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<TeamMember, Error, UpdateMemberDto>({
    mutationFn: (dto) => updateMember(bId!, memberId, dto),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: teamKeys.members(bId ?? 'none') });
      qc.invalidateQueries({
        queryKey: teamKeys.member(bId ?? 'none', memberId),
      });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (memberId) => removeMember(bId!, memberId),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: () => haptic('error'),
  });
}

// ═══════════════════════════════════════════════════════
//  ATTENDANCE — reads
// ═══════════════════════════════════════════════════════

export function useTodayAttendance() {
  const bId = auth$.businessId.get();
  return useQuery<TodayAttendance>({
    queryKey: teamKeys.todayAttendance(bId ?? 'none'),
    queryFn: () => getTodayAttendance(bId!),
    enabled: !!bId,
    staleTime: 30_000,
  });
}

export function useMonthlyTeamSummary(year: number, month: number) {
  const bId = auth$.businessId.get();
  return useQuery<MemberAttendanceSummary[]>({
    queryKey: teamKeys.monthlySummary(bId ?? 'none', year, month),
    queryFn: () => getMonthlyTeamSummary(bId!, year, month),
    enabled: !!bId,
    staleTime: 5 * 60_000,
  });
}

export function useMemberAttendance(
  memberId: string | undefined,
  year?: number,
  month?: number,
) {
  const bId = auth$.businessId.get();
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  return useQuery<MemberMonthlyAttendance>({
    queryKey: teamKeys.memberAttendance(
      bId ?? 'none',
      memberId ?? 'none',
      y,
      m,
    ),
    queryFn: () => getMemberAttendance(bId!, memberId!, y, m),
    enabled: !!bId && !!memberId,
    staleTime: 60_000,
  });
}

export function useGeofenceConfig() {
  const bId = auth$.businessId.get();
  return useQuery<GeofenceConfig>({
    queryKey: teamKeys.geofence(bId ?? 'none'),
    queryFn: () => getGeofenceConfig(bId!),
    enabled: !!bId,
    staleTime: 10 * 60_000,
  });
}

// ═══════════════════════════════════════════════════════
//  ATTENDANCE — writes
// ═══════════════════════════════════════════════════════

export function useMarkAttendance() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<
    { date: string; marked: number; failed: number },
    Error,
    { date: string; entries: MarkAttendanceEntry[] }
  >({
    mutationFn: ({ date, entries }) => markAttendance(bId!, date, entries),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({
        queryKey: teamKeys.todayAttendance(bId ?? 'none'),
      });
    },
    onError: () => haptic('error'),
  });
}

export function useMarkSelfieAttendance() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<
    { success: boolean; attendanceId: string; distance: number; isWithinGeofence: boolean },
    Error,
    SelfieAttendanceDto
  >({
    mutationFn: (dto) => markSelfieAttendance(bId!, dto),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({
        queryKey: teamKeys.todayAttendance(bId ?? 'none'),
      });
    },
    onError: () => haptic('error'),
  });
}

// ═══════════════════════════════════════════════════════
//  PAYROLL — reads
// ═══════════════════════════════════════════════════════

export function usePayrollSummary(year: number, month: number) {
  const bId = auth$.businessId.get();
  return useQuery<PayrollSummary>({
    queryKey: teamKeys.payroll(bId ?? 'none', year, month),
    queryFn: () => getPayrollSummary(bId!, year, month),
    enabled: !!bId,
    staleTime: 60_000,
  });
}

export function useAdvances(memberId: string | undefined) {
  const bId = auth$.businessId.get();
  return useQuery<AdvanceList>({
    queryKey: teamKeys.advances(bId ?? 'none', memberId ?? 'none'),
    queryFn: () => listAdvances(bId!, memberId!),
    enabled: !!bId && !!memberId,
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════════════
//  PAYROLL — writes
// ═══════════════════════════════════════════════════════

export function useCalculatePayroll() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<PayrollSummary, Error, { year: number; month: number }>({
    mutationFn: ({ year, month }) => calculatePayroll(bId!, year, month),
    onSuccess: (data) => {
      haptic('revealMoney');
      qc.invalidateQueries({
        queryKey: teamKeys.payroll(bId ?? 'none', data.year, data.month),
      });
    },
    onError: () => haptic('error'),
  });
}

export function useMarkAsPaid() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<unknown, Error, { paymentId: string; paymentMethod?: string }>({
    mutationFn: ({ paymentId, paymentMethod }) =>
      markAsPaid(bId!, paymentId, paymentMethod),
    onSuccess: () => {
      haptic('revealMoney');
      qc.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: () => haptic('error'),
  });
}

export function useSendPayslips() {
  const bId = auth$.businessId.get();
  return useMutation<
    { sent: number; failed: number; total: number },
    Error,
    { year: number; month: number }
  >({
    mutationFn: ({ year, month }) => sendPayslips(bId!, year, month),
    onSuccess: () => haptic('confirm'),
    onError: () => haptic('error'),
  });
}

export function useGiveAdvance(memberId: string) {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<unknown, Error, { amount: number; reason?: string }>({
    mutationFn: (dto) => giveAdvance(bId!, memberId, dto),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({
        queryKey: teamKeys.advances(bId ?? 'none', memberId),
      });
    },
    onError: () => haptic('error'),
  });
}

// ═══════════════════════════════════════════════════════
//  SHIFTS — reads
// ═══════════════════════════════════════════════════════

export function useShifts() {
  const bId = auth$.businessId.get();
  return useQuery<Shift[]>({
    queryKey: teamKeys.shifts(bId ?? 'none'),
    queryFn: () => listShifts(bId!),
    enabled: !!bId,
    staleTime: 5 * 60_000,
  });
}

export function useWeekSchedule(weekStart?: string) {
  const bId = auth$.businessId.get();
  return useQuery<WeekSchedule>({
    queryKey: teamKeys.weekSchedule(bId ?? 'none', weekStart),
    queryFn: () => getWeekSchedule(bId!, weekStart),
    enabled: !!bId,
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════════════
//  SHIFTS — writes
// ═══════════════════════════════════════════════════════

export function useCreateShift() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<Shift, Error, CreateShiftDto>({
    mutationFn: (dto) => createShift(bId!, dto),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: teamKeys.shifts(bId ?? 'none') });
    },
    onError: () => haptic('error'),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (shiftId) => deleteShift(bId!, shiftId),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: teamKeys.shifts(bId ?? 'none') });
      qc.invalidateQueries({
        queryKey: teamKeys.weekSchedule(bId ?? 'none'),
      });
    },
  });
}

export function useAssignShift(shiftId: string) {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<unknown, Error, AssignShiftDto>({
    mutationFn: (dto) => assignShift(bId!, shiftId, dto),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({
        queryKey: teamKeys.weekSchedule(bId ?? 'none'),
      });
    },
    onError: () => haptic('error'),
  });
}

export function useSeedDefaultShifts() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<Shift[], Error, void>({
    mutationFn: () => seedDefaultShifts(bId!),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: teamKeys.shifts(bId ?? 'none') });
    },
    onError: () => haptic('error'),
  });
}

// ═══════════════════════════════════════════════════════
//  COMPLIANCE — reads
// ═══════════════════════════════════════════════════════

export function useComplianceStatus() {
  const bId = auth$.businessId.get();
  return useQuery<ComplianceStatus>({
    queryKey: teamKeys.compliance(bId ?? 'none'),
    queryFn: () => getComplianceStatus(bId!),
    enabled: !!bId,
    staleTime: 5 * 60_000,
  });
}

export function useOvertimeReport() {
  const bId = auth$.businessId.get();
  return useQuery<OvertimeReport>({
    queryKey: teamKeys.overtime(bId ?? 'none'),
    queryFn: () => getOvertimeReport(bId!),
    enabled: !!bId,
    staleTime: 5 * 60_000,
  });
}

// ═══════════════════════════════════════════════════════
//  COMPLIANCE — writes
// ═══════════════════════════════════════════════════════

export function useUpdateComplianceConfig() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<unknown, Error, UpdateComplianceDto>({
    mutationFn: (dto) => updateComplianceConfig(bId!, dto),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({
        queryKey: teamKeys.compliance(bId ?? 'none'),
      });
    },
    onError: () => haptic('error'),
  });
}
