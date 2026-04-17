/**
 * Speech-to-text service.
 *
 * Strategy: record audio via expo-audio → base64-encode via expo-file-system
 * → POST to backend /debug/stt (Sprint 1) or /ai/speech-to-text (Phase 3) →
 * backend forwards to Bhashini → return Devanagari/Latin text.
 *
 * Why server-side Bhashini instead of on-device STT?
 *   1. Bhashini is the best Hindi STT (Govt of India, 22 languages, free)
 *   2. Keeps Bhashini credentials off the device (secure)
 *   3. Allows us to log/debug/cache at the server
 *   4. On-device fallback (expo-speech-recognition) for when offline
 */

import axios from 'axios';
// Legacy API retains the readAsStringAsync + EncodingType we need.
// SDK 55's top-level expo-file-system surface moved to a promise-less
// synchronous API; the legacy entry point preserves the old shape.
import * as FileSystem from 'expo-file-system/legacy';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1';

export interface STTResult {
  text: string;
  language: string;
  audioBytes: number;
  latencyMs: number;
}

export class STTError extends Error {
  constructor(
    public code:
      | 'no_audio'
      | 'read_failed'
      | 'network'
      | 'server_error'
      | 'bhashini_down'
      | 'unknown',
    message: string,
  ) {
    super(message);
    this.name = 'STTError';
  }
}

/**
 * Transcribe an audio file to text via the Bhashini-backed server endpoint.
 *
 * @param audioUri  Local file URI from expo-audio recorder (e.g. `file:///...`)
 * @param language  BCP-47 language code. Defaults to 'hi' (Hindi).
 */
export async function transcribe(
  audioUri: string,
  language: string = 'hi',
): Promise<STTResult> {
  if (!audioUri) {
    throw new STTError('no_audio', 'No audio URI provided');
  }

  // Read the audio file and base64-encode it.
  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (err) {
    throw new STTError(
      'read_failed',
      `Failed to read audio file: ${(err as Error).message}`,
    );
  }

  if (!base64 || base64.length === 0) {
    throw new STTError('no_audio', 'Audio file is empty');
  }

  // POST to the backend debug endpoint.
  // In Phase 3 this switches to authenticated /ai/speech-to-text.
  try {
    const response = await axios.post<STTResult>(
      `${API_URL}/debug/stt`,
      {
        audio: base64,
        language,
      },
      {
        timeout: 30_000,
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (!err.response) {
        throw new STTError(
          'network',
          `Network error: cannot reach ${API_URL}. Is the backend running?`,
        );
      }
      if (err.response.status >= 500) {
        throw new STTError(
          'server_error',
          `Server error ${err.response.status}: ${JSON.stringify(err.response.data)}`,
        );
      }
      throw new STTError(
        'server_error',
        `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`,
      );
    }
    throw new STTError('unknown', (err as Error).message);
  }
}
