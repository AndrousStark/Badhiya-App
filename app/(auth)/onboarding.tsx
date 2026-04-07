/**
 * Onboarding wizard — 4 steps.
 *
 *   1. Business type       (8-option grid)
 *   2. Shop name           (text input, optional voice)
 *   3. City / area         (text input)
 *   4. GST / Udyam (skip)  (optional compliance inputs)
 *
 * On submit: POST /businesses with all fields, hydrate auth store, go
 * to /(tabs). Users can back out any step via the header back button
 * or jump to a later step by completing earlier ones.
 *
 * Design rules:
 *   - ONE primary CTA per step (bottom saffron button)
 *   - Stepper at top shows progress
 *   - Each step uses FadeInUp for calm entry
 *   - Every input is 56dp+ tall for tier-3 thumbs
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, MapPin, Store as StoreIcon } from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
  TouchTarget,
} from '@/theme';
import { Button, Card, Stepper } from '@/components/ui';
import { FadeInUp } from '@/components/animations';
import { haptic } from '@/lib/haptics';
import {
  businessTypes,
  businessTypeLabels,
  createBusinessSchema,
  type BusinessType,
  type CreateBusinessDto,
} from '@/features/businesses/schemas';
import { useCreateBusiness } from '@/features/businesses/hooks';

type Step = 1 | 2 | 3 | 4;
const TOTAL_STEPS = 4;

interface FormState {
  type: BusinessType | null;
  name: string;
  city: string;
  area: string;
  gstin: string;
  udyam: string;
}

const EMPTY: FormState = {
  type: null,
  name: '',
  city: '',
  area: '',
  gstin: '',
  udyam: '',
};

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMut = useCreateBusiness();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    haptic('tap');
    if (step < TOTAL_STEPS) setStep((step + 1) as Step);
  }

  function prev() {
    haptic('tap');
    if (step > 1) setStep((step - 1) as Step);
  }

  async function submit() {
    setSubmitError(null);
    const dto: Partial<CreateBusinessDto> = {
      type: form.type ?? undefined,
      name: form.name.trim(),
      city: form.city.trim(),
      area: form.area.trim() || undefined,
      gstin: form.gstin.trim() || undefined,
      udyam: form.udyam.trim() || undefined,
    };
    const parsed = createBusinessSchema.safeParse(dto);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Please check your inputs';
      setSubmitError(msg);
      haptic('error');
      return;
    }

    try {
      await createMut.mutateAsync(parsed.data);
      haptic('revealMoney');
      router.replace('/(tabs)');
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Failed to save business';
      setSubmitError(msg);
      Alert.alert('Error', msg);
    }
  }

  const canContinue = (() => {
    switch (step) {
      case 1:
        return form.type !== null;
      case 2:
        return form.name.trim().length >= 2;
      case 3:
        return form.city.trim().length >= 2;
      case 4:
        return true; // GST/Udyam optional
      default:
        return false;
    }
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* ─── Header with back + stepper ───────────────── */}
        <View style={styles.header}>
          <Pressable
            onPress={step === 1 ? () => router.back() : prev}
            style={styles.backBtn}
            accessibilityLabel="Back"
          >
            <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: Spacing.lg }}>
            <Stepper
              total={TOTAL_STEPS}
              current={step}
              label={`Step ${step} of ${TOTAL_STEPS}`}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && <StepType form={form} update={update} />}
          {step === 2 && <StepName form={form} update={update} />}
          {step === 3 && <StepLocation form={form} update={update} />}
          {step === 4 && <StepCompliance form={form} update={update} />}

          {submitError ? (
            <Text style={styles.errorText}>{submitError}</Text>
          ) : null}
        </ScrollView>

        {/* ─── Bottom CTA ───────────────────────────────── */}
        <View style={styles.footer}>
          <Button
            label={step === TOTAL_STEPS ? 'Done · Dashboard pe jao' : 'Agla'}
            onPress={step === TOTAL_STEPS ? submit : next}
            size="hero"
            fullWidth
            disabled={!canContinue}
            loading={createMut.isPending}
            rightIcon={
              step === TOTAL_STEPS ? (
                <Check color={Colors.white} size={20} strokeWidth={2.6} />
              ) : (
                <ArrowRight color={Colors.white} size={20} strokeWidth={2.6} />
              )
            }
            hapticPattern={step === TOTAL_STEPS ? 'confirm' : 'tap'}
            testID={`onboarding-cta-step-${step}`}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 1 — Business type
