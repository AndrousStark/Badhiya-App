/**
 * Global error boundary — last line of defense in production.
 *
 * Wraps the navigator at the root layout. When a render-time
 * exception escapes a screen, the boundary:
 *   1. Reports the error + React component stack to Sentry
 *   2. Shows a warm Hindi-first recovery screen with a "try again"
 *      action that resets the boundary
 *   3. Offers a "back to home" fallback that forces a navigation
 *      reset in case the reset alone can't recover
 *
 * Async errors (network, promise rejection) are out of scope — those
 * should still be handled by the calling code with try/catch + the
 * query client's error callbacks.
 */

import { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { AlertCircle, RotateCw, Home } from 'lucide-react-native';
import { router } from 'expo-router';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@/theme';
import { captureError } from '@/lib/observability';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: { componentStack?: string | null } | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(
    error: Error,
    info: { componentStack?: string | null },
  ) {
    this.setState({ errorInfo: info });
    captureError(error, {
      componentStack: info.componentStack ?? null,
      source: 'ErrorBoundary',
    });
  }

  reset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  goHome = () => {
    this.reset();
    // Force a full tree replace — recovering just the boundary isn't
    // enough if the error came from a persistent store/layout.
    try {
      router.replace('/');
    } catch {
      /* router may not be mounted yet — state reset above is enough */
    }
  };

  override render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error.message || 'Unknown error';

    return (
      <View style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.iconWrap}>
            <AlertCircle color={Colors.loss[500]} size={64} strokeWidth={1.6} />
          </View>

          <Text style={styles.title}>Kuch gadbad ho gayi</Text>
          <Text style={styles.subtitle}>
            Badhiya mein ek problem aayi. Aapka data safe hai — neeche
            "dobara try karo" dabao ya ghar wapas jao.
          </Text>

          {__DEV__ ? (
            <View style={styles.devCard}>
              <Text style={styles.devLabel}>DEV — error message</Text>
              <Text style={styles.devMessage}>{message}</Text>
              {this.state.errorInfo?.componentStack ? (
                <Text style={styles.devStack} numberOfLines={10}>
                  {this.state.errorInfo.componentStack}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            onPress={this.reset}
            style={({ pressed }) => [
              styles.btnPrimary,
              pressed && styles.btnPrimaryPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Dobara try karo"
            testID="error-boundary-retry"
          >
            <RotateCw color={Colors.white} size={18} strokeWidth={2.6} />
            <Text style={styles.btnPrimaryText}>Dobara try karo</Text>
          </Pressable>

          <Pressable
            onPress={this.goHome}
            style={({ pressed }) => [
              styles.btnSecondary,
              pressed && styles.btnSecondaryPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ghar wapas jao"
            testID="error-boundary-home"
          >
            <Home color={Colors.saffron[600]} size={18} strokeWidth={2.4} />
            <Text style={styles.btnSecondaryText}>Ghar wapas jao</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    padding: Spacing['2xl'],
    paddingTop: Spacing['5xl'],
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.caption,
    color: Colors.ink[500],
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing['2xl'],
    lineHeight: 22,
  },
  devCard: {
    backgroundColor: Colors.loss[50],
    borderWidth: 1,
    borderColor: Colors.loss[500],
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  devLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.loss[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  devMessage: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.ink[900],
  },
  devStack: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: Colors.ink[500],
    marginTop: Spacing.sm,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.saffron[500],
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    ...Shadow.saffronGlow,
  },
  btnPrimaryPressed: { backgroundColor: Colors.saffron[600] },
  btnPrimaryText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.saffron[500],
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  btnSecondaryPressed: { backgroundColor: Colors.saffron[50] },
  btnSecondaryText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.saffron[600],
  },
});
