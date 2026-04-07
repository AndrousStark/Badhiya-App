/**
 * Customers + credit API.
 *
 * Maps to backend CreditController routes:
 *   GET    /businesses/:id/credit                       → list customers
 *   GET    /businesses/:id/credit/summary               → credit summary
 *   POST   /businesses/:id/credit/give                  → give udhar
 *   POST   /businesses/:id/credit/:custId/payment       → receive payment
 *   GET    /businesses/:id/credit/:custId/ledger        → customer ledger
 *   POST   /businesses/:id/credit/:custId/remind        → single reminder
 *   POST   /businesses/:id/credit/remind/all            → bulk reminders
 */

import { z } from 'zod';
import { api } from '@/lib/api';
import {
  customerSchema,
  creditSummarySchema,
  customerLedgerSchema,
  creditMutationResponseSchema,
  type Customer,
  type CreditSummary,
  type CustomerLedger,
  type CreditMutationResponse,
  type GiveCreditDto,
  type ReceivePaymentDto,
} from './schemas';

// ─── Read ───────────────────────────────────────────────
export async function listCustomers(businessId: string): Promise<Customer[]> {
  const data = await api.get<unknown>(`/businesses/${businessId}/credit`);
  return z.array(customerSchema).parse(data);
}

export async function getCreditSummary(businessId: string): Promise<CreditSummary> {
  const data = await api.get<unknown>(`/businesses/${businessId}/credit/summary`);
  return creditSummarySchema.parse(data);
}

export async function getCustomerLedger(
  businessId: string,
  customerId: string,
): Promise<CustomerLedger> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/credit/${customerId}/ledger`,
  );
  return customerLedgerSchema.parse(data);
}

// ─── Write ──────────────────────────────────────────────
export async function giveCredit(
  businessId: string,
  dto: GiveCreditDto,
): Promise<CreditMutationResponse> {
  const data = await api.post<unknown>(
    `/businesses/${businessId}/credit/give`,
    dto,
  );
  return creditMutationResponseSchema.parse(data);
}

export async function receivePayment(
  businessId: string,
  customerId: string,
  dto: ReceivePaymentDto,
): Promise<CreditMutationResponse> {
  const data = await api.post<unknown>(
    `/businesses/${businessId}/credit/${customerId}/payment`,
    dto,
  );
  return creditMutationResponseSchema.parse(data);
}

// ─── Reminders ──────────────────────────────────────────
export async function sendReminder(
  businessId: string,
  customerId: string,
): Promise<{ success: boolean; message?: string }> {
  const data = await api.post<{ success: boolean; message?: string }>(
    `/businesses/${businessId}/credit/${customerId}/remind`,
  );
  return data;
}

export async function sendBulkReminders(
  businessId: string,
): Promise<{ sent: number; failed: number }> {
  const data = await api.post<{ sent: number; failed: number }>(
    `/businesses/${businessId}/credit/remind/all`,
  );
  return data;
}
