/**
 * RegisterOndcSellerSheet — onboard a business as an ONDC seller.
 *
 * Pre-fills name + phone + city from auth store. User completes:
 *   - Store address (door, street, locality, city, state, pincode)
 *   - GPS coordinates (manual lat,lng — Phase 9.5 will auto-detect via expo-location)
 *   - Optional FSSAI / GST
 *   - Serviceability radius (1-50 km)
 *   - Avg prep time (5-180 min)
 *   - Delivery mode (self / logistics / both)
 *
 * Submits to POST /ondc/register. On success the config screen unlocks.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { observer } from '@legendapp/state/react';
import { Store, MapPin, FileText, Clock } from 'lucide-react-native';

import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  TouchTarget,
} from '@theme';
import { useRegisterOndcSeller } from '@/features/ondc/hooks';
import { registerSellerSchema } from '@/features/ondc/schemas';
import { auth$ } from '@/stores/auth';

export interface RegisterOndcSellerProps {
  visible: boolean;
  onClose: () => void;
}

const DELIVERY_MODES: Array<{
  value: 'self' | 'logistics' | 'both';
  label: string;
  emoji: string;
}> = [
  { value: 'self', label: 'Khud delivery', emoji: '🛵' },
  { value: 'logistics', label: '3rd party', emoji: '📦' },
  { value: 'both', label: 'Both', emoji: '🤝' },
];

export const RegisterOndcSellerSheet = observer(function RegisterOndcSellerSheet({
  visible,
  onClose,
}: RegisterOndcSellerProps) {
  const registerMut = useRegisterOndcSeller();

  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [street, setStreet] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [gps, setGps] = useState('');
  const [gst, setGst] = useState('');
  const [fssai, setFssai] = useState('');
  const [radius, setRadius] = useState(5);
  const [prepTime, setPrepTime] = useState(30);
  const [deliveryMode, setDeliveryMode] = useState<'self' | 'logistics' | 'both'>('self');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      const businessName = auth$.businessName.get();
      const phone = auth$.phone.get();
      const cityFromAuth = auth$.businessCity.get();
      setStoreName(businessName ?? '');
      setStorePhone(phone?.replace(/^\+91/, '') ?? '');
      setCity(cityFromAuth ?? '');
      setError(null);
    }
  }, [visible]);

  const canSubmit =
    storeName.trim().length > 0 &&
    /^[6-9]\d{9}$/.test(storePhone) &&
    street.trim().length > 0 &&
    locality.trim().length > 0 &&
    city.trim().length > 0 &&
    stateName.trim().length > 0 &&
    /^\d{6}$/.test(pincode) &&
    /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(gps) &&
    !registerMut.isPending;

  async function handleSubmit() {
    setError(null);
    const parsed = registerSellerSchema.safeParse({
      storeName: storeName.trim(),
      storePhone: storePhone.trim(),
      storeEmail: storeEmail.trim() || undefined,
      storeAddress: {
        street: street.trim(),
        locality: locality.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        gps: gps.trim(),
      },
      gstNumber: gst.trim() || undefined,
      fssaiLicense: fssai.trim() || undefined,
      serviceabilityRadiusKm: radius,
      avgPreparationTimeMin: prepTime,
      deliveryMode,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your inputs');
      return;
    }
    try {
      await registerMut.mutateAsync(parsed.data);
      onClose();
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Registration failed');
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>ONDC mein register karein</Text>
        <Text style={styles.subtitle}>
          ONDC ek government open commerce network hai. Register karke aap
          puri India mein customers ko bech sakte hain.
        </Text>

        {/* ─── Store name ────────────────────────── */}
        <Text style={styles.label}>Store name</Text>
        <View style={styles.inputWrap}>
          <Store color={Colors.saffron[500]} size={20} strokeWidth={2.2} />
          <TextInput
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Sharma General Store"
            placeholderTextColor={Colors.ink[300]}
            autoCapitalize="words"
            maxLength={255}
            style={styles.input}
          />
        </View>

        {/* ─── Phone + Email ─────────────────────── */}
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                value={storePhone}
                onChangeText={(v) => setStorePhone(v.replace(/\D/g, '').slice(0, 10))}
                placeholder="9319788556"
                placeholderTextColor={Colors.ink[300]}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
              />
            </View>
          </View>
        </View>

        <Text style={styles.label}>Email (optional)</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={storeEmail}
            onChangeText={setStoreEmail}
            placeholder="store@example.com"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {/* ─── Address block ─────────────────────── */}
        <Text style={styles.sectionLabel}>Store Address</Text>

        <Text style={styles.label}>Street</Text>
        <View style={styles.inputWrap}>
          <MapPin color={Colors.saffron[500]} size={20} strokeWidth={2.2} />
          <TextInput
            value={street}
            onChangeText={setStreet}
            placeholder="Main Bazaar Road"
            placeholderTextColor={Colors.ink[300]}
            style={styles.input}
          />
        </View>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Locality</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={locality}
                onChangeText={setLocality}
                placeholder="Sector 62"
                placeholderTextColor={Colors.ink[300]}
                style={styles.input}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Pincode</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={pincode}
                onChangeText={(v) => setPincode(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="201301"
                placeholderTextColor={Colors.ink[300]}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
            </View>
          </View>
        </View>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>City</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Noida"
                placeholderTextColor={Colors.ink[300]}
                autoCapitalize="words"
                style={styles.input}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>State</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={stateName}
                onChangeText={setStateName}
                placeholder="UP"
                placeholderTextColor={Colors.ink[300]}
                autoCapitalize="words"
                style={styles.input}
              />
            </View>
          </View>
        </View>

        <Text style={styles.label}>GPS coordinates (lat,lng)</Text>
        <View style={styles.inputWrap}>
          <MapPin color={Colors.ink[400]} size={20} strokeWidth={2.2} />
          <TextInput
            value={gps}
            onChangeText={setGps}
            placeholder="28.6139, 77.2090"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="numbers-and-punctuation"
            style={styles.input}
          />
        </View>
        <Text style={styles.helper}>
          Tip: Google Maps mein apni dukan find karke long-press karein,
          coordinates copy ho jayegi.
        </Text>

        {/* ─── GST + FSSAI ───────────────────────── */}
        <Text style={styles.sectionLabel}>Compliance (optional)</Text>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>GSTIN</Text>
            <View style={styles.inputWrap}>
              <FileText color={Colors.ink[400]} size={20} strokeWidth={2.2} />
              <TextInput
                value={gst}
                onChangeText={(v) => setGst(v.toUpperCase().slice(0, 15))}
                placeholder="09ABCDE1234F1Z5"
                placeholderTextColor={Colors.ink[300]}
                autoCapitalize="characters"
                style={[styles.input, { letterSpacing: 0.5 }]}
              />
            </View>
          </View>
        </View>

        <Text style={styles.label}>FSSAI license</Text>
        <View style={styles.inputWrap}>
          <FileText color={Colors.ink[400]} size={20} strokeWidth={2.2} />
          <TextInput
            value={fssai}
            onChangeText={setFssai}
            placeholder="14-digit FSSAI"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="number-pad"
            maxLength={20}
            style={styles.input}
          />
        </View>

        {/* ─── Serviceability ────────────────────── */}
        <Text style={styles.sectionLabel}>Delivery</Text>

        <Text style={styles.label}>Serviceability radius: {radius} km</Text>
        <View style={styles.numberRow}>
          {[1, 3, 5, 10, 15, 25, 50].map((r) => (
            <Pressable
              key={r}
              onPress={() => setRadius(r)}
              style={[
                styles.numberChip,
                radius === r && styles.numberChipActive,
              ]}
            >
              <Text
                style={[
                  styles.numberChipText,
                  radius === r && styles.numberChipTextActive,
                ]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Avg preparation time: {prepTime} min</Text>
        <View style={styles.numberRow}>
          {[5, 15, 30, 45, 60, 90, 120].map((t) => (
            <Pressable
              key={t}
              onPress={() => setPrepTime(t)}
              style={[
                styles.numberChip,
                prepTime === t && styles.numberChipActive,
              ]}
            >
              <Text
                style={[
                  styles.numberChipText,
                  prepTime === t && styles.numberChipTextActive,
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Delivery mode</Text>
        <View style={styles.modeRow}>
          {DELIVERY_MODES.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => setDeliveryMode(m.value)}
              style={[
                styles.modeBtn,
                deliveryMode === m.value && styles.modeBtnActive,
              ]}
            >
              <Text style={styles.modeEmoji}>{m.emoji}</Text>
              <Text
                style={[
                  styles.modeLabel,
                  deliveryMode === m.value && styles.modeLabelActive,
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.disclaimer}>
          <Clock color={Colors.ink[400]} size={14} strokeWidth={2.2} />
          <Text style={styles.disclaimerText}>
            Registration ke baad seller key generate hogi. ONDC network
            verification mein 24-48 ghante lagte hain. Phir aap "Go Live"
            kar sakte hain.
          </Text>
        </View>

        <View style={styles.submitWrap}>
          <Button
            label="Register karo"
            onPress={handleSubmit}
            size="hero"
            fullWidth
            loading={registerMut.isPending}
            disabled={!canSubmit}
            hapticPattern="confirm"
            testID="ondc-register-submit"
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.saffron[600],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
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
  prefix: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    color: Colors.ink[700],
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    padding: 0,
  },
  row2: { flexDirection: 'row', gap: Spacing.md },
  helper: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  numberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  numberChip: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberChipActive: {
    backgroundColor: Colors.saffron[500],
    borderColor: Colors.saffron[500],
  },
  numberChipText: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    color: Colors.ink[700],
    fontWeight: FontWeight.bold,
  },
  numberChipTextActive: { color: Colors.white },
  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: Colors.saffron[50],
    borderColor: Colors.saffron[500],
  },
  modeEmoji: { fontSize: 22 },
  modeLabel: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: 11,
    color: Colors.ink[700],
    marginTop: 2,
  },
  modeLabelActive: { color: Colors.saffron[700] },
  errorText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    color: Colors.loss[500],
    marginTop: Spacing.md,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.trust[50],
    borderRadius: Radius.md,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[500],
    lineHeight: 16,
  },
  submitWrap: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
