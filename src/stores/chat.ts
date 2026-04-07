/**
 * Chat history store — Legend State observable persisted to MMKV.
 *
 * Survives app restart (so the user can resume their conversation),
 * scoped per-business via the storage name.
 *
 * Phase 7 keeps history in MMKV. If conversation depth grows large
 * enough to matter, Phase 7.5 can move to local Drizzle SQLite.
 */

import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import type { AiAction } from '@/features/ai/schemas';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  // Assistant-only metadata
  intent?: string;
  source?: string | null;
  confidence?: number;
  actions?: AiAction[];
  model?: string | null;
  tier?: number | null;
  isLoading?: boolean;
  isError?: boolean;
  createdAt: number;
}

const MAX_MESSAGES = 200; // cap to prevent runaway growth

export const chatMessages$ = observable<ChatMessage[]>([]);

syncObservable(chatMessages$, {
  persist: {
    name: 'badhiya.chat',
    plugin: ObservablePersistMMKV,
  },
});

// ─── Helpers ─────────────────────────────────────────
export function addUserMessage(content: string): string {
  const id = generateId('usr');
  const msg: ChatMessage = {
    id,
    role: 'user',
    content: content.trim(),
    createdAt: Date.now(),
  };
  pushAndCap(msg);
  return id;
}

export function addLoadingAssistant(): string {
  const id = generateId('ast');
  const msg: ChatMessage = {
    id,
    role: 'assistant',
    content: '',
    isLoading: true,
    createdAt: Date.now(),
  };
  pushAndCap(msg);
  return id;
}

export function resolveAssistant(
  id: string,
  partial: Partial<ChatMessage> & { content: string },
): void {
  const list = chatMessages$.get();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return;
  chatMessages$[idx]!.set({
    ...list[idx]!,
    ...partial,
    isLoading: false,
  });
}

export function rejectAssistant(id: string, errorMessage: string): void {
  const list = chatMessages$.get();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return;
  chatMessages$[idx]!.set({
    ...list[idx]!,
    content: errorMessage,
    isLoading: false,
    isError: true,
    intent: 'error',
  });
}

export function clearChat(): void {
  chatMessages$.set([]);
}

function pushAndCap(msg: ChatMessage): void {
  const next = [...chatMessages$.get(), msg];
  if (next.length > MAX_MESSAGES) {
    next.splice(0, next.length - MAX_MESSAGES);
  }
  chatMessages$.set(next);
}

function generateId(prefix: 'usr' | 'ast'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
