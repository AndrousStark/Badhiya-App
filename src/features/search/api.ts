import { api } from '@/lib/api';
import { searchResultSchema, type SearchResult } from './schemas';

/**
 * Global search across transactions, customers, and products.
 * Backend returns max 5 of each type.
 */
export async function globalSearch(
  businessId: string,
  query: string,
): Promise<SearchResult> {
  if (!query || query.length < 2) {
    return { transactions: [], customers: [], products: [] };
  }
  const data = await api.get<unknown>(
    `/businesses/${businessId}/search`,
    { params: { q: query } },
  );
  return searchResultSchema.parse(data);
}
