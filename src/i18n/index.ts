/**
 * i18next bootstrap.
 *
 * Hindi is the default. Falls back to Hindi (not English) on missing keys —
 * because our target user is more likely to understand a Hindi fallback
 * than an English one.
 *
 * Locale detection via expo-localization on first launch; user can
 * override in Settings → Bhasha.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import hi from './locales/hi.json';
import en from './locales/en.json';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'hi';

// Pick initial language based on device locale. Hindi-speakers' devices
// are usually set to English, so we check for Devanagari script hints
// via the region (IN) and default to Hindi.
const initialLng = (() => {
  if (deviceLocale.startsWith('hi')) return 'hi';
  const region = Localization.getLocales()[0]?.regionCode;
  if (region === 'IN') return 'hi'; // Indian device → Hindi first
  return deviceLocale.startsWith('en') ? 'en' : 'hi';
})();

i18n.use(initReactI18next).init({
  resources: {
    hi: { translation: hi },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: 'hi',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
  returnNull: false,
});

export default i18n;
