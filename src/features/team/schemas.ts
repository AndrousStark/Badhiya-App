/**
 * Team Management schemas — members, attendance, payroll, shifts, compliance.
 *
 * Backend endpoints (under /businesses/:id/team):
 *   30+ endpoints across 6 sub-domains:
 *     members  — CRUD + activity logs
 *     attendance — daily marking + selfie + monthly summaries
 *     payroll  — calculate + pay + advances + payslips
 *     shifts   — CRUD + weekly schedule + assignments
 *     compliance — PF/ESI/overtime/geofence config + alerts
 *
 * Backend services already return camelCase — no transforms needed.
 * Numeric PG strings are coerced.
 */

import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────
export const memberRoleEnum = z.enum(['owner', 'manager', 'staff', 'accountant']);
export type MemberRole = z.infer<typeof memberRoleEnum>;

export const salaryTypeEnum = z.enum(['monthly', 'daily', 'hourly']);
export type SalaryType = z.infer<typeof salaryTypeEnum>;

export const attendanceStatusEnum = z.enum([
  'present',
  'absent',
  'half_day',
  'overtime',
  'late',
  'paid_holiday',
]);
export type AttendanceStatus = z.infer<typeof attendanceStatusEnum>;

export const paymentStatusEnum = z.enum(['calculated', 'approved', 'paid', 'sent']);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

// ─── Team Member ────────────────────────────────────────
export const teamMemberSchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    name: z.string(),
    phone: z.string().nullable().optional(),
    role: z.string(),
    permissions: z.unknown().nullable().optional(),
    salary_type: z.string().nullable().optional(),
    base_salary: z.coerce.number().nullable().optional(),
    overtime_rate: z.coerce.number().nullable().optional(),
    is_active: z.boolean().optional(),
    joined_at: z.string().nullable().optional(),
    created_at: z.string().optional(),
    today_actions: z.unknown().nullable().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone ?? null,
    role: row.role as MemberRole,
    permissions: (row.permissions ?? {}) as Record<string, boolean>,
    salaryType: (row.salary_type ?? 'monthly') as SalaryType,
    baseSalary: row.base_salary ?? 0,
    overtimeRate: row.overtime_rate ?? 0,
    isActive: row.is_active ?? true,
    joinedAt: row.joined_at ?? row.created_at ?? '',
    initial: row.name.charAt(0).toUpperCase(),
  }));
export type TeamMember = z.infer<typeof teamMemberSchema>;

// ─── Team stats ─────────────────────────────────────────
export const teamStatsSchema = z.object({
  totalMembers: z.coerce.number(),
  owners: z.coerce.number(),
  managers: z.coerce.number(),
  staffCount: z.coerce.number(),
  accountants: z.coerce.number(),
  monthlyPayroll: z.coerce.number(),
});
export type TeamStats = z.infer<typeof teamStatsSchema>;

// ─── Activity log ───────────────────────────────────────
export const activityLogSchema = z
  .object({
    id: z.string(),
    action: z.string(),
    resource_type: z.string().nullable().optional(),
    resource_id: z.string().nullable().optional(),
    details: z.unknown().nullable().optional(),
    created_at: z.string(),
    member_name: z.string().nullable().optional(),
    member_role: z.string().nullable().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    action: row.action,
    resourceType: row.resource_type ?? null,
    details: row.details ?? null,
    createdAt: row.created_at,
    memberName: row.member_name ?? null,
    memberRole: row.member_role ?? null,
  }));
export type ActivityLog = z.infer<typeof activityLogSchema>;

// ─── DTOs ───────────────────────────────────────────────
export const addMemberSchema = z.object({
  name: z.string().min(2, 'Name too short').max(120),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  role: z.enum(['manager', 'staff', 'accountant']).default('staff'),
  salaryType: salaryTypeEnum.default('monthly'),
  baseSalary: z.number().min(0).optional(),
  overtimeRate: z.number().min(0).optional(),
});
export type AddMemberDto = z.infer<typeof addMemberSchema>;

