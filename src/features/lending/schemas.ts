/**
 * Lending feature schemas — NBFC marketplace.
 *
 * Backend endpoints (under /businesses/:id/lending):
 *   GET  /offers                            — pre-approved offers
 *   GET  /eligibility                       — eligibility across all NBFCs
 *   POST /apply                             — submit a loan application
 *   GET  /applications                      — list of submitted applications
 *   GET  /applications/:id/status           — single app status
 *   POST /aa/consent                        — Account Aggregator consent (Phase 8.5)
 *
 * Backend uses snake_case PG columns. We coerce strings to numbers for
 * all numeric fields.
 */

import { z } from 'zod';

// ─── Loan offer (snake_case from PG join) ───────────────
export const loanOfferSchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    nbfc_code: z.string(),
    nbfc_name: z.string().optional(),
    nbfc_name_hindi: z.string().nullable().optional(),
    logo_url: z.string().nullable().optional(),
    offer_amount: z.coerce.number(),
    interest_rate: z.coerce.number().nullable().optional(),
    tenure_months: z.coerce.number().nullable().optional(),
    processing_fee: z.coerce.number().nullable().optional(),
    monthly_emi: z.coerce.number().nullable().optional(),
    status: z.string().optional(),
    expires_at: z.string().nullable().optional(),
    min_loan_amount: z.coerce.number().nullable().optional(),
    max_loan_amount: z.coerce.number().nullable().optional(),
    required_documents: z
      .union([z.array(z.string()), z.string()])
      .nullable()
      .optional(),
  })
  .transform((row) => ({
    id: row.id,
    nbfcCode: row.nbfc_code,
    nbfcName: row.nbfc_name ?? row.nbfc_code,
    nbfcNameHi: row.nbfc_name_hindi ?? null,
    logoUrl: row.logo_url ?? null,
    offerAmount: row.offer_amount,
    interestRate: row.interest_rate ?? null,
    tenureMonths: row.tenure_months ?? 12,
    processingFee: row.processing_fee ?? null,
    monthlyEmi: row.monthly_emi ?? null,
    status: row.status ?? 'active',
    expiresAt: row.expires_at ?? null,
    minLoanAmount: row.min_loan_amount ?? 5000,
    maxLoanAmount: row.max_loan_amount ?? 500000,
  }));

export type LoanOffer = z.infer<typeof loanOfferSchema>;

// ─── Eligibility result ─────────────────────────────────
export const eligibilityResultSchema = z.object({
  nbfcCode: z.string(),
  nbfcName: z.string(),
  eligible: z.boolean(),
  maxAmount: z.coerce.number().optional(),
  indicativeRate: z.coerce.number().optional(),
  reason: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  minScore: z.coerce.number(),
  minRevenue: z.coerce.number(),
});
export type EligibilityResult = z.infer<typeof eligibilityResultSchema>;

// ─── Loan application form ──────────────────────────────
export const loanApplicationSchema = z.object({
  nbfcCode: z.enum(['flexiloans', 'lendingkart', 'kinara']),
  requestedAmount: z
    .number()
    .min(5000, 'Minimum loan amount is ₹5,000')
    .max(5000000, 'Maximum loan amount is ₹50 lakh'),
  applicantName: z
    .string()
    .min(2, 'Name is too short')
    .max(120, 'Name is too long'),
  applicantPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  applicantPan: z
    .string()
    .regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Invalid PAN format')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  tenureMonths: z.number().int().min(3).max(60).optional(),
  offerId: z.string().optional(),
});
export type LoanApplicationDto = z.infer<typeof loanApplicationSchema>;

// ─── Application response ───────────────────────────────
export const loanApplicationResponseSchema = z.object({
  application: z
    .object({
      id: z.string(),
      nbfc_code: z.string().optional(),
      nbfcCode: z.string().optional(),
      requested_amount: z.coerce.number().optional(),
      requestedAmount: z.coerce.number().optional(),
      status: z.string(),
      submitted_at: z.string().optional(),
      submittedAt: z.string().optional(),
    })
    .passthrough(),
  nbfcResponse: z
    .object({
      nbfcApplicationId: z.string().optional(),
      referenceNumber: z.string().nullable().optional(),
      magicLinkUrl: z.string().nullable().optional(),
    })
    .passthrough(),
});
export type LoanApplicationResponse = z.infer<typeof loanApplicationResponseSchema>;

// ─── Application list ───────────────────────────────────
export const loanApplicationRowSchema = z
  .object({
    id: z.string(),
    nbfc_code: z.string(),
    nbfc_name: z.string().nullable().optional(),
    requested_amount: z.coerce.number(),
    status: z.string(),
    applicant_name: z.string().nullable().optional(),
    submitted_at: z.string().nullable().optional(),
    magic_link_url: z.string().nullable().optional(),
  })
  .transform((row) => ({
    id: row.id,
    nbfcCode: row.nbfc_code,
    nbfcName: row.nbfc_name ?? row.nbfc_code,
    requestedAmount: row.requested_amount,
    status: row.status,
    applicantName: row.applicant_name ?? null,
    submittedAt: row.submitted_at ?? null,
    magicLinkUrl: row.magic_link_url ?? null,
  }));
