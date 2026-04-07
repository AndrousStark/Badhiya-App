/**
 * Lending API — wraps backend NBFC endpoints.
 *
 * The mobile app talks to ONE backend, which fans out to FlexiLoans /
 * Lendingkart / Kinara Capital adapters. We never call NBFC APIs directly.
 */

import { z } from 'zod';
import { api } from '@/lib/api';
import {
  loanOfferSchema,
  eligibilityResultSchema,
  loanApplicationResponseSchema,
  loanApplicationListSchema,
  loanApplicationStatusSchema,
  aaConsentResponseSchema,
  aaConsentStatusSchema,
  type LoanOffer,
  type LoanApplicationStatus,
  type AaConsentDto,
  type AaConsentResponse,
  type AaConsentStatus,
  type EligibilityResult,
  type LoanApplicationDto,
  type LoanApplicationResponse,
  type LoanApplicationList,
} from './schemas';

export async function getLoanOffers(businessId: string): Promise<LoanOffer[]> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/lending/offers`,
  );
  return z.array(loanOfferSchema).parse(data);
}

export async function checkEligibility(
  businessId: string,
): Promise<EligibilityResult[]> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/lending/eligibility`,
  );
  return z.array(eligibilityResultSchema).parse(data);
}

export async function applyForLoan(
  businessId: string,
  dto: LoanApplicationDto,
): Promise<LoanApplicationResponse> {
  const data = await api.post<unknown>(
    `/businesses/${businessId}/lending/apply`,
    dto,
  );
  return loanApplicationResponseSchema.parse(data);
}

export async function listLoanApplications(
  businessId: string,
  options: { status?: string; limit?: number } = {},
): Promise<LoanApplicationList> {
  const params: Record<string, string> = {};
  if (options.status) params.status = options.status;
  if (options.limit !== undefined) params.limit = String(options.limit);
  const data = await api.get<unknown>(
    `/businesses/${businessId}/lending/applications`,
    { params },
  );
  return loanApplicationListSchema.parse(data);
}

export async function refreshOffers(
  businessId: string,
): Promise<{ generated: number; message: string }> {
  return api.post<{ generated: number; message: string }>(
    `/businesses/${businessId}/lending/offers/refresh`,
  );
}

// ─── Application detail ─────────────────────────────────
export async function getLoanApplicationStatus(
  businessId: string,
  applicationId: string,
): Promise<LoanApplicationStatus> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/lending/applications/${applicationId}/status`,
  );
  return loanApplicationStatusSchema.parse(data);
}

// ─── Account Aggregator consent ─────────────────────────
export async function initiateAaConsent(
  businessId: string,
  dto: AaConsentDto,
): Promise<AaConsentResponse> {
  const data = await api.post<unknown>(
    `/businesses/${businessId}/lending/aa/consent`,
    dto,
  );
  return aaConsentResponseSchema.parse(data);
}

export async function checkAaConsentStatus(
  businessId: string,
  consentId: string,
): Promise<AaConsentStatus> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/lending/aa/consent/${consentId}`,
  );
  return aaConsentStatusSchema.parse(data);
}
