/**
 * BADHIYA Design Tokens — Typography
 *
 * Body baseline 18sp (not the typical 14-16sp) to accommodate
 * 50+ year old kirana owners on low-quality screens.
 *
 * Line height 1.55 for Devanagari (taller than Latin's typical 1.4).
 *
 * Fonts (loaded via expo-font in app/_layout.tsx):
 * - Hind           — body, dual-script Devanagari + Latin, lightweight
 * - Anek Devanagari — headlines, modern variable font, characterful
 * - JetBrains Mono — tabular figures for rupee amounts
 * - Noto Sans Devanagari — fallback for missing glyphs
 */

export const FontFamily = {
  body:    'Hind_400Regular',
  bodyMedium: 'Hind_500Medium',
  bodySemibold: 'Hind_600SemiBold',
  bodyBold: 'Hind_700Bold',

  heading:    'AnekDevanagari_700Bold',
  headingHeavy: 'AnekDevanagari_800ExtraBold',

  mono:       'JetBrainsMono_500Medium',
  monoBold:   'JetBrainsMono_700Bold',

  fallback:   'NotoSansDevanagari_400Regular',
} as const;

export const FontSize = {
  display: 40, // hero numbers (today's profit)
  h1:      28, // screen titles
  h2:      22, // card titles, customer names
  h3:      20,
  body:    18, // DEFAULT — scaled UP for low literacy
  label:   16,
  caption: 14, // timestamps, secondary metadata
  micro:   12, // badges only — never primary info
} as const;

export const FontWeight = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  heavy:    '800',
} as const;

// Line heights are absolute (sp), not multipliers.
// Devanagari needs ~1.55 ratio; we bake that in.
export const LineHeight = {
  display: 48,
  h1:      34,
  h2:      28,
  h3:      26,
  body:    28, // 1.55 × 18
  label:   24,
  caption: 20,
  micro:   16,
} as const;

export const LetterSpacing = {
  tight:  -0.5, // display, h1
  normal: 0,
  wide:   0.5,  // buttons, chips
  wider:  1.2,  // uppercase labels
} as const;

export type FontSizeKey = keyof typeof FontSize;
