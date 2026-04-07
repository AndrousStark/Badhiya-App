/**
 * AI Chat — "Pucho Kuch Bhi"
 *
 * Full-screen chat with the 7-layer AI pipeline. Renders generative
 * cards (PnlCard, HealthScoreCard, StockAlertCard, MenuCard, ActionCard)
 * instead of plain text whenever the AI returns a known intent.
 *
 * Voice + text input. Voice → Bhashini STT → text → AI query → cards.
 * Suggestion chips at the top when the chat is empty.
 *
 * Chat history persists to MMKV via the chat$ store, so the conversation
 * survives app restarts.
 */

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { observer } from '@legendapp/state/react';
import {
  ArrowLeft,
  Sparkles,
  Mic,
  Send,
  Trash2,
} from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
  TouchTarget,
} from '@/theme';
import { haptic } from '@/lib/haptics';
import { PulseOrb } from '@/components/animations';
import { ChatMessage, SuggestionChips } from '@/components/chat';
import { useSheets } from '@/components/sheets';
import { useAiQuery } from '@/features/ai/hooks';
import { autoSpeak, stopSpeaking } from '@/services/tts';
import {
  chatMessages$,
  addUserMessage,
  addLoadingAssistant,
  resolveAssistant,
  rejectAssistant,
  clearChat,
  type ChatMessage as ChatMessageType,
} from '@/stores/chat';

const SUGGESTIONS = [
  'aaj kitna kamaya?',
  'mera score kya hai?',
  'kya stock kam hai?',
  'PMEGP scheme batao',
  'business kaise badhaun?',
  'kya kar sakte ho?',
];

