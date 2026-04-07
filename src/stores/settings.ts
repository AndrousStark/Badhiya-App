/**
 * Settings store — user preferences persisted to MMKV.
 *
 * Phase 7 ships TTS-related preferences. Future phases will expand
 * this with notification prefs, language, theme, haptic level, etc.
 *
 * The Settings tab (More → Aawaz & Haptics) reads/writes these values.
 */

import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import type { HapticLevel } from '@/lib/haptics';

export interface SettingsState {
  // TTS / voice playback
  ttsAutoSpeak: boolean;     // automatically speak every assistant response
  ttsRate: number;           // 0.5 - 2.0 (1.0 default)
  ttsLanguage: 'hi-IN' | 'en-IN' | 'auto';

  // Haptics
  hapticLevel: HapticLevel;

  // Notifications
  morningBriefing: boolean;
  stockAlerts: boolean;
  creditReminders: boolean;
}

const defaults: SettingsState = {
  ttsAutoSpeak: false,
  ttsRate: 1.0,
  ttsLanguage: 'auto',
  hapticLevel: 'full',
  morningBriefing: true,
  stockAlerts: true,
  creditReminders: true,
};

export const settings$ = observable<SettingsState>(defaults);

syncObservable(settings$, {
  persist: {
    name: 'badhiya.settings',
    plugin: ObservablePersistMMKV,
  },
});
