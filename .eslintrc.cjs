/**
 * ESLint configuration for the Badhiya mobile app.
 *
 * Uses the Expo preset, which bundles TypeScript, React, React Hooks,
 * and Expo-specific rules. A few project-level overrides soften the
 * stricter React rules that don't apply to our code style (Devanagari
 * text in JSX, intentional any at platform boundaries, etc.).
 */

module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.expo/',
    'android/',
    'ios/',
    'drizzle/',
  ],
  rules: {
    // Hindi / Devanagari text in JSX triggers this erroneously.
    'react/no-unescaped-entities': 'off',
    // Our theme tokens use optional chain fallbacks with knowable safe values.
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};
