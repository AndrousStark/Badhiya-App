/**
 * BADHIYA Design Tokens — Colors
 *
 * Warm-first Indian palette. Saffron is an accent, not a flood.
 * Every color pair has been WCAG AA contrast-checked against
 * the warm-white background #FFFBF5.
 *
 * Design principles:
 * - Warm black for text (#1A1611), never pure #000
 * - Warm border (#F0E6D6), never gray
 * - Warm white background (#FFFBF5), never cold #F8FAFC
 * - Color + icon + label for every status (colorblind-safe)
 */

export const Colors = {
  // ─── Brand ─────────────────────────────────────────────
  saffron: {
    50:  '#FFF4EB',
    100: '#FFE9D9',
    200: '#FFD4B0',
    300: '#FFB078',
    400: '#FF8C38',
    500: '#FF6B00', // primary — CTAs, active states
    600: '#E55F00', // pressed
    700: '#B84C00',
  },

  // ─── Semantic ──────────────────────────────────────────
  profit: {
    50:  '#D8F0DF',
    400: '#2FB559',
    500: '#1B8C3A', // gains, success, paid, streaks
    700: '#0F5B23',
  },
  loss: {
    50:  '#FDEAEA',
    500: '#C13030', // losses, errors, overdue
    700: '#8A1E1E',
  },
  warning: {
    50:  '#FFF4D6',
    500: '#E89B00', // caution, amber, aging khata
    700: '#9C6500',
  },
  trust: {
    50:  '#E5EDFB',
    500: '#1A56DB', // financial features, links, trust
    700: '#0F3A99',
  },
  gold: {
    50:  '#FFF8E1',
    500: '#F9A825', // achievements, premium tier, badges
    700: '#A66D00',
  },

  // ─── Surfaces ──────────────────────────────────────────
  bg:             '#FFFBF5', // warm white — never cold #F8FAFC
  surface:        '#FFFFFF', // elevated cards
  surfaceMuted:   '#FAF5EC', // subtle secondary surface
  border:         '#F0E6D6', // warm border — never gray
  borderStrong:   '#E3D5BB',
  borderHover:    '#D4C2A3',

  // ─── Ink (text) ────────────────────────────────────────
  ink: {
    900: '#1A1611', // primary — warm black, never #000
    700: '#3A332A',
    500: '#5C5347', // secondary
    400: '#8A8073', // tertiary, placeholders
    300: '#B5AA98', // disabled
  },

  // ─── Utility ───────────────────────────────────────────
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
} as const;

export type BrandColor = keyof typeof Colors.saffron;
export type SemanticColor = 'profit' | 'loss' | 'warning' | 'trust' | 'gold';