export const updateMemberSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['manager', 'staff', 'accountant']).optional(),
  permissions: z.record(z.boolean()).optional(),
  salaryType: salaryTypeEnum.optional(),
  baseSalary: z.number().min(0).optional(),
  overtimeRate: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateMemberDto = z.infer<typeof updateMemberSchema>;

// ─── Attendance ─────────────────────────────────────────
export const markAttendanceEntrySchema = z.object({
  memberId: z.string(),
  status: attendanceStatusEnum,
  overtimeHours: z.number().min(0).optional(),
  lateMinutes: z.number().min(0).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional(),
});
export type MarkAttendanceEntry = z.infer<typeof markAttendanceEntrySchema>;

export const todayAttendanceSchema = z.object({
  date: z.string(),
  summary: z.object({
    present: z.coerce.number(),
    absent: z.coerce.number(),
    halfDay: z.coerce.number(),
    notMarked: z.coerce.number(),
    total: z.coerce.number(),
  }),
  members: z.array(z.unknown()),
});
export type TodayAttendance = z.infer<typeof todayAttendanceSchema>;

export const memberAttendanceSummarySchema = z.object({
  memberId: z.string(),
  memberName: z.string(),
  memberRole: z.string(),
  daysPresent: z.coerce.number(),
  daysAbsent: z.coerce.number(),
  halfDays: z.coerce.number(),
  overtimeHours: z.coerce.number(),
  lateCount: z.coerce.number(),
  paidHolidays: z.coerce.number(),
  attendanceRate: z.coerce.number(),
});
export type MemberAttendanceSummary = z.infer<typeof memberAttendanceSummarySchema>;

export const memberMonthlyAttendanceSchema = z.object({
  year: z.coerce.number(),
  month: z.coerce.number(),
  workingDays: z.coerce.number(),
  summary: z.object({
    daysPresent: z.coerce.number(),
    daysAbsent: z.coerce.number(),
    halfDays: z.coerce.number(),
    overtimeHours: z.coerce.number(),
    lateCount: z.coerce.number(),
    paidHolidays: z.coerce.number(),
    attendanceRate: z.coerce.number(),
  }),
  records: z.array(z.unknown()),
});
export type MemberMonthlyAttendance = z.infer<typeof memberMonthlyAttendanceSchema>;

// ─── Selfie attendance ──────────────────────────────────
export const selfieAttendanceSchema = z.object({
  memberId: z.string(),
  selfieBase64: z.string(),
  gpsLat: z.number(),
  gpsLng: z.number(),
  gpsAccuracy: z.number().optional(),
});
export type SelfieAttendanceDto = z.infer<typeof selfieAttendanceSchema>;

export const geofenceConfigSchema = z.object({
  storeLat: z.coerce.number().nullable(),
  storeLng: z.coerce.number().nullable(),
  radiusM: z.coerce.number(),
  selfieRequired: z.boolean(),
});
export type GeofenceConfig = z.infer<typeof geofenceConfigSchema>;

export const locationVerifySchema = z.object({
  configured: z.boolean(),
  distance: z.coerce.number().nullable().optional(),
  withinGeofence: z.boolean(),
  radiusM: z.coerce.number(),
  storeLat: z.coerce.number().nullable().optional(),
  storeLng: z.coerce.number().nullable().optional(),
});
export type LocationVerification = z.infer<typeof locationVerifySchema>;

// ─── Payroll ────────────────────────────────────────────
export const payrollMemberRowSchema = z.object({
  paymentId: z.string(),
  memberId: z.string(),
  memberName: z.string(),
  memberRole: z.string(),
  salaryType: z.string(),
  baseSalary: z.coerce.number(),
  workingDays: z.coerce.number(),
  daysPresent: z.coerce.number(),
  daysAbsent: z.coerce.number(),
  halfDays: z.coerce.number(),
  overtimeHours: z.coerce.number(),
  lateCount: z.coerce.number(),
  paidHolidays: z.coerce.number(),
  baseAmount: z.coerce.number(),
  overtimeAmount: z.coerce.number(),
  bonusAmount: z.coerce.number(),
  grossAmount: z.coerce.number(),
  advanceDeductions: z.coerce.number(),
  lateDeductions: z.coerce.number(),
  pfDeduction: z.coerce.number(),
  esiDeduction: z.coerce.number(),
  otherDeductions: z.coerce.number(),
  totalDeductions: z.coerce.number(),
  netAmount: z.coerce.number(),
  status: z.string(),
  paidAt: z.string().nullable(),
});
export type PayrollMemberRow = z.infer<typeof payrollMemberRowSchema>;

