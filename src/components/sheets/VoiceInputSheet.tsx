/**
 * VoiceInputSheet — global voice recording bottom sheet.
 *
 * Flow:
 *   1. User taps mic FAB on Home → openVoice()
 *   2. Sheet opens with the breathing PulseOrb
 *   3. User holds the saffron mic button, speaks the transaction
 *   4. Release → expo-audio stops → file URI ready
 *   5. STT service uploads to backend Bhashini → returns text
 *   6. NLU parser extracts type/amount/item
 *   7. onConfirm callback fires (parent typically opens RecordSaleSheet)
 *
 * Errors at any step show inline with a retry option.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Mic, X, AlertCircle } from 'lucide-react-native';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';

import { BottomSheet } from './BottomSheet';
import { Button, Chip } from '@/components/ui';
import { PulseOrb } from '@/components/animations';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  TouchTarget,
  Shadow,
} from '@theme';
import { haptic } from '@/lib/haptics';
import { transcribe, STTError } from '@/services/stt';
import { parseTransaction, type ParsedTransaction } from '@/features/transactions/nlu';

type Phase = 'idle' | 'recording' | 'transcribing' | 'parsed' | 'error';

export interface VoiceInputProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the parsed result when the user taps "Confirm". */
  onConfirm?: (parsed: ParsedTransaction) => void;
  /** Override the language sent to the backend STT (default 'hi'). */
  language?: string;
}

export function VoiceInputSheet({
  visible,
  onClose,
  onConfirm,
  language = 'hi',
}: VoiceInputProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhase] = useState<Phase>('idle');
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPhase('idle');
    setParsed(null);
    setError(null);
  }

  async function handlePressIn() {
    if (phase === 'transcribing') return;
    setError(null);
    setParsed(null);

    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setError('Microphone permission denied');
      setPhase('error');
      haptic('error');
      return;
    }
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
      haptic('voiceStart');
    } catch (err) {
      setError(`Could not start recording: ${(err as Error).message}`);
      setPhase('error');
      haptic('error');
    }
  }

  async function handlePressOut() {
    if (phase !== 'recording') return;
    haptic('voiceEnd');

    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setError('No audio recorded');
        setPhase('error');
        return;
      }

      setPhase('transcribing');
      const result = await transcribe(uri, language);
      const nlu = parseTransaction(result.text);
      setParsed(nlu);
      setPhase('parsed');
      haptic('confirm');
    } catch (err) {
      if (err instanceof STTError) {
        setError(`[${err.code}] ${err.message}`);
      } else {
        setError((err as Error).message);
      }
      setPhase('error');
      haptic('error');
    }
  }

  function handleConfirm() {
    if (parsed) {
      onConfirm?.(parsed);
    }
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Bolo</Text>
        <Pressable onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close">
          <X color={Colors.ink[700]} size={20} strokeWidth={2.4} />
        </Pressable>
      </View>

      {phase === 'idle' && (
        <View style={styles.body}>
          <Text style={styles.hint}>
            Mic ko dabaye rakho aur transaction bolo
          </Text>
          <Text style={styles.example}>
            "becha 5 kg atta 250 rupaye"{'\n'}
            "bijli bill 4200 diya"{'\n'}
            "ravi se 500 mile"
          </Text>
        </View>
      )}

      {phase === 'recording' && (
        <View style={styles.body}>
          <PulseOrb size={32} color={Colors.loss[500]} style={styles.recordingDot} />
          <Text style={[styles.hint, styles.recordingText]}>
            Sun raha hoon… (chhodne par transcribe hoga)
          </Text>
        </View>
      )}

      {phase === 'transcribing' && (
        <View style={styles.body}>
          <PulseOrb size={32} color={Colors.saffron[500]} style={styles.recordingDot} />
          <Text style={styles.hint}>Bhashini se transcribe ho raha hai…</Text>
        </View>
      )}

      {phase === 'parsed' && parsed && (
        <View style={styles.body}>
          <Text style={styles.transcribed}>
            "{parsed.raw}"
          </Text>
          <View style={styles.parsedRow}>
            <Chip label={parsed.type ?? 'Unknown'} active />
            {parsed.amount !== null && (
              <Chip label={`₹${parsed.amount.toLocaleString('en-IN')}`} />
            )}
            {parsed.item && <Chip label={parsed.item} />}
            {parsed.customerName && <Chip label={parsed.customerName} />}
          </View>
          <Text style={styles.confidence}>
            Confidence: {Math.round(parsed.confidence * 100)}%
            {parsed.warnings.length > 0 ? ` · ${parsed.warnings[0]}` : ''}
          </Text>
        </View>
      )}

      {phase === 'error' && (
        <View style={styles.body}>
          <View style={styles.errorRow}>
            <AlertCircle color={Colors.loss[500]} size={22} strokeWidth={2.4} />
            <Text style={styles.errorText}>{error ?? 'Unknown error'}</Text>
          </View>
        </View>
      )}

      {/* ─── Mic button ──────────────────────────────── */}
      <View style={styles.micWrap}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={phase === 'transcribing'}
          style={({ pressed }) => [
            styles.mic,
            phase === 'recording' && styles.micRecording,
            phase === 'transcribing' && styles.micDisabled,
            pressed && styles.micPressed,
          ]}
          accessibilityLabel="Hold to record"
        >
          <Mic color={Colors.white} size={36} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.micLabel}>
          {phase === 'recording'
            ? 'Chhod do — transcribe karunga'
            : 'Dabaye rakho'}
        </Text>
      </View>

      {/* ─── Confirm / retry CTAs ────────────────────── */}
      {(phase === 'parsed' || phase === 'error') && (
        <View style={styles.actions}>
          <Button
            label="Try again"
            onPress={reset}
            variant="secondary"
            size="md"
            fullWidth
          />
          {phase === 'parsed' && (
            <Button
              label="Confirm"
              onPress={handleConfirm}
              size="md"
              fullWidth
              hapticPattern="confirm"
              style={styles.confirmBtn}
            />
          )}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  hint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[700],
    textAlign: 'center',
  },
  example: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  recordingDot: { marginBottom: Spacing.md },
  recordingText: { color: Colors.loss[500], fontWeight: FontWeight.bold },
  transcribed: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.h3,
    color: Colors.ink[900],
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  parsedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  confidence: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.loss[50],
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
  },
  micWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  mic: {
    width: TouchTarget.voiceFAB,
    height: TouchTarget.voiceFAB,
    borderRadius: TouchTarget.voiceFAB / 2,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.saffronGlow,
  },
  micRecording: { backgroundColor: Colors.loss[500] },
  micDisabled: { opacity: 0.6 },
  micPressed: { transform: [{ scale: 0.94 }] },
  micLabel: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  confirmBtn: { backgroundColor: Colors.saffron[500] },
});
