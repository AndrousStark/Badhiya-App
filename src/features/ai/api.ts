/**
 * AI feature API — POST /ai/query.
 *
 * The backend pipeline is fully transparent to the client; we just
 * send a query string and the server figures out which of the 7 layers
 * to use. Channel is always 'app' from mobile.
 */

import { api } from '@/lib/api';
import {
  aiQueryResponseSchema,
  type AiQueryResponse,
} from './schemas';

export async function queryAi(query: string): Promise<AiQueryResponse> {
  const data = await api.post<unknown>('/ai/query', {
    query,
    channel: 'app',
  });
  return aiQueryResponseSchema.parse(data);
}
