/**
 * Centralized haptics service.
 *
 * RULE: Never call `expo-haptics` directly from components.
 * Always go through this service so we can:
 *   - Respect user preference (Off / Minimal / Full)
 *   - Provide audio/visual fallbacks for accessibility
 *   - Swap the underlying backend later without touching components
 */

import * as Haptics from 'expo-haptics';

export type HapticPattern =
  | 'tap'          // any button press
  | 'confirm'      // successful save
  | 'error'        // validation fail
  | 'select'       // picker / chip toggle
  | 'voiceStart'   // mic held
  | 'voiceEnd'     // mic released
  | 'revealMoney'  // profit number unveiled
  | 'swipeDelete'; // swipe-to-delete commit

export type HapticLevel = 'off' | 'minimal' | 'full';

let userLevel: HapticLevel = 'full';

/**
 * Set the user's haptic preference. Wire this to the Settings screen
 * (Aawaz & Haptics section) and persist via Legend State + MMKV.
 */
export function setHapticLevel(level: HapticLevel): void {
  userLevel = level;
}

export function getHapticLevel(): HapticLevel {
  return userLevel;
}

/**
 * Fire a haptic pattern. Safe to call anywhere — respects user prefs.
 * Never throws.
 */
export function haptic(pattern: HapticPattern): void {
  if (userLevel === 'off') return;

  // Minimal level only fires the highest-signal patterns.
  const minimalAllowed: HapticPattern[] = ['confirm', 'error', 'revealMoney'];
  if (userLevel === 'minimal' && !minimalAllowed.includes(pattern)) return;

  try {
    switch (pattern) {
      case 'tap':
      case 'voiceEnd':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'voiceStart':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'revealMoney':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'confirm':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'swipeDelete':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'select':
        Haptics.selectionAsync();
        break;
    }
  } catch {
    // Device may not support haptics (emulator, older hardware). No-op.
  }
}
