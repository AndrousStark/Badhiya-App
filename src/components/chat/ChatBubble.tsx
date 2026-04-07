/**
 * ChatBubble — text message bubble with speak + copy actions.
 *
 * User: right-aligned, saffron background, white text — no actions
 * Assistant: left-aligned, surface background, ink text + tap-to-speak +
 *            long-press to copy text to clipboard
 *
 * Speak button shows an active state when this message is currently
 * being spoken via expo-speech.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { observer } from '@legendapp/state/react';
import { Volume2, VolumeX, Copy } from 'lucide-react-native';

import { Colors, FontFamily, FontSize, Spacing, Radius } from '@theme';
import { haptic } from '@/lib/haptics';
import { tts$, toggleSpeak } from '@/services/tts';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  /** Pass the message id so we can track which message is currently speaking. */
  messageId?: string;
}

export const ChatBubble = observer(function ChatBubble({
  role,
  content,
  isError = false,
  messageId,
}: Props) {
  const isUser = role === 'user';
  const [showCopied, setShowCopied] = useState(false);
  const speakingId = tts$.speakingId.get();
  const isSpeaking = !!messageId && speakingId === messageId;

  async function handleSpeak() {
    if (!messageId || !content) return;
    haptic('tap');
    await toggleSpeak(messageId, content);
  }

  async function handleLongPress() {
    if (isUser || !content) return;
    haptic('select');
    await Clipboard.setStringAsync(content);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  }

  return (
    <View
      style={[
        styles.row,
        isUser ? styles.rowUser : styles.rowAssistant,
      ]}
    >
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.bubble,
          isUser && styles.bubbleUser,
          !isUser && styles.bubbleAssistant,
          isError && styles.bubbleError,
          pressed && !isUser && styles.bubblePressed,
        ]}
      >
        <Text
          style={[
            styles.text,
            isUser && styles.textUser,
            isError && styles.textError,
          ]}
        >
          {content}
        </Text>

        {/* Action row — only on assistant messages with content */}
        {!isUser && content && !isError && (
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleSpeak}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionBtn,
                isSpeaking && styles.actionBtnActive,
                pressed && styles.actionBtnPressed,
              ]}
              accessibilityLabel={isSpeaking ? 'Stop speaking' : 'Speak message'}
            >
              {isSpeaking ? (
                <VolumeX color={Colors.saffron[600]} size={14} strokeWidth={2.4} />
              ) : (
                <Volume2 color={Colors.ink[400]} size={14} strokeWidth={2.4} />
              )}
            </Pressable>

            {showCopied && (
              <View style={styles.copiedToast}>
                <Copy color={Colors.profit[500]} size={11} strokeWidth={2.4} />
                <Text style={styles.copiedText}>Copied</Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
  },
  bubbleUser: {
    backgroundColor: Colors.saffron[500],
    borderBottomRightRadius: Radius.sm,
  },
  bubbleAssistant: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: Radius.sm,
  },
  bubbleError: {
    backgroundColor: Colors.loss[50],
    borderColor: Colors.loss[500],
  },
  bubblePressed: {
    backgroundColor: Colors.saffron[50],
  },
  text: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    lineHeight: 24,
  },
  textUser: {
    color: Colors.white,
  },
  textError: {
    color: Colors.loss[500],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: { backgroundColor: Colors.saffron[50] },
  actionBtnPressed: { opacity: 0.6 },
  copiedToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.profit[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  copiedText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.profit[700],
  },
});
