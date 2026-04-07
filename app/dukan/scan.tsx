/**
 * Barcode scan screen — full-screen camera with overlay.
 *
 * Phase 6 uses expo-camera (already installed) for native barcode
 * scanning. Phase 6.5 will swap to react-native-vision-camera +
 * @react-native-ml-kit for receipt OCR + multi-code in the same frame.
 *
 * Flow:
 *   1. User opens this screen via router.push('/dukan/scan')
 *   2. Camera permission requested on mount
 *   3. CameraView with barcode scanner active (EAN-13, UPC, Code 128, QR)
 *   4. On detect: success haptic, navigate back with ?barcode=XXXX
 *   5. Dukan tab reads the param on focus and opens AddProductSheet
 *
 * Manual entry fallback at the bottom for damaged/missing barcodes.
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  ArrowLeft,
  Zap,
  ZapOff,
  Keyboard,
  ScanLine,
} from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  TouchTarget,
  Shadow,
} from '@/theme';
import { haptic } from '@/lib/haptics';

const SCAN_AREA_SIZE = 240;

export default function BarcodeScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const scanned = useRef(false);

  function handleBarcode(data: string) {
    if (scanned.current) return;
    if (!data || data.length < 6) return;
    scanned.current = true;
    haptic('confirm');
    // Navigate back to Dukan tab with the barcode as a query param.
    // Dukan reads this on focus and opens AddProductSheet pre-filled.
    router.replace({
      pathname: '/(tabs)/dukan',
      params: { barcode: data },
    });
  }

  function handleManual() {
    haptic('tap');
    router.replace({ pathname: '/(tabs)/dukan', params: { manualAdd: '1' } });
  }

  // ─── Permission states ──────────────────────────
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { position: 'absolute', top: 16, left: 16 }]}
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.permissionInner}>
          <View style={styles.permissionIcon}>
            <ScanLine
              color={Colors.saffron[500]}
              size={64}
              strokeWidth={1.8}
            />
          </View>
          <Text style={styles.permissionTitle}>Camera access chahiye</Text>
          <Text style={styles.permissionBody}>
            Barcode scan karne ke liye Badhiya ko camera ki permission do.
            Yeh sirf saamaan add karne ke liye use hota hai.
          </Text>
          <Pressable
            onPress={() => {
              haptic('tap');
              requestPermission();
            }}
            style={({ pressed }) => [
              styles.permissionBtn,
              pressed && styles.permissionBtnPressed,
            ]}
          >
            <Text style={styles.permissionBtnText}>Permission do</Text>
          </Pressable>
          <Pressable onPress={handleManual} style={styles.manualLink}>
            <Text style={styles.manualLinkText}>
              Skip · Manually add karunga
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'qr',
            'pdf417',
          ],
        }}
        onBarcodeScanned={({ data }) => handleBarcode(data)}
      />

      {/* ─── Dimmed backdrop with cutout ─────────────── */}
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.overlayDim} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlayDim} />
          <View style={styles.scanArea}>
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />
            <View style={styles.scanLine} />
          </View>
          <View style={styles.overlayDim} />
        </View>
        <View style={styles.overlayDimBottom}>
          <Text style={styles.overlayHint}>
            Barcode ko square ke andar laao
          </Text>
        </View>
      </View>

      {/* ─── Header ──────────────────────────────────── */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          accessibilityLabel="Back"
        >
          <ArrowLeft color={Colors.white} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>Barcode scan karo</Text>
        <Pressable
          onPress={() => {
            haptic('select');
            setTorchOn((t) => !t);
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          accessibilityLabel={torchOn ? 'Turn torch off' : 'Turn torch on'}
        >
          {torchOn ? (
            <ZapOff color={Colors.saffron[400]} size={22} strokeWidth={2.2} />
          ) : (
            <Zap color={Colors.white} size={22} strokeWidth={2.2} />
          )}
        </Pressable>
      </SafeAreaView>

      {/* ─── Bottom action bar ───────────────────────── */}
      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <Pressable
          onPress={handleManual}
          style={({ pressed }) => [
            styles.manualBtn,
            pressed && styles.manualBtnPressed,
          ]}
          accessibilityLabel="Skip and add manually"
        >
          <Keyboard color={Colors.white} size={20} strokeWidth={2.4} />
          <Text style={styles.manualBtnText}>Manually enter karunga</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

// ─── Corner accent ──────────────────────────────────────
function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base: any = {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.saffron[500],
  };
  switch (pos) {
    case 'tl':
      return <View style={[base, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 }]} />;
    case 'tr':
      return <View style={[base, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 }]} />;
    case 'bl':
      return <View style={[base, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 }]} />;
    case 'br':
      return <View style={[base, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 }]} />;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },

  // Permission state
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[500],
  },
  permissionInner: {
    padding: Spacing['3xl'],
    alignItems: 'center',
    maxWidth: 360,
  },
  permissionIcon: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.saffron[50],
    borderRadius: Radius['3xl'],
  },
  permissionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  permissionBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
  },
  permissionBtn: {
    backgroundColor: Colors.saffron[500],
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
    minHeight: TouchTarget.heroCTA,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.saffronGlow,
  },
  permissionBtnPressed: { backgroundColor: Colors.saffron[600] },
  permissionBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  manualLink: {
    marginTop: Spacing.xl,
    padding: Spacing.sm,
  },
  manualLinkText: {
    fontFamily: FontFamily.bodySemibold,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    textDecorationLine: 'underline',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlayDimBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '50%',
    height: 2,
    backgroundColor: Colors.saffron[500],
    opacity: 0.85,
  },
  overlayHint: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.white,
    textAlign: 'center',
    fontWeight: FontWeight.bold,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  headerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: 'rgba(0,0,0,0.75)' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'android' ? Spacing.xl : Spacing.sm,
    alignItems: 'center',
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    minHeight: TouchTarget.badhiya,
  },
  manualBtnPressed: { backgroundColor: 'rgba(255,255,255,0.25)' },
  manualBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
