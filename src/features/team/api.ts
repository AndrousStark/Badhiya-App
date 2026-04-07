/**
 * Team Management API — wraps 30+ backend team endpoints.
 *
 * All under /businesses/:businessId/team.
 * Sub-domains: members, attendance, payroll, shifts, compliance.
 */

import { z } from 'zod';
import { api } from '@/lib/api';
import {
  teamMemberSchema,
  teamStatsSchema,
  activityLogSchema,
  todayAttendanceSchema,
  memberAttendanceSummarySchema,
  memberMonthlyAttendanceSchema,
  geofenceConfigSchema,
  locationVerifySchema,
  payrollSummarySchema,
  advanceSchema,
  advanceListSchema,
  shiftSchema,
  weekScheduleSchema,
  complianceConfigSchema,
  complianceStatusSchema,
  overtimeReportSchema,
  type TeamMember,
  type TeamStats,
  type ActivityLog,
  type TodayAttendance,
  type MemberAttendanceSummary,
  type MemberMonthlyAttendance,
  type GeofenceConfig,
  type LocationVerification,
  type PayrollSummary,
  type Advance,
  type AdvanceList,
  type Shift,
  type WeekSchedule,
  type ComplianceConfig,
  type ComplianceStatus,
  type OvertimeReport,
  type AddMemberDto,
  type UpdateMemberDto,
  type MarkAttendanceEntry,
  type SelfieAttendanceDto,
  type CreateShiftDto,
  type AssignShiftDto,
  type UpdateComplianceDto,
} from './schemas';

const base = (bId: string) => `/businesses/${bId}/team`;

// ═══════════════════════════════════════════════════════
//  MEMBERS
// ═══════════════════════════════════════════════════════

export async function listMembers(bId: string): Promise<TeamMember[]> {
  const data = await api.get<unknown>(base(bId));
  return z.array(teamMemberSchema).parse(data);
}

export async function getTeamStats(bId: string): Promise<TeamStats> {
  const data = await api.get<unknown>(`${base(bId)}/stats`);
  return teamStatsSchema.parse(data);
}

export async function getTeamActivity(
  bId: string,
  limit = 50,
): Promise<ActivityLog[]> {
  const data = await api.get<unknown>(`${base(bId)}/activity`, {
    params: { limit: String(limit) },
  });
  return z.array(activityLogSchema).parse(data);
}

export async function addMember(
  bId: string,
  dto: AddMemberDto,
): Promise<TeamMember> {
  const data = await api.post<unknown>(base(bId), dto);
  return teamMemberSchema.parse(data);
}

export async function getMemberDetail(
  bId: string,
  memberId: string,
): Promise<TeamMember> {
  const data = await api.get<unknown>(`${base(bId)}/${memberId}`);
  return teamMemberSchema.parse(data);
}

export async function updateMember(
  bId: string,
  memberId: string,
  dto: UpdateMemberDto,
): Promise<TeamMember> {
  const data = await api.patch<unknown>(`${base(bId)}/${memberId}`, dto);
  return teamMemberSchema.parse(data);
}

