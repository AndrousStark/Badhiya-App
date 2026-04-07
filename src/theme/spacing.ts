/**
 * BADHIYA Design Tokens — Spacing, Radius, Touch Targets, Shadows
 *
 * Touch targets: 56dp minimum for primary actions.
 * This is BIGGER than Material's 48dp and Apple's 44pt spec.
 * Reason: greasy thumbs, poor light, customer rush, low-quality screens.
 */

export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
  '6xl': 72,
  '7xl': 96,
} as const;

export const Radius = {
  none:  0,
  sm:    8,
  md:    12,
  lg:    14,
  xl:    16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  pill:  999,
} as const;

export const TouchTarget = {
  minimum:  44, // WCAG 2.5.5 — absolute floor
  comfort:  48, // Material Design spec
  badhiya:  56, // our primary — scaled up for tier-3 users
  heroCTA:  64, // big saffron buttons at screen bottoms
  voiceFAB: 96, // voice input mega-button
} as const;

export const Shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#1A1611',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1611',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1611',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.10,
    shadowRadius: 60,
    elevation: 8,
  },
  saffronGlow: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const ZIndex = {
  base:        0,
  card:        1,
  dropdown:    10,
  header:      20,
  overlay:     30,
  bottomSheet: 40,
  modal:       50,
  toast:       60,
  voiceSheet:  70,
} as const;
