/**
 * ChatMessage — router that picks the right rendering for a message.
 *
 * Routing rules:
 *   user role           → ChatBubble
 *   isLoading=true      → TypingBubble
 *   isError|intent=error → ChatBubble (error variant)
 *   intent=daily_pnl    → PnlCard
 *   intent=health_score → HealthScoreCard
 *   intent=check_stock  → StockAlertCard
 *   intent=show_menu    → MenuCard
 *   intent=scheme_match → SchemeCard
 *   intent=record_*|loan_match → ActionCard
 *   default             → ChatBubble (graceful fallback)
 */

import { ChatBubble } from './ChatBubble';
import { TypingBubble } from './TypingBubble';
import { PnlCard } from './cards/PnlCard';
import { HealthScoreCard } from './cards/HealthScoreCard';
import { StockAlertCard } from './cards/StockAlertCard';
import { MenuCard } from './cards/MenuCard';
import { ActionCard } from './cards/ActionCard';
import { SchemeCard } from './cards/SchemeCard';
import type { ChatMessage as ChatMessageType } from '@/stores/chat';

interface Props {
  message: ChatMessageType;
  /** Tile tap on MenuCard / suggestion follow-up — sends as a new query. */
  onExample?: (query: string) => void;
  /** ActionCard CTA tap — opens the relevant sheet or screen. */
  onAction?: (intent: string) => void;
}

export function ChatMessage({ message, onExample, onAction }: Props) {
  // User messages are always plain text
  if (message.role === 'user') {
    return (
      <ChatBubble role="user" content={message.content} messageId={message.id} />
    );
  }

  // Loading state
  if (message.isLoading) {
    return <TypingBubble />;
  }

  // Error state
  if (message.isError || message.intent === 'error') {
    return (
      <ChatBubble
        role="assistant"
        content={message.content}
        messageId={message.id}
        isError
      />
    );
  }

  // Generative cards by intent
  switch (message.intent) {
    case 'daily_pnl':
      return <PnlCard responseText={message.content} />;
    case 'health_score':
      return <HealthScoreCard responseText={message.content} />;
    case 'check_stock':
      return <StockAlertCard responseText={message.content} />;
    case 'show_menu':
      return <MenuCard responseText={message.content} onExample={onExample} />;
    case 'scheme_match':
      return <SchemeCard responseText={message.content} />;
    case 'record_sale':
    case 'record_expense':
    case 'give_credit':
    case 'loan_match':
      return (
        <ActionCard
          responseText={message.content}
          intent={message.intent}
          onAction={onAction}
        />
      );
    default:
      return (
        <ChatBubble
          role="assistant"
          content={message.content}
          messageId={message.id}
        />
      );
  }
}
