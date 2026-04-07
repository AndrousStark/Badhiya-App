# Badhiya Mobile App

> **"Business ho jayega badhiya!"** — AI-powered, voice-first, WhatsApp-native business OS for 63M Indian MSMEs.

Channel 2 (Android app) of the Badhiya platform. Talks to the shared NestJS backend via REST. Built on **Expo SDK 55 + New Architecture + Hermes V1**.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo SDK 55 (RN 0.83, React 19.2) | Latest stable, New Arch only, Hermes V1 opt-in, OTA diffing |
| Router | expo-router 6 | File-based, typed routes, deep-link ready |
| State (client) | Legend State v3 | Signals + built-in offline sync engine |
| State (server) | TanStack Query v5 | Optimistic UI, offline mutation queue |
| Local DB | expo-sqlite + Drizzle ORM | Type-safe queries, `useLiveQuery` reactivity |
| KV cache | react-native-mmkv | 30x faster than AsyncStorage, AES-256 |
| Animations | Reanimated 4 + Skia | GPU-accelerated on ₹8K Androids |
| Charts | Victory Native XL | Skia-backed, 60fps |
| Voice | expo-audio + Bhashini (server-side) | Hindi STT, code-switched Hinglish |
| Camera | expo-camera + ML Kit OCR (future) | Receipt scanning, barcode |
| i18n | i18next | 11+ languages, Hindi default |
| E2E | Maestro | YAML tests, <1% flaky, reads Hindi labels |
| Monitoring | Sentry + PostHog | Crash + analytics + session replay |

See **[./badhiya-mobile-plan.html](./badhiya-mobile-plan.html)** for the master plan (strategy, research, 20 screen mockups, 10-phase roadmap). The Sprint 1 execution detail is inlined below.

## Directory structure

```
mobile-app/
├── app/                    # expo-router file-based routes
│   ├── _layout.tsx         # Root providers (Query, SafeArea, Gesture, i18n)
│   ├── index.tsx           # Redirect to /(auth) or /(tabs) based on auth
│   ├── (auth)/             # Unauthenticated stack — login, onboarding
│   └── (tabs)/             # Main 5-tab shell — home, khata, dukan, paisa, more
├── src/
│   ├── theme/              # Colors, typography, spacing, radius, shadows
│   ├── lib/                # api.ts (REST client), haptics.ts, storage.ts
│   ├── stores/             # Legend State observables (auth, ui, sync)
│   ├── db/                 # Drizzle schema + SQLite client
│   ├── i18n/               # i18next setup + locales/{hi,en}.json
│   ├── hooks/              # useTheme, useHaptics, useSync, ...
│   ├── features/           # Feature slices (home/, khata/, dukan/, paisa/)
│   └── components/         # Shared primitives (KpiTile, TxnRow, Sheet, ...)
├── assets/                 # Icons, splash, fonts, Lottie files
├── .maestro/               # E2E test flows
├── app.json                # Expo config (New Arch, Hermes, permissions)
├── eas.json                # EAS Build + Update profiles
└── package.json
```

## Quick start

### Prerequisites

- **Node.js 20+**
- **pnpm** (or npm)
- **Android Studio** with SDK 34+ and an Android 14 emulator (or ₹8K real device)
- **Xcode 26+** (iOS only, optional for Phase 1)
- **EAS CLI**: `npm i -g eas-cli`
- **Maestro CLI**: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- Badhiya **backend** running locally on port 4000 — see `../backend/README.md`

### Install

```bash
cd mobile-app

# 1. Install deps
npm install

# 2. Let Expo fix version mismatches across expo-* packages
npx expo install --fix

# 3. Copy env file
cp .env.example .env
```

### Run on Android

```bash
# Start Metro
npm start

# In another terminal — build + install on connected device/emulator
npm run android
```

### Run on iOS (macOS only)

```bash
npm run ios
```

## Key commands

| Command | What it does |
|---|---|
| `npm start` | Launch Metro bundler |
| `npm run android` | Prebuild + install on Android |
| `npm run ios` | Prebuild + install on iOS |
| `npm run typecheck` | `tsc --noEmit` over the whole app |
| `npm run lint` | ESLint check |
| `npm run test` | Jest unit tests |
| `npm run test:e2e` | Maestro E2E flows |
| `npm run db:generate` | Drizzle schema → migration files |
| `npm run eas:build:dev` | Build dev APK via EAS |
| `npm run eas:update:staging` | Push OTA to staging channel |