export async function removeMember(
  bId: string,
  memberId: string,
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${base(bId)}/${memberId}`);
}

export async function getMemberActivity(
  bId: string,
  memberId: string,
  limit = 30,
): Promise<ActivityLog[]> {
  const data = await api.get<unknown>(`${base(bId)}/${memberId}/activity`, {
    params: { limit: String(limit) },
  });
  return z.array(activityLogSchema).parse(data);
}

// ═══════════════════════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════════════════════

export async function markAttendance(
  bId: string,
  date: string,
  entries: MarkAttendanceEntry[],
  markedBy?: string,
): Promise<{ date: string; marked: number; failed: number }> {
  return api.post(`${base(bId)}/attendance`, { date, entries, markedBy });
}

export async function getTodayAttendance(bId: string): Promise<TodayAttendance> {
  const data = await api.get<unknown>(`${base(bId)}/attendance/today`);
  return todayAttendanceSchema.parse(data);
}

export async function getAttendanceForDate(
  bId: string,
  date: string,
): Promise<unknown[]> {
  return api.get<unknown[]>(`${base(bId)}/attendance/date`, {
    params: { date },
  });
}

export async function getMonthlyTeamSummary(
  bId: string,
  year: number,
  month: number,
): Promise<MemberAttendanceSummary[]> {
  const data = await api.get<unknown>(`${base(bId)}/attendance/summary`, {
    params: { year: String(year), month: String(month) },
  });
  return z.array(memberAttendanceSummarySchema).parse(data);
}

export async function getMemberAttendance(
  bId: string,
  memberId: string,
  year?: number,
  month?: number,
): Promise<MemberMonthlyAttendance> {
  const params: Record<string, string> = {};
  if (year !== undefined) params.year = String(year);
  if (month !== undefined) params.month = String(month);
  const data = await api.get<unknown>(
    `${base(bId)}/${memberId}/attendance`,
    { params },
  );
  return memberMonthlyAttendanceSchema.parse(data);
}

// ─── Selfie attendance ──────────────────────────────────

export async function markSelfieAttendance(
  bId: string,
  dto: SelfieAttendanceDto,
): Promise<{ success: boolean; attendanceId: string; distance: number; isWithinGeofence: boolean }> {
  return api.post(`${base(bId)}/attendance/selfie`, dto);
}

export async function getGeofenceConfig(bId: string): Promise<GeofenceConfig> {
  const data = await api.get<unknown>(`${base(bId)}/attendance/geofence`);
  return geofenceConfigSchema.parse(data);
}

export async function verifyLocation(
  bId: string,
  lat: number,
  lng: number,
): Promise<LocationVerification> {
  const data = await api.post<unknown>(`${base(bId)}/attendance/verify-location`, {
    lat,
    lng,
  });
  return locationVerifySchema.parse(data);
}

// ═══════════════════════════════════════════════════════
//  PAYROLL
// ═══════════════════════════════════════════════════════

export async function getPayrollSummary(
  bId: string,
  year: number,
  month: number,
): Promise<PayrollSummary> {
  const data = await api.get<unknown>(`${base(bId)}/payroll/summary`, {
    params: { year: String(year), month: String(month) },
  });
  return payrollSummarySchema.parse(data);
}

export async function calculatePayroll(
  bId: string,
  year: number,
  month: number,
): Promise<PayrollSummary> {
  const data = await api.post<unknown>(`${base(bId)}/payroll/calculate`, {
    year,
    month,
  });
  return payrollSummarySchema.parse(data);
}

export async function markAsPaid(
  bId: string,
  paymentId: string,
  paymentMethod?: string,
): Promise<unknown> {
  return api.post(`${base(bId)}/payroll/${paymentId}/pay`, { paymentMethod });
}

export async function sendPayslips(
  bId: string,
  year: number,
  month: number,
): Promise<{ sent: number; failed: number; total: number }> {
  return api.post(`${base(bId)}/payroll/send-slips`, { year, month });
}

export async function giveAdvance(
  bId: string,
  memberId: string,
  dto: { amount: number; reason?: string },
): Promise<Advance> {
  const data = await api.post<unknown>(`${base(bId)}/${memberId}/advance`, dto);
  return advanceSchema.parse(data);
}

export async function listAdvances(
  bId: string,
  memberId: string,
): Promise<AdvanceList> {
  const data = await api.get<unknown>(`${base(bId)}/${memberId}/advances`);
  return advanceListSchema.parse(data);
}

export async function getMemberPayments(
  bId: string,
  memberId: string,
): Promise<unknown[]> {
  return api.get<unknown[]>(`${base(bId)}/${memberId}/payments`);
}

/**
 * Build a printable payslip HTML URL. Opens in system browser.
 */
export function getPayslipHtmlUrl(bId: string, paymentId: string): string {
  const apiBase =
    process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1';
  return `${apiBase}/businesses/${bId}/team/payroll/${paymentId}/payslip`;
}

// ═══════════════════════════════════════════════════════
//  SHIFTS
// ═══════════════════════════════════════════════════════

export async function listShifts(bId: string): Promise<Shift[]> {
  const data = await api.get<unknown>(`${base(bId)}/shifts`);
  return z.array(shiftSchema).parse(data);
}

export async function createShift(
  bId: string,
  dto: CreateShiftDto,
): Promise<Shift> {
  const data = await api.post<unknown>(`${base(bId)}/shifts`, dto);
  return shiftSchema.parse(data);
}

export async function updateShift(
  bId: string,
  shiftId: string,
  dto: Partial<CreateShiftDto> & { isActive?: boolean },
): Promise<Shift> {
  const data = await api.patch<unknown>(
    `${base(bId)}/shifts/${shiftId}`,
    dto,
  );
  return shiftSchema.parse(data);
}

export async function deleteShift(
  bId: string,
  shiftId: string,
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${base(bId)}/shifts/${shiftId}`);
}

export async function assignShift(
  bId: string,
  shiftId: string,
  dto: AssignShiftDto,
): Promise<unknown> {
  return api.post(`${base(bId)}/shifts/${shiftId}/assign`, dto);
}

export async function removeAssignment(
  bId: string,
  assignmentId: string,
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(
    `${base(bId)}/shifts/assignments/${assignmentId}`,
  );
}

export async function getWeekSchedule(
  bId: string,
  weekStart?: string,
): Promise<WeekSchedule> {
  const params: Record<string, string> = {};
  if (weekStart) params.weekStart = weekStart;
  const data = await api.get<unknown>(`${base(bId)}/shifts/schedule`, {
    params,
  });
  return weekScheduleSchema.parse(data);
}

export async function seedDefaultShifts(bId: string): Promise<Shift[]> {
  const data = await api.post<unknown>(`${base(bId)}/shifts/seed-defaults`);
  return z.array(shiftSchema).parse(data);
}

// ═══════════════════════════════════════════════════════
//  COMPLIANCE
// ═══════════════════════════════════════════════════════

export async function getComplianceStatus(bId: string): Promise<ComplianceStatus> {
  const data = await api.get<unknown>(`${base(bId)}/compliance/status`);
  return complianceStatusSchema.parse(data);
}

export async function getComplianceConfig(bId: string): Promise<ComplianceConfig> {
  const data = await api.get<unknown>(`${base(bId)}/compliance/config`);
  return complianceConfigSchema.parse(data);
}

export async function updateComplianceConfig(
  bId: string,
  dto: UpdateComplianceDto,
): Promise<ComplianceConfig> {
  const data = await api.patch<unknown>(`${base(bId)}/compliance/config`, dto);
  return complianceConfigSchema.parse(data);
}

export async function getOvertimeReport(bId: string): Promise<OvertimeReport> {
  const data = await api.get<unknown>(`${base(bId)}/compliance/overtime-report`);
  return overtimeReportSchema.parse(data);
}

export async function getPfEcrData(
  bId: string,
  year: number,
  month: number,
): Promise<unknown> {
  return api.get(`${base(bId)}/compliance/pf-ecr`, {
    params: { year: String(year), month: String(month) },
  });
}
