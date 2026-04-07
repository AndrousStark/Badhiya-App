import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { globalSearch } from './api';
import type { SearchResult } from './schemas';
import { auth$ } from '@/stores/auth';

const DEBOUNCE_MS = 300;

export const searchKeys = {
  all: ['search'] as const,
  query: (businessId: string, q: string) =>
    [...searchKeys.all, businessId, q] as const,
};

/**
 * Debounced search hook. Pass the user's typed query; only fires the
 * backend call after 300ms of no typing.
 */
export function useGlobalSearch(query: string) {
  const businessId = auth$.businessId.get();
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  return useQuery<SearchResult>({
    queryKey: searchKeys.query(businessId ?? 'none', debounced),
    queryFn: () => globalSearch(businessId!, debounced),
    enabled: !!businessId && debounced.length >= 2,
    staleTime: 30_000,
  });
}
