/**
 * Voice de-risk screen — Sprint 1 Day 3.
 *
 * Exit criterion: record "मेरी दुकान का नाम शर्मा जनरल स्टोर है" and see
 * the text appear within 3 seconds at ≥ 80% confidence.
 *
 * Delete this file in Phase 3.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { Colors, FontSize, FontWeight, Spacing, Radius, TouchTarget } from '../../src/theme';
import { transcribe, STTError, STTResult } from '../../src/services/stt';
import { haptic } from '../../src/lib/haptics';

export default function VoiceDebugScreen() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [result, setResult] = useState<STTResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  function log(msg: string) {
    const stamped = `${new Date().toLocaleTimeString()} · ${msg}`;
    setLogs((prev) => [stamped, ...prev].slice(0, 20));
  }

  async function startRecording() {
    setError(null);
    setResult(null);
    log('Requesting mic permission…');

    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setError('Microphone permission denied');
      log('❌ Mic denied');
      return;
    }

    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      haptic('voiceStart');
      log('🎤 Recording started');
    } catch (err) {
      setError(`Failed to start recording: ${(err as Error).message}`);
      log(`❌ start failed: ${(err as Error).message}`);
    }
  }

  async function stopAndTranscribe() {
    if (!isRecording) return;
    haptic('voiceEnd');

    try {
      await audioRecorder.stop();
      setIsRecording(false);
      log('⏹  Recording stopped');

      const uri = audioRecorder.uri;
      if (!uri) {
        setError('No audio URI after stop()');
        log('❌ no URI');
        return;
      }
      log(`📁 Audio URI: ${uri.slice(-40)}`);

      setIsTranscribing(true);
      log('📡 Uploading to /debug/stt…');

      const r = await transcribe(uri, 'hi');
      setResult(r);
      haptic('confirm');
      log(`✅ "${r.text}" (${r.latencyMs}ms, ${r.audioBytes}B)`);
    } catch (err) {
      haptic('error');
      if (err instanceof STTError) {
        setError(`[${err.code}] ${err.message}`);
        log(`❌ ${err.code}: ${err.message}`);
      } else {
        setError((err as Error).message);
        log(`❌ ${(err as Error).message}`);
      }
    } finally {
      setIsTranscribing(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setLogs([]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Sprint 1 · Day 3</Text>
          <Text style={styles.instructionBody}>
            Hold the mic button and say:{'\n\n'}
            <Text style={styles.hindi}>"मेरी दुकान का नाम शर्मा जनरल स्टोर है"</Text>
            {'\n\n'}
            Release to stop. Round-trip to Bhashini should complete in &lt; 3 s.
          </Text>
        </View>

        <View style={styles.micContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.micButton,
              isRecording && styles.micButtonRecording,
              pressed && styles.micButtonPressed,
            ]}
            onPressIn={startRecording}
            onPressOut={stopAndTranscribe}
            disabled={isTranscribing}
            accessibilityLabel="Hold to record"
            accessibilityRole="button"
          >
            {isTranscribing ? (
              <ActivityIndicator size="large" color={Colors.white} />
            ) : (
              <Text style={styles.micEmoji}>{isRecording ? '🔴' : '🎤'}</Text>
            )}
          </Pressable>
          <Text style={styles.micLabel}>
            {isTranscribing
              ? 'Transcribing…'
              : isRecording
              ? 'Listening… (release to stop)'
              : 'Hold to record'}
          </Text>
        </View>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Transcription</Text>
            <Text style={styles.resultText}>{result.text || '(empty)'}</Text>
            <View style={styles.resultMeta}>
              <Text style={styles.resultMetaText}>lang: {result.language}</Text>
              <Text style={styles.resultMetaText}>
                {result.audioBytes.toLocaleString()} bytes
              </Text>
              <Text style={styles.resultMetaText}>{result.latencyMs} ms</Text>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorLabel}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.logsCard}>
          <View style={styles.logsHeader}>
            <Text style={styles.logsTitle}>Event log</Text>
            <Pressable onPress={reset}>
              <Text style={styles.clearBtn}>Clear</Text>
            </Pressable>
          </View>
          {logs.length === 0 ? (
            <Text style={styles.logEmpty}>No events yet</Text>
          ) : (
            logs.map((l, i) => (
              <Text key={i} style={styles.logLine}>
                {l}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['5xl'] },
  instructionCard: {
    backgroundColor: Colors.trust[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.trust[500],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  instructionTitle: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.trust[700],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  instructionBody: {
    fontSize: FontSize.caption,
    color: Colors.ink[700],
    lineHeight: 22,
  },
  hindi: { fontWeight: FontWeight.bold, fontSize: FontSize.body },
  micContainer: { alignItems: 'center', marginVertical: Spacing['2xl'] },
  micButton: {
    width: TouchTarget.voiceFAB * 1.3,
    height: TouchTarget.voiceFAB * 1.3,
    borderRadius: 999,
    backgroundColor: Colors.saffron[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.saffron[500],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  micButtonRecording: { backgroundColor: Colors.loss[500] },
  micButtonPressed: { transform: [{ scale: 0.96 }] },
  micEmoji: { fontSize: 56 },
  micLabel: {
    marginTop: Spacing.lg,
    fontSize: FontSize.body,
    color: Colors.ink[500],
    fontWeight: FontWeight.medium,
  },
  resultCard: {
    backgroundColor: Colors.profit[50],
    borderWidth: 1,
    borderColor: Colors.profit[500],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  resultLabel: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.profit[700],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  resultText: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    lineHeight: 28,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  resultMetaText: {
    fontSize: FontSize.micro,
    color: Colors.ink[500],
    fontFamily: 'monospace',
  },
  errorCard: {
    backgroundColor: Colors.loss[50],
    borderWidth: 1,
    borderColor: Colors.loss[500],
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  errorLabel: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.loss[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  errorText: { fontSize: FontSize.caption, color: Colors.ink[700] },
  logsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logsTitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  clearBtn: {
    fontSize: FontSize.micro,
    color: Colors.saffron[600],
    fontWeight: FontWeight.semibold,
  },
  logEmpty: { fontSize: FontSize.micro, color: Colors.ink[400], fontStyle: 'italic' },
  logLine: {
    fontSize: 11,
    color: Colors.ink[700],
    fontFamily: 'monospace',
    paddingVertical: 2,
  },
});
