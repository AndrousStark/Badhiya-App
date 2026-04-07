/**
 * /rewards/spin — Spin the Badhiya reward wheel.
 *
 * Wires:
 *   - useGamificationProfile() → spinsRemaining (read-only header)
 *   - useSpinWheel() → POST /gamification/spin
 *
 * Visual: 6-segment SVG wheel that rotates with Reanimated 4 when the
 * user taps "Spin now". On API success, the wheel slows over 2.8s and
 * a modal slides up showing the prize. Daily limit is enforced server-
 * side; we just disable the CTA when spinsRemaining is 0.
 *
 * Note: backend chooses the prize based on weighted probability — we
 * don't know which segment to land on in advance, so the wheel
 * settles to a "winning" visual angle that matches the returned prize
 * type's segment. Pure cosmetic.
 */

import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@/theme';
import { haptic } from '@/lib/haptics';
import { Button } from '@/components/ui';
import { FadeInUp } from '@/components/animations';
import {
  useGamificationProfile,
  useSpinWheel,
} from '@/features/gamification/hooks';
import type { SpinResult } from '@/features/gamification/schemas';

// Visual segments (6) — purely cosmetic, backend assigns the actual prize
const SEGMENTS = [
  { label: '50',     emoji: '🪙', color: '#F59E0B' },
  { label: '10',     emoji: '🪙', color: '#FFE0B2' },
  { label: '100',    emoji: '⭐', color: '#FF6B35' },
  { label: '20',     emoji: '🪙', color: '#FFE0B2' },
  { label: 'Badge',  emoji: '🏅', color: '#7C3AED' },
  { label: '200',    emoji: '💎', color: '#0EA5E9' },
];

const WHEEL_SIZE = 280;
const RADIUS = WHEEL_SIZE / 2;
const SEGMENT_ANGLE = 360 / SEGMENTS.length;