---

## Sprint 1 · Execution Plan

Goal of Sprint 1: **scaffold + de-risk**. Not a single feature ships in Sprint 1. We prove the riskiest unknowns (voice, offline sync, native build on cheap Android) work on a real ₹8K device before committing to anything else.

### Exit criteria (all 5 must pass before Sprint 2)

- [ ] Cold boot **< 2.5 seconds** on a real Redmi A-series (or equivalent ₹8K Android)
- [ ] **Voice round-trip works**: record Hindi with `expo-audio` → POST to NestJS → Bhashini STT → receive Devanagari text with ≥ 80% confidence
- [ ] **Offline sync round-trip works**: create a transaction offline, kill app, reopen, go online, verify sync within 30s
- [ ] **EAS dev build installs** on a real device via `npm run eas:build:dev`
- [ ] **Maestro smoke test** opens the app and screenshots without crashing

### Day 1 — Scaffolding ✅ (this session)

Zero code execution, purely additive file creation:

- [x] Root configs — `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `eas.json`, `.env.example`, `.gitignore`
- [x] Design system tokens — `src/theme/{colors,typography,spacing,index}.ts`
- [x] Core services — `src/lib/{api,haptics,storage}.ts`
- [x] State + DB skeleton — `src/stores/auth.ts`, `src/db/{schema,client}.ts`
- [x] i18n bootstrap — `src/i18n/index.ts` + `locales/{hi,en}.json`
- [x] Root layout + placeholder routes — `app/_layout.tsx`, `app/index.tsx`, `app/(auth)/login.tsx`

### Day 2 — Install + first build

```bash
cd BadhiyaAI/mobile-app
npm install                 # ~3 min first time
npx expo install --fix      # let Expo resolve expo-* version mismatches
npm run typecheck           # must pass cleanly
npm run android             # first native build, ~5-10 min
```

**Success:** App opens on emulator/device showing "Login" placeholder. No crashes.

### Day 3 — Voice round-trip de-risk

Create `app/_debug/voice.tsx` that records 5 seconds via `expo-audio`, base64-encodes, POSTs to `POST /api/v1/ai/speech-to-text` (new NestJS endpoint that wraps the existing `providers/bhashini.ts` client), displays the returned Devanagari text with confidence score.

**Success:** Record "मेरी दुकान का नाम शर्मा जनरल स्टोर है" and see the text appear within 3 seconds at ≥ 80% confidence.

**Backend work required:** Add `POST /ai/speech-to-text` endpoint to NestJS — ~15 min since the Bhashini provider already exists.

### Day 4 — Offline sync de-risk

Create `app/_debug/sync.tsx` that writes fake transactions to Drizzle + Legend State, marks them `syncStatus: "created"`, attempts `syncedFetch` to `POST /businesses/:id/transactions`, and flips to `"synced"` on server acknowledgement.

**Test flow:** airplane mode ON → create 3 txns → kill app → reopen (all 3 still "created") → airplane mode OFF → all 3 flip to "synced" within 30s → backend shows 3 new records.

### Day 5 — Real-device performance + Maestro smoke test

Install dev build on a real ₹8K Android. Measure:

| Metric | Target |
|---|---|
| Cold boot | < 2.5 s |
| Memory footprint | < 150 MB |
| APK size | < 35 MB |
| Scroll FPS (100-row list) | 60 FPS sustained |

Create `.maestro/smoke.yml`:

```yaml
appId: com.badhiya.app
---
- launchApp
- assertVisible: "Login"
- takeScreenshot: launch
```

Run `npm run test:e2e` — screenshot must appear in `.maestro/screenshots/`.

### What Sprint 1 does NOT do

- ❌ No real login/OTP flow (Phase 3)
- ❌ No real screens — just `_debug` throwaways
- ❌ No animations, no Skia, no charts
- ❌ No Hindi fonts loaded (use system default)
- ❌ No gamification, loans, schemes, ONDC
- ❌ No WhatsApp deep links
- ❌ No production Sentry/PostHog wiring (just SDK installed)

Every one of these has a dedicated later sprint — see `./badhiya-mobile-plan.html` Phase 2-11.

---

## Author

**Aniruddh Atrey** · [aniruddhatrey.com](https://aniruddhatrey.com) · [@AndrousStark](https://github.com/AndrousStark)

Private. Copyright 2026.
