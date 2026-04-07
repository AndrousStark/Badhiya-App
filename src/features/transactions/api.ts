/**
 * Transactions API — list, create, P&L for the active business.
 *
 * The mobile-side type 'payment' is mapped to the backend's
 * 'payment_received' on send and back on receive.
 */

import { api } from '@/lib/api';
import {
  transactionListSchema,
  createTransactionResponseSchema,
  dailyPnlSchema,
  toBackendType,
  type TransactionList,
  type CreateTransactionDto,
  type CreateTransactionResponse,
  type DailyPnl,
} from './schemas';

interface ListOptions {
  type?: 'sale' | 'expense' | 'payment';
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}

export async function listTransactions(
  businessId: string,
  options: ListOptions = {},
): Promise<TransactionList> {
  const params: Record<string, string> = {};
  if (options.type) params.type = toBackendType(options.type);
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.offset !== undefined) params.offset = String(options.offset);
  if (options.dateFrom) params.dateFrom = options.dateFrom;
  if (options.dateTo) params.dateTo = options.dateTo;

  const data = await api.get<unknown>(
    `/businesses/${businessId}/transactions`,
    { params },
  );
  return transactionListSchema.parse(data);
}

export async function createTransaction(
  businessId: string,
  dto: CreateTransactionDto,
): Promise<CreateTransactionResponse> {
  const body = {
    ...dto,
    type: toBackendType(dto.type),
  };
  const data = await api.post<unknown>(
    `/businesses/${businessId}/transactions`,
    body,
  );
  return createTransactionResponseSchema.parse(data);
}

export async function getTodayPnl(businessId: string): Promise<DailyPnl> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/transactions/pnl/today`,
  );
  return dailyPnlSchema.parse(data);
}