export default observer(function ChatScreen() {
  const messages = chatMessages$.get();
  const aiMut = useAiQuery();
  const { openVoice, openRecordSale, openGiveCredit } = useSheets();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessageType>>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Stop any in-progress speech when leaving the screen
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  // Find the latest non-loading assistant message for suggestion chips
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && !m.isLoading);

  async function sendQuery(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Stop any ongoing TTS before sending a new query
    stopSpeaking();

    setInput('');
    haptic('tap');

    // Optimistic user message + loading assistant placeholder
    addUserMessage(trimmed);
    const loadingId = addLoadingAssistant();

    try {
      const result = await aiMut.mutateAsync(trimmed);
      const content = result.response ?? 'OK!';
      resolveAssistant(loadingId, {
        content,
        intent: result.intent,
        source: result.source,
        confidence: result.confidence,
        actions: result.actions,
        model: result.model,
        tier: result.tier,
      });
      // Auto-speak if user has the preference enabled
      void autoSpeak(loadingId, content);
    } catch (err) {
      const msg = (err as { message?: string }).message ?? 'AI service unavailable';
      rejectAssistant(loadingId, `Maaf kijiye: ${msg}`);
    }
  }

  /**
   * Retry the last user query when the latest assistant message is an error.
   */
  function handleRetry() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    haptic('tap');
    sendQuery(lastUser.content);
  }

  function handleSend() {
    sendQuery(input);
  }

  function handleVoice() {
    haptic('voiceStart');
    openVoice({
      onConfirm: (parsed) => {
        // Use the raw transcript as the query
        sendQuery(parsed.raw);
      },
    });
  }

  function handleSuggestion(s: string) {
    sendQuery(s);
  }

  function handleClear() {
    Alert.alert(
      'Chat clear karein?',
      'Saari purani conversation hat jaayegi.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            haptic('swipeDelete');
            clearChat();
          },
        },
      ],
    );
  }

  function handleAction(intent: string) {
    haptic('tap');
    switch (intent) {
      case 'record_sale':
      case 'record_expense':
        openRecordSale({});
        break;
      case 'give_credit':
        openGiveCredit();
        break;
      case 'scheme_match':
        router.push('/finance/schemes');
        break;
      case 'loan_match':
        router.push('/finance/loans');
        break;
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          accessibilityLabel="Back"
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.brandRow}>
            <PulseOrb size={20} color={Colors.saffron[500]} />
            <View>
              <Text style={styles.headerTitle}>Badhiya AI</Text>
              <Text style={styles.headerSub}>Pucho Kuch Bhi</Text>
            </View>
          </View>
        </View>
        {messages.length > 0 && (
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityLabel="Clear chat"
          >
            <Trash2 color={Colors.ink[500]} size={20} strokeWidth={2.2} />
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kbWrap}
        keyboardVerticalOffset={0}
      >
        {/* ─── Messages ────────────────────────────────── */}
        {messages.length === 0 ? (
          <EmptyState onSuggestion={handleSuggestion} />
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => (
                <ChatMessage
                  message={item}
                  onExample={handleSuggestion}
                  onAction={handleAction}
                />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: false })
              }
              ListFooterComponent={
                lastAssistant && !lastAssistant.isError ? (
                  <SuggestionChips
                    intent={lastAssistant.intent}
                    onSuggestion={handleSuggestion}
                  />
                ) : lastAssistant?.isError ? (
                  <Pressable
                    onPress={handleRetry}
                    style={({ pressed }) => [
                      styles.retryBtn,
                      pressed && styles.retryBtnPressed,
                    ]}
                    accessibilityLabel="Retry the last query"
                  >
                    <Text style={styles.retryText}>Dobara try karo</Text>
                  </Pressable>
                ) : null
              }
            />
          </View>
        )}

        {/* ─── Input bar ──────────────────────────────── */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Sawal poocho ya likho..."
              placeholderTextColor={Colors.ink[300]}
              multiline
              maxLength={500}
              style={styles.input}
              testID="chat-input"
              onSubmitEditing={handleSend}
            />
          </View>
          {input.trim().length > 0 ? (
            <Pressable
              onPress={handleSend}
              disabled={aiMut.isPending}
              style={({ pressed }) => [
                styles.sendBtn,
                pressed && styles.sendBtnPressed,
                aiMut.isPending && styles.sendBtnDisabled,
              ]}
              accessibilityLabel="Send query"
            >
              <Send color={Colors.white} size={20} strokeWidth={2.4} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleVoice}
              style={({ pressed }) => [
                styles.sendBtn,
                pressed && styles.sendBtnPressed,
              ]}
              accessibilityLabel="Voice input"
            >
              <Mic color={Colors.white} size={20} strokeWidth={2.4} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

// ─── Empty state ─────────────────────────────────────
function EmptyState({ onSuggestion }: { onSuggestion: (q: string) => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyHero}>
        <View style={styles.emptyOrb}>
          <Sparkles color={Colors.white} size={32} strokeWidth={2.2} />
        </View>
        <Text style={styles.emptyTitle}>Namaste!</Text>
        <Text style={styles.emptyBody}>
          Main aapka AI business partner hoon.{'\n'}
          Hindi mein ya English mein, jo bhi pochna hai pochiye.
        </Text>
      </View>

      <Text style={styles.emptyLabel}>Suggestions</Text>
      <View style={styles.chips}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => onSuggestion(s)}
            style={({ pressed }) => [
              styles.chip,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  kbWrap: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: Colors.saffron[50] },
  headerCenter: { flex: 1 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  headerSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.saffron[600],
    fontWeight: FontWeight.semibold,
  },

  list: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  // Empty state
  empty: {
    flex: 1,
    padding: Spacing['2xl'],
    justifyContent: 'center',
  },
  emptyHero: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  emptyOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.saffronGlow,
  },
  emptyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    marginBottom: Spacing.sm,
  },
  emptyBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chipPressed: { backgroundColor: Colors.saffron[50] },
  chipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.ink[700],
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.comfort,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    padding: 0,
  },
  sendBtn: {
    width: TouchTarget.comfort,
    height: TouchTarget.comfort,
    borderRadius: TouchTarget.comfort / 2,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.saffronGlow,
  },
  sendBtnPressed: { backgroundColor: Colors.saffron[600] },
  sendBtnDisabled: { opacity: 0.5 },
  retryBtn: {
    alignSelf: 'center',
    backgroundColor: Colors.loss[50],
    borderWidth: 1.5,
    borderColor: Colors.loss[500],
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  retryBtnPressed: { backgroundColor: Colors.loss[500] },
  retryText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
    fontWeight: FontWeight.bold,
  },
});
