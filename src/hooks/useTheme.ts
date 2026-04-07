/**
 * useTheme — returns the current theme tokens.
 *
 * For Sprint 1 this just passes through the light theme. When we add
 * dark mode in a later phase, this hook becomes the one place to flip
 * the palette based on system or user preference.
 */

import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow, TouchTarget } from '../theme';

export function useTheme() {
  return {
    colors: Colors,
    fontSize: FontSize,
    fontWeight: FontWeight,
    spacing: Spacing,
    radius: Radius,
    shadow: Shadow,
    touchTarget: TouchTarget,
  };
}