export default function SpinWheelScreen() {
  const profileQ = useGamificationProfile();
  const spinMut = useSpinWheel();

  const rotation = useSharedValue(0);
  const totalRotation = useRef(0);

  const [resultModal, setResultModal] = useState<SpinResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const spinsRemaining = profileQ.data?.spinStatus.spinsRemaining ?? 0;

  function showResult(result: SpinResult) {
    setIsSpinning(false);
    setResultModal(result);
    haptic('revealMoney');
  }

  async function handleSpin() {
    if (isSpinning || spinsRemaining === 0) return;
    setIsSpinning(true);
    haptic('tap');

    try {
      // Fire the API and animation in parallel — animation lasts 2.8s
      const apiPromise = spinMut.mutateAsync();

      // Random landing position so each spin feels different visually
      const landingOffset = Math.random() * 360;
      const finalRotation = totalRotation.current + 1800 + landingOffset; // 5 full turns
      totalRotation.current = finalRotation;

      rotation.value = withTiming(
        finalRotation,
        {
          duration: 2800,
          easing: Easing.out(Easing.cubic),
        },
      );

      // Wait for both API and visual to finish
      const [result] = await Promise.all([
        apiPromise,
        new Promise<void>((resolve) => setTimeout(resolve, 2900)),
      ]);

      showResult(result);
    } catch (err) {
      setIsSpinning(false);
      Alert.alert('Spin failed', (err as Error).message);
    }
  }

  function handleCloseResult() {
    haptic('tap');
    setResultModal(null);
    profileQ.refetch();
  }

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Spin Wheel</Text>
          <Text style={styles.subtitle}>
            {profileQ.isLoading
              ? 'Loading…'
              : `${spinsRemaining} spin${spinsRemaining === 1 ? '' : 's'} baki aaj`}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <FadeInUp delay={0}>
          <Text style={styles.tagline}>Roz spin karo · Coin jeeto 🎉</Text>
        </FadeInUp>

        {/* ─── Wheel ─────────────────────────────────── */}
        <FadeInUp delay={80}>
          <View style={styles.wheelContainer}>
            {/* Indicator pointer at top */}
            <View style={styles.pointer} />
            <Animated.View style={wheelStyle}>
              <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                <G>
                  {SEGMENTS.map((seg, i) => {
                    const startAngle = i * SEGMENT_ANGLE - 90;
                    const endAngle = startAngle + SEGMENT_ANGLE;
                    const path = describeWedge(RADIUS, RADIUS, RADIUS - 4, startAngle, endAngle);
                    const labelAngle = (startAngle + endAngle) / 2;
                    const labelRad = (labelAngle * Math.PI) / 180;
                    const labelR = RADIUS * 0.6;
                    const lx = RADIUS + Math.cos(labelRad) * labelR;
                    const ly = RADIUS + Math.sin(labelRad) * labelR;
                    return (
                      <G key={i}>
                        <Path d={path} fill={seg.color} stroke="#FFFFFF" strokeWidth={2} />
                        <SvgText
                          x={lx}
                          y={ly}
                          fontSize={14}
                          fontWeight="bold"
                          fill={Colors.ink[900]}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {seg.emoji} {seg.label}
                        </SvgText>
                      </G>
                    );
                  })}
                  <Circle
                    cx={RADIUS}
                    cy={RADIUS}
                    r={28}
                    fill={Colors.ink[900]}
                    stroke={Colors.saffron[500]}
                    strokeWidth={3}
                  />
                  <SvgText
                    x={RADIUS}
                    y={RADIUS + 5}
                    fontSize={20}
                    fill={Colors.saffron[500]}
                    textAnchor="middle"
                  >
                    🪙
                  </SvgText>
                </G>
              </Svg>
            </Animated.View>
          </View>
        </FadeInUp>

        {/* ─── Spin CTA ──────────────────────────────── */}
        <FadeInUp delay={160} style={styles.ctaWrap}>
          <Button
            label={
              isSpinning
                ? 'Spinning…'
                : spinsRemaining === 0
                  ? 'Aaj ke spin khatam'
                  : 'Spin Now!'
            }
            onPress={handleSpin}
            loading={isSpinning}
            disabled={spinsRemaining === 0 || profileQ.isLoading}
            size="hero"
            fullWidth
            hapticPattern="revealMoney"
          />
          <Text style={styles.disclaimer}>
            3 spin per din · Reset hota hai 12 baje raat
          </Text>
        </FadeInUp>
      </View>

      {/* ─── Result Modal ──────────────────────────── */}
      <Modal
        visible={!!resultModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseResult}
      >
        <Pressable style={styles.backdrop} onPress={handleCloseResult}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Pressable
              style={styles.modalClose}
              onPress={handleCloseResult}
              hitSlop={8}
            >
              <X color={Colors.ink[400]} size={20} strokeWidth={2.2} />
            </Pressable>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>Mubarak ho!</Text>
            <Text style={styles.modalPrize}>
              {resultModal?.prize.prizeNameHindi || resultModal?.prize.prizeName}
            </Text>
            {resultModal?.pointsAwarded ? (
              <View style={styles.modalCoinsBadge}>
                <Text style={styles.modalCoinsText}>
                  +{resultModal.pointsAwarded} 🪙
                </Text>
              </View>
            ) : null}
            <Text style={styles.modalRemaining}>
              {resultModal?.spinsRemaining ?? 0} spin baki aaj
            </Text>
            <Button
              label="Great!"
              onPress={handleCloseResult}
              size="lg"
              fullWidth
              style={{ marginTop: Spacing.lg }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── SVG helpers ─────────────────────────────────────────
function describeWedge(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngleDeg);
  const end = polarToCartesian(cx, cy, r, startAngleDeg);
  const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? '0' : '1';
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: 2,
  },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  tagline: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    marginBottom: Spacing['2xl'],
    textAlign: 'center',
  },

  // Wheel
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE + 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pointer: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.ink[900],
    zIndex: 10,
  },

  // CTA
  ctaWrap: {
    width: '100%',
    marginTop: Spacing['2xl'],
    alignItems: 'center',
  },
  disclaimer: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: Spacing.md,
    textAlign: 'center',
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadow.lg,
  },
  modalClose: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: { fontSize: 64, marginBottom: Spacing.md },
  modalTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  modalPrize: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.label,
    color: Colors.ink[700],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  modalCoinsBadge: {
    backgroundColor: Colors.saffron[50],
    borderWidth: 1.5,
    borderColor: Colors.saffron[500],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalCoinsText: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.heavy,
    color: Colors.saffron[600],
  },
  modalRemaining: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.ink[400],
    marginTop: Spacing.md,
  },
});
