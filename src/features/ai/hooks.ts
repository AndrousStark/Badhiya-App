/**
 * AI query mutation hook.
 *
 * The chat screen owns the state of the conversation (via the chat
 * store). This hook is purely the network call — it does NOT push
 * messages into the store. That's the screen's job so it can render
 * the loading bubble immediately and replace it on response.
 */

import { useMutation } from '@tanstack/react-query';
import { queryAi } from './api';
import { haptic } from '@/lib/haptics';
import type { AiQueryResponse } from './schemas';

export function useAiQuery() {
  return useMutation<AiQueryResponse, Error, string>({
    mutationFn: (query) => queryAi(query),
    onSuccess: (data) => {
      // Haptic feedback varies by intent
      if (data.intent === 'error') {
        haptic('error');
      } else if (data.intent === 'daily_pnl' || data.intent === 'health_score') {
        haptic('revealMoney');
      } else {
        haptic('confirm');
      }
    },
    onError: () => haptic('error'),
  });
}