export const payrollSummarySchema = z.object({
  month: z.coerce.number(),
  year: z.coerce.number(),
  totals: z.object({
    gross: z.coerce.number(),
    net: z.coerce.number(),
    memberCount: z.coerce.number().optional(),
    paidCount: z.coerce.number().optional(),
    pendingCount: z.coerce.number().optional(),
    deductions: z.coerce.number().optional(),
  }),
  compliance: z
    .object({
      pfApplicable: z.boolean().optional(),
      esiApplicable: z.boolean().optional(),
      teamSize: z.coerce.number().optional(),
    })
    .optional(),
  members: z.array(payrollMemberRowSchema),
});
export type PayrollSummary = z.infer<typeof payrollSummarySchema>;

export const advanceSchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    member_id: z.string(),
    amount: z.coerce.number(),
    reason: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    deducted_in_month: z.string().nullable().optional(),
    created_at: z.string().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    memberId: row.member_id,
    amount: row.amount,
    reason: row.reason ?? null,
    isActive: row.is_active ?? true,
    deductedInMonth: row.deducted_in_month ?? null,
    createdAt: row.created_at ?? '',
  }));
export type Advance = z.infer<typeof advanceSchema>;

export const advanceListSchema = z.object({
  totalActive: z.coerce.number(),
  activeCount: z.coerce.number(),
  advances: z.array(advanceSchema),
});
export type AdvanceList = z.infer<typeof advanceListSchema>;

// ─── Shifts ─────────────────────────────────────────────
export const shiftSchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    name: z.string(),
    name_hindi: z.string().nullable().optional(),
    start_time: z.string(),
    end_time: z.string(),
    color: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    created_at: z.string().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    name: row.name,
    nameHindi: row.name_hindi ?? null,
    startTime: row.start_time,
    endTime: row.end_time,
    color: row.color ?? '#FF6B00',
    isActive: row.is_active ?? true,
  }));
export type Shift = z.infer<typeof shiftSchema>;

export const createShiftSchema = z.object({
  name: z.string().min(1, 'Shift name required').max(60),
  nameHindi: z.string().max(60).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format'),
  color: z.string().optional(),
});
export type CreateShiftDto = z.infer<typeof createShiftSchema>;

export const assignShiftSchema = z.object({
  memberId: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  effectiveFrom: z.string().optional(),
});
export type AssignShiftDto = z.infer<typeof assignShiftSchema>;

export const weekScheduleSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  shifts: z.array(z.unknown()),
  schedule: z.array(z.unknown()),
});
export type WeekSchedule = z.infer<typeof weekScheduleSchema>;

// ─── Compliance ─────────────────────────────────────────
export const complianceConfigSchema = z.object({
  pfEnabled: z.boolean(),
  pfNumber: z.string().nullable(),
  esiEnabled: z.boolean(),
  esiNumber: z.string().nullable(),
  lateFineAmount: z.coerce.number(),
  otCapEnabled: z.boolean(),
  otCapHoursQuarter: z.coerce.number(),
  storeLat: z.coerce.number().nullable(),
  storeLng: z.coerce.number().nullable(),
  geofenceRadiusM: z.coerce.number(),
  selfieRequired: z.boolean(),
  companyName: z.string().nullable(),
  companyAddress: z.string().nullable(),
  payslipFooter: z.string().nullable(),
});
export type ComplianceConfig = z.infer<typeof complianceConfigSchema>;

