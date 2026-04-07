/**
 * LoanApplicationSheet — apply for a loan from a specific NBFC.
 *
 * Pre-fills name + phone from the auth store. User enters amount,
 * tenure, and optional PAN. Submits via useApplyForLoan, then opens
 * the NBFC magic link if returned.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { observer } from '@legendapp/state/react';
import {
  User,
  Phone,
  CreditCard,
  Calendar,
  Building2,
} from 'lucide-react-native';

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
import { useApplyForLoan } from '@/features/lending/hooks';
import {
  loanApplicationSchema,
  NBFC_META,
  type LoanApplicationDto,
} from '@/features/lending/schemas';
import { auth$ } from '@/stores/auth';

export interface LoanApplicationProps {
  visible: boolean;
  onClose: () => void;
  nbfcCode: 'flexiloans' | 'lendingkart' | 'kinara';
  maxAmount?: number;
  indicativeRate?: number;
  offerId?: string;
}

const TENURE_OPTIONS = [6, 12, 18, 24, 36];

export const LoanApplicationSheet = observer(function LoanApplicationSheet({
  visible,
  onClose,
  nbfcCode,
  maxAmount = 500000,
  indicativeRate,
  offerId,
}: LoanApplicationProps) {
  const [amount, setAmount] = useState('');
  const [tenure, setTenure] = useState(12);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [error, setError] = useState<string | null>(null);

  const applyMut = useApplyForLoan();
  const meta = NBFC_META[nbfcCode];

  useEffect(() => {
    if (visible) {
      // Pre-fill from auth store
      const userName = auth$.name.get();
      const userPhone = auth$.phone.get();
      setName(userName ?? '');
      setPhone(userPhone?.replace(/^\+91/, '') ?? '');
      setAmount('');
      setPan('');
      setTenure(12);
      setError(null);
    }
  }, [visible]);

  const amountNum = parseFloat(amount);
  const canSubmit =
    !isNaN(amountNum) &&
    amountNum >= 5000 &&
    amountNum <= maxAmount &&
    name.trim().length >= 2 &&
    /^[6-9]\d{9}$/.test(phone) &&
    !applyMut.isPending;

  // Approximate EMI calculation (simple interest)
  const monthlyEmi =
    !isNaN(amountNum) && indicativeRate
      ? Math.round(
          (amountNum * (1 + (indicativeRate / 100) * (tenure / 12))) / tenure,
        )
      : null;

  async function handleSubmit() {
    setError(null);
    const dto: LoanApplicationDto = {
      nbfcCode,
      requestedAmount: amountNum,
      applicantName: name.trim(),
      applicantPhone: phone.trim(),
      applicantPan: pan.trim() || undefined,
      tenureMonths: tenure,
      offerId: offerId,
    };
    const parsed = loanApplicationSchema.safeParse(dto);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your inputs');
      return;
    }
    try {
      const result = await applyMut.mutateAsync(parsed.data);
      onClose();
      // Open the magic link if NBFC returned one (KYC + e-sign flow)
      const magicLink = result.nbfcResponse?.magicLinkUrl;
      if (magicLink) {
        Linking.openURL(magicLink).catch(() => {
          /* user can find it in the apps list */
        });
      }
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Application failed');
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ─── NBFC banner ──────────────────────────── */}
        {meta && (
          <View
            style={[
              styles.banner,
              { backgroundColor: meta.gradient[0] },
            ]}
          >
            <Text style={styles.bannerEmoji}>{meta.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerName}>{meta.name}</Text>
              <Text style={styles.bannerTagline}>{meta.tagline}</Text>
            </View>
            {indicativeRate && (
              <View style={styles.rateBadge}>
                <Text style={styles.rateValue}>
                  {indicativeRate.toFixed(1)}%
                </Text>
                <Text style={styles.rateLabel}>p.a.</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.title}>Loan apply karein</Text>

        {/* ─── Amount ────────────────────────────────── */}
        <Text style={styles.label}>Amount (max ₹{maxAmount.toLocaleString('en-IN')})</Text>
        <View style={styles.amountWrap}>
          <Text style={styles.rupeeSign}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
            placeholder="50000"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="number-pad"
            autoFocus
            style={styles.amountInput}
            testID="loan-amount"
          />
        </View>

        {/* ─── Tenure chips ──────────────────────────── */}
        <Text style={styles.label}>Tenure (months)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tenureRow}
        >
          {TENURE_OPTIONS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTenure(t)}
              style={[
                styles.tenureChip,
                tenure === t && styles.tenureChipActive,
              ]}
            >
              <Text
                style={[
                  styles.tenureText,
                  tenure === t && styles.tenureTextActive,
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ─── EMI preview ───────────────────────────── */}
        {monthlyEmi && (
          <View style={styles.emiPreview}>
            <Calendar color={Colors.profit[500]} size={16} strokeWidth={2.4} />
            <Text style={styles.emiText}>
              Monthly EMI: ~₹{monthlyEmi.toLocaleString('en-IN')}
            </Text>
          </View>
        )}

        {/* ─── Applicant info ────────────────────────── */}
        <Text style={styles.label}>Applicant name</Text>
        <View style={styles.inputWrap}>
          <User color={Colors.saffron[500]} size={20} strokeWidth={2.2} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name as per PAN"
            placeholderTextColor={Colors.ink[300]}
            autoCapitalize="words"
            maxLength={120}
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>Phone</Text>
        <View style={styles.inputWrap}>
          <Phone color={Colors.saffron[500]} size={20} strokeWidth={2.2} />
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
            placeholder="9319788556"
            placeholderTextColor={Colors.ink[300]}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>PAN (optional)</Text>
        <View style={styles.inputWrap}>
          <CreditCard color={Colors.ink[400]} size={20} strokeWidth={2.2} />
          <TextInput
            value={pan}
            onChangeText={(v) => setPan(v.toUpperCase().slice(0, 10))}
            placeholder="ABCDE1234F"
            placeholderTextColor={Colors.ink[300]}
            autoCapitalize="characters"
            maxLength={10}
            style={[styles.input, { letterSpacing: 1 }]}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.disclaimer}>
          <Building2 color={Colors.ink[400]} size={14} strokeWidth={2.2} />
          <Text style={styles.disclaimerText}>
            Submission RBI-regulated NBFC ko jayegi. Final approval NBFC ke
            credit team par depend karega.
          </Text>
        </View>

        <View style={styles.submitWrap}>
          <Button
            label="Apply karo"
            onPress={handleSubmit}
            size="hero"
            fullWidth
            loading={applyMut.isPending}
            disabled={!canSubmit}
            hapticPattern="confirm"
            testID="loan-apply"
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  bannerEmoji: { fontSize: 28 },
  bannerName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  bannerTagline: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  rateBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  rateValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
  },
  rateLabel: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.ink[500],
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
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
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.saffron[50],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.saffron[200],
    minHeight: 76,
  },
  rupeeSign: {
    fontFamily: FontFamily.mono,
    fontSize: 32,
    fontWeight: FontWeight.heavy,
    color: Colors.saffron[600],
  },
  amountInput: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: 32,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    padding: 0,
  },
  tenureRow: { flexDirection: 'row', gap: Spacing.sm },
  tenureChip: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenureChipActive: {
    backgroundColor: Colors.saffron[500],
    borderColor: Colors.saffron[500],
  },
  tenureText: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
  },
  tenureTextActive: { color: Colors.white },
  emiPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.profit[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  emiText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.profit[700],
    fontWeight: FontWeight.bold,
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
    paddingHorizontal: Spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.ink[400],
    lineHeight: 16,
  },
  submitWrap: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