export type LoanApplicationRow = z.infer<typeof loanApplicationRowSchema>;

export const loanApplicationListSchema = z.object({
  data: z.array(loanApplicationRowSchema),
  total: z.coerce.number(),
});
export type LoanApplicationList = z.infer<typeof loanApplicationListSchema>;

// ─── Application status detail ──────────────────────────
// GET /lending/applications/:id/status returns the current row + nbfc status
export const loanApplicationStatusSchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    nbfc_code: z.string().optional(),
    nbfc_name: z.string().nullable().optional(),
    requested_amount: z.coerce.number().optional(),
    approved_amount: z.coerce.number().nullable().optional(),
    interest_rate: z.coerce.number().nullable().optional(),
    tenure_months: z.coerce.number().nullable().optional(),
    monthly_emi: z.coerce.number().nullable().optional(),
    status: z.string(),
    currentStatus: z.string().optional(),
    applicant_name: z.string().nullable().optional(),
    applicant_phone: z.string().nullable().optional(),
    applicant_pan: z.string().nullable().optional(),
    nbfc_application_id: z.string().nullable().optional(),
    nbfc_reference_number: z.string().nullable().optional(),
    magic_link_url: z.string().nullable().optional(),
    submitted_at: z.string().nullable().optional(),
    approved_at: z.string().nullable().optional(),
    disbursed_at: z.string().nullable().optional(),
    rejected_at: z.string().nullable().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    nbfcCode: row.nbfc_code ?? '',
    nbfcName: row.nbfc_name ?? row.nbfc_code ?? '',
    requestedAmount: row.requested_amount ?? 0,
    approvedAmount: row.approved_amount ?? null,
    interestRate: row.interest_rate ?? null,
    tenureMonths: row.tenure_months ?? null,
    monthlyEmi: row.monthly_emi ?? null,
    status: row.currentStatus ?? row.status,
    applicantName: row.applicant_name ?? null,
    applicantPhone: row.applicant_phone ?? null,
    applicantPan: row.applicant_pan ?? null,
    nbfcApplicationId: row.nbfc_application_id ?? null,
    nbfcReferenceNumber: row.nbfc_reference_number ?? null,
    magicLinkUrl: row.magic_link_url ?? null,
    submittedAt: row.submitted_at ?? null,
    approvedAt: row.approved_at ?? null,
    disbursedAt: row.disbursed_at ?? null,
    rejectedAt: row.rejected_at ?? null,
  }));
export type LoanApplicationStatus = z.infer<typeof loanApplicationStatusSchema>;

// ─── Account Aggregator consent ─────────────────────────
export const aaConsentRequestSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  fipId: z.string().optional(),
  dataRangeMonths: z.number().int().min(3).max(24).default(12),
});
export type AaConsentDto = z.infer<typeof aaConsentRequestSchema>;

export const aaConsentResponseSchema = z.object({
  consentId: z.string(),
  consentHandle: z.string().optional(),
  consentUrl: z.string().optional(),
  status: z.string().optional(),
  expiresAt: z.string().optional(),
});
export type AaConsentResponse = z.infer<typeof aaConsentResponseSchema>;

export const aaConsentStatusSchema = z.object({
  consentId: z.string(),
  status: z.string(),
  approvedAt: z.string().nullable().optional(),
  rejectedAt: z.string().nullable().optional(),
  dataFetchedAt: z.string().nullable().optional(),
});
export type AaConsentStatus = z.infer<typeof aaConsentStatusSchema>;

// ─── Status timeline metadata ───────────────────────────
export const LOAN_STATUS_FLOW = [
  { key: 'submitted', label: 'Submitted', emoji: '📝' },
  { key: 'aa_consent_pending', label: 'AA consent', emoji: '🔐' },
  { key: 'under_review', label: 'Under review', emoji: '🔍' },
  { key: 'approved', label: 'Approved', emoji: '✅' },
  { key: 'disbursed', label: 'Disbursed', emoji: '💰' },
] as const;

export const LOAN_STATUS_LABELS: Record<
  string,
  { label: string; tone: 'profit' | 'warning' | 'loss' | 'trust' }
> = {
  submitted: { label: 'Submitted', tone: 'trust' },
  aa_consent_pending: { label: 'AA consent pending', tone: 'warning' },
  under_review: { label: 'Under review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'profit' },
  disbursed: { label: 'Disbursed', tone: 'profit' },
  rejected: { label: 'Rejected', tone: 'loss' },
};

// ─── NBFC metadata for the UI ──────────────────────────
export const NBFC_META: Record<
  string,
  { name: string; tagline: string; gradient: [string, string]; emoji: string }
> = {
  flexiloans: {
    name: 'FlexiLoans',
    tagline: 'Fast disbursal · 24-48 hours',
    gradient: ['#1A56DB', '#3B82F6'],
    emoji: '⚡',
  },
  lendingkart: {
    name: 'Lendingkart',
    tagline: 'Best rates · Up to ₹2 Cr',
    gradient: ['#FF6B00', '#FF8C38'],
    emoji: '🚀',
  },
  kinara: {
    name: 'Kinara Capital',
    tagline: 'MSME-first · Lowest score required',
    gradient: ['#1B8C3A', '#2FB559'],
    emoji: '🌱',
  },
};
