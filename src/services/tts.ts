/**
 * Text-to-speech service.
 *
 * Wraps expo-speech with state tracking. Tracks the currently-speaking
 * message ID via a Legend State observable so the UI can show a
 * visual indicator (orange pulse on the speak button).
 *
 * Auto-detects Hindi vs Latin script via a simple regex and picks
 * the appropriate locale. Falls back to en-IN for English text.
 *
 * Phase 7.5 will swap to Bhashini TTS for premium Hindi voices once
 * we have a backend endpoint for it.
 */

import * as Speech from 'expo-speech';
import { observable } from '@legendapp/state';
import { settings$ } from '@/stores/settings';

interface TtsState {
  speakingId: string | null;
  isPlaying: boolean;
}

export const tts$ = observable<TtsState>({
  speakingId: null,
  isPlaying: false,
});

/**
 * Heuristic: if the string contains Devanagari, use hi-IN locale.
 * Otherwise default to en-IN (Indian English voice).
 */
function detectLocale(text: string): string {
  return /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN';
}

/**
 * Speak a message. If another message is already playing, stop it first.
 *
 * @param messageId — used to track which message is currently speaking
 *                    so the UI can show the right speaker icon state.
 * @param text — the text to speak.
 */
export async function speak(messageId: string, text: string): Promise<void> {
  if (!text || text.trim().length === 0) return;

  // Stop any in-progress speech first
  if (tts$.isPlaying.get()) {
    Speech.stop();
  }

  tts$.set({ speakingId: messageId, isPlaying: true });

  try {
    Speech.speak(text, {
      language: detectLocale(text),
      pitch: 1.0,
      rate: 0.92, // slightly slower for clarity
      onDone: () => {
        tts$.set({ speakingId: null, isPlaying: false });
      },
      onStopped: () => {
        tts$.set({ speakingId: null, isPlaying: false });
      },
      onError: () => {
        tts$.set({ speakingId: null, isPlaying: false });
      },
    });
  } catch {
    tts$.set({ speakingId: null, isPlaying: false });
  }
}

/**
 * Stop any in-progress speech.
 */
export function stopSpeaking(): void {
  if (tts$.isPlaying.get()) {
    Speech.stop();
  }
  tts$.set({ speakingId: null, isPlaying: false });
}

/**
 * Toggle: if this message is currently speaking, stop. Otherwise speak it.
 */
export async function toggleSpeak(messageId: string, text: string): Promise<void> {
  if (tts$.speakingId.get() === messageId) {
    stopSpeaking();
  } else {
    await speak(messageId, text);
  }
}

/**
 * Auto-speak respects the user's preference. Use this from chat.tsx
 * after a new assistant message is resolved.
 */
export async function autoSpeak(messageId: string, text: string): Promise<void> {
  const enabled = settings$.ttsAutoSpeak.get();
  if (!enabled) return;
  await speak(messageId, text);
}
