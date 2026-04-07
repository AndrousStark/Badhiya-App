import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLoanOffers,
  checkEligibility,
  applyForLoan,
  listLoanApplications,
  refreshOffers,
  getLoanApplicationStatus,
  initiateAaConsent,
  checkAaConsentStatus,
} from './api';
import type {
  LoanOffer,
  EligibilityResult,
  LoanApplicationDto,
  LoanApplicationResponse,
  LoanApplicationList,
  LoanApplicationStatus,
  AaConsentDto,
  AaConsentResponse,
  AaConsentStatus,
} from './schemas';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';

export const lendingKeys = {
  all: ['lending'] as const,
  offers: (businessId: string) =>
    [...lendingKeys.all, 'offers', businessId] as const,
  eligibility: (businessId: string) =>
    [...lendingKeys.all, 'eligibility', businessId] as const,
  applications: (businessId: string) =>
    [...lendingKeys.all, 'applications', businessId] as const,
  applicationStatus: (businessId: string, applicationId: string) =>
    [...lendingKeys.all, 'application-status', businessId, applicationId] as const,
  aaConsent: (businessId: string, consentId: string) =>
    [...lendingKeys.all, 'aa-consent', businessId, consentId] as const,
};

export function useLoanOffers() {
  const businessId = auth$.businessId.get();
  return useQuery<LoanOffer[]>({
    queryKey: lendingKeys.offers(businessId ?? 'none'),
    queryFn: () => getLoanOffers(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
}

export function useEligibility() {
  const businessId = auth$.businessId.get();
  return useQuery<EligibilityResult[]>({
    queryKey: lendingKeys.eligibility(businessId ?? 'none'),
    queryFn: () => checkEligibility(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
}

export function useLoanApplications() {
  const businessId = auth$.businessId.get();
  return useQuery<LoanApplicationList>({
    queryKey: lendingKeys.applications(businessId ?? 'none'),
    queryFn: () => listLoanApplications(businessId!),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function useApplyForLoan() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();
  return useMutation<LoanApplicationResponse, Error, LoanApplicationDto>({
    mutationFn: (dto) => applyForLoan(businessId!, dto),
    onSuccess: () => {
      haptic('revealMoney');
      queryClient.invalidateQueries({ queryKey: lendingKeys.all });
    },
    onError: () => haptic('error'),
  });
}

export function useRefreshOffers() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();
  return useMutation<{ generated: number; message: string }, Error, void>({
    mutationFn: () => refreshOffers(businessId!),
    onSuccess: () => {
      haptic('confirm');
      queryClient.invalidateQueries({
        queryKey: lendingKeys.offers(businessId ?? 'none'),
      });
    },
    onError: () => haptic('error'),
  });
}

export function useLoanApplicationStatus(applicationId: string | undefined) {
  const businessId = auth$.businessId.get();
  return useQuery<LoanApplicationStatus>({
    queryKey: lendingKeys.applicationStatus(
      businessId ?? 'none',
      applicationId ?? 'none',
    ),
    queryFn: () => getLoanApplicationStatus(businessId!, applicationId!),
    enabled: !!businessId && !!applicationId,
    staleTime: 30_000,
    refetchInterval: 60_000, // poll every minute for status changes
  });
}

export function useInitiateAaConsent() {
  const businessId = auth$.businessId.get();
  return useMutation<AaConsentResponse, Error, AaConsentDto>({
    mutationFn: (dto) => initiateAaConsent(businessId!, dto),
    onSuccess: () => haptic('confirm'),
    onError: () => haptic('error'),
  });
}

export function useAaConsentStatus(consentId: string | undefined) {
  const businessId = auth$.businessId.get();
  return useQuery<AaConsentStatus>({
    queryKey: lendingKeys.aaConsent(businessId ?? 'none', consentId ?? 'none'),
    queryFn: () => checkAaConsentStatus(businessId!, consentId!),
    enabled: !!businessId && !!consentId,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