export const updateComplianceSchema = z.object({
  pfEnabled: z.boolean().optional(),
  pfNumber: z.string().optional(),
  esiEnabled: z.boolean().optional(),
  esiNumber: z.string().optional(),
  lateFineAmount: z.number().min(0).optional(),
  otCapEnabled: z.boolean().optional(),
  otCapHoursQuarter: z.number().int().min(0).optional(),
  storeLat: z.number().optional(),
  storeLng: z.number().optional(),
  geofenceRadiusM: z.number().min(10).optional(),
  selfieRequired: z.boolean().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  payslipFooter: z.string().optional(),
});
export type UpdateComplianceDto = z.infer<typeof updateComplianceSchema>;

export const complianceAlertSchema = z.object({
  type: z.enum(['info', 'warning', 'critical']),
  category: z.string(),
  title: z.string(),
  titleHindi: z.string(),
  description: z.string(),
  action: z.string().optional(),
});
export type ComplianceAlert = z.infer<typeof complianceAlertSchema>;

export const complianceStatusSchema = z.object({
  config: complianceConfigSchema,
  teamSize: z.coerce.number(),
  thresholds: z.object({
    pfRequired: z.boolean(),
    esiRequired: z.boolean(),
    pfThreshold: z.coerce.number(),
    esiThreshold: z.coerce.number(),
  }),
  alerts: z.array(complianceAlertSchema),
});
export type ComplianceStatus = z.infer<typeof complianceStatusSchema>;

export const overtimeReportSchema = z.object({
  quarter: z.coerce.number(),
  year: z.coerce.number(),
  maxAllowed: z.coerce.number(),
  members: z.array(
    z.object({
      memberId: z.string(),
      memberName: z.string(),
      totalOtHours: z.coerce.number(),
      percentUsed: z.coerce.number(),
      atRisk: z.boolean(),
      exceeded: z.boolean(),
    }),
  ),
});
export type OvertimeReport = z.infer<typeof overtimeReportSchema>;

// ─── Static metadata ────────────────────────────────────
export type RoleMeta = { label: string; labelHi: string; color: string };
const ROLE_META_STATIC = {
  owner:      { label: 'Owner',      labelHi: 'Maalik',     color: '#7C3AED' },
  manager:    { label: 'Manager',    labelHi: 'Manager',    color: '#1A56DB' },
  staff:      { label: 'Staff',      labelHi: 'Karmchari',  color: '#F59E0B' },
  accountant: { label: 'Accountant', labelHi: 'Munim',      color: '#059669' },
} satisfies Record<string, RoleMeta>;
export const ROLE_META: Record<string, RoleMeta> = ROLE_META_STATIC;

/** Resolves a role string to its metadata, falling back to staff. */
export function getRoleMeta(role: string): RoleMeta {
  return ROLE_META[role] ?? ROLE_META_STATIC.staff;
}

export type AttendanceMeta = { label: string; labelHi: string; emoji: string; color: string };
const ATTENDANCE_META_STATIC = {
  present:      { label: 'Present',     labelHi: 'Hazir',      emoji: '✅', color: '#059669' },
  absent:       { label: 'Absent',      labelHi: 'Gairhazir',  emoji: '❌', color: '#DC2626' },
  half_day:     { label: 'Half Day',    labelHi: 'Aadha Din',  emoji: '🌗', color: '#F59E0B' },
  overtime:     { label: 'Overtime',    labelHi: 'Extra Kaam',  emoji: '⏰', color: '#7C3AED' },
  late:         { label: 'Late',        labelHi: 'Deri',       emoji: '🕐', color: '#EA580C' },
  paid_holiday: { label: 'Paid Leave',  labelHi: 'Chutti',     emoji: '🏖️', color: '#0EA5E9' },
} satisfies Record<string, AttendanceMeta>;
export const ATTENDANCE_META: Record<string, AttendanceMeta> = ATTENDANCE_META_STATIC;

/** Resolves an attendance status string to its metadata. */
export function getAttendanceMeta(status: string): AttendanceMeta {
  return ATTENDANCE_META[status] ?? ATTENDANCE_META_STATIC.absent;
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const DAY_NAMES_HI = ['Ravi', 'Som', 'Mangal', 'Budh', 'Guru', 'Shukr', 'Shani'] as const;