// ═══════════════════════════════════════════════════════════
function StepType({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <FadeInUp delay={0}>
      <Text style={styles.title}>Aapka business kya hai?</Text>
      <Text style={styles.subtitle}>Apna business type chuno</Text>
      <View style={styles.typeGrid}>
        {businessTypes.map((t) => {
          const l = businessTypeLabels[t];
          const selected = form.type === t;
          return (
            <Pressable
              key={t}
              onPress={() => {
                haptic('select');
                update('type', t);
              }}
              style={({ pressed }) => [
                styles.typeCard,
                selected && styles.typeCardSelected,
                pressed && styles.typeCardPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              testID={`onboarding-type-${t}`}
            >
              <Text style={styles.typeEmoji}>{l.emoji}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  selected && styles.typeLabelSelected,
                ]}
                numberOfLines={2}
              >
                {l.hi}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FadeInUp>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 2 — Shop name
// ═══════════════════════════════════════════════════════════
function StepName({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const ref = useRef<TextInput>(null);
  return (
    <FadeInUp delay={0}>
      <Text style={styles.title}>Dukan ka naam kya hai?</Text>
      <Text style={styles.subtitle}>
        Jaise aap apne customers ko batate hain
      </Text>
      <View style={styles.inputWrap}>
        <StoreIcon color={Colors.saffron[500]} size={20} strokeWidth={2.2} />
        <TextInput
          ref={ref}
          value={form.name}
          onChangeText={(v) => update('name', v)}
          placeholder="Sharma General Store"
          placeholderTextColor={Colors.ink[300]}
          autoFocus
          autoCapitalize="words"
          maxLength={120}
          style={styles.input}
          testID="onboarding-name"
        />
      </View>
      <Text style={styles.helper}>
        Phonetic Hindi / Hinglish bhi chalega — "शर्मा जनरल स्टोर" ya "Sharma"
      </Text>
    </FadeInUp>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 3 — City & area
// ═══════════════════════════════════════════════════════════
function StepLocation({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <FadeInUp delay={0}>
      <Text style={styles.title}>Aapka shahar konsa hai?</Text>
      <Text style={styles.subtitle}>
        Taa ke hum aapke area ke hisaab se tips de sakein
      </Text>
      <View style={styles.inputWrap}>
        <MapPin color={Colors.saffron[500]} size={20} strokeWidth={2.2} />
        <TextInput
          value={form.city}
          onChangeText={(v) => update('city', v)}
          placeholder="Noida"
          placeholderTextColor={Colors.ink[300]}
          autoFocus
          autoCapitalize="words"
          maxLength={80}
          style={styles.input}
          testID="onboarding-city"
        />
      </View>
      <View style={[styles.inputWrap, { marginTop: Spacing.md }]}>
        <MapPin color={Colors.ink[400]} size={20} strokeWidth={2.2} />
        <TextInput
          value={form.area}
          onChangeText={(v) => update('area', v)}
          placeholder="Sector 62 (optional)"
          placeholderTextColor={Colors.ink[300]}
          autoCapitalize="words"
          maxLength={120}
          style={styles.input}
          testID="onboarding-area"
        />
      </View>
    </FadeInUp>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 4 — GST / Udyam (optional)
// ═══════════════════════════════════════════════════════════
function StepCompliance({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <FadeInUp delay={0}>
      <Text style={styles.title}>GST ya Udyam hai?</Text>
      <Text style={styles.subtitle}>
        Agar hai toh daal do, warna skip karo — baad mein bhi add kar sakte hain
      </Text>

      <Card variant="warm" padding="lg" style={{ marginBottom: Spacing.md }}>
        <Text style={styles.labelTitle}>GSTIN (optional)</Text>
        <TextInput
          value={form.gstin}
          onChangeText={(v) => update('gstin', v.toUpperCase())}
          placeholder="09ABCDE1234F1Z5"
          placeholderTextColor={Colors.ink[300]}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={15}
          style={styles.plainInput}
          testID="onboarding-gstin"
        />
      </Card>

      <Card variant="warm" padding="lg">
        <Text style={styles.labelTitle}>Udyam number (optional)</Text>
        <TextInput
          value={form.udyam}
          onChangeText={(v) => update('udyam', v.toUpperCase())}
          placeholder="UDYAM-UP-12-0001234"
          placeholderTextColor={Colors.ink[300]}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={30}
          style={styles.plainInput}
          testID="onboarding-udyam"
        />
      </Card>

      <Text style={[styles.helper, { marginTop: Spacing.lg }]}>
        💡 GST hone se Badhiya aapko automatic GSTR-1/3B filing,
        e-invoicing aur CGTMSE jaisi loan schemes offer kar sakta hai.
      </Text>
    </FadeInUp>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    marginBottom: Spacing['2xl'],
    lineHeight: 20,
  },
  helper: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  errorText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // Step 1 — type grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  typeCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    ...Shadow.sm,
  },
  typeCardSelected: {
    borderColor: Colors.saffron[500],
    backgroundColor: Colors.saffron[50],
    ...Shadow.saffronGlow,
  },
  typeCardPressed: { transform: [{ scale: 0.98 }] },
  typeEmoji: { fontSize: 36, marginBottom: Spacing.sm },
  typeLabel: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semibold,
    color: Colors.ink[700],
    textAlign: 'center',
  },
  typeLabelSelected: { color: Colors.saffron[700] },

  // Step 2/3 — text inputs
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: TouchTarget.badhiya,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    padding: 0,
  },

  // Step 4 — compliance cards
  labelTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  plainInput: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    padding: 0,
    letterSpacing: 0.5,
  },

  footer: {
    padding: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
});
