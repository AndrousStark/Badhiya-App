/**
 * /admin/login — Admin email+password login.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Shield } from 'lucide-react-native';

import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '@/theme';
import { FadeInUp } from '@/components/animations';
import { Button } from '@/components/ui';
import { useAdminLogin } from '@/features/admin/hooks';

export default function AdminLoginScreen() {
  const loginMut = useAdminLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Email aur password daalo');
      return;
    }
    try {
      await loginMut.mutateAsync({
        email: email.trim(),
        password,
      });
      router.replace('/admin');
    } catch (err) {
      Alert.alert('Login failed', (err as Error).message);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <FadeInUp delay={0}>
          <View style={styles.hero}>
            <View style={styles.icon}>
              <Shield color={Colors.saffron[500]} size={40} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>Badhiya Super Admin Login</Text>
          </View>
        </FadeInUp>

        <FadeInUp delay={60}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="admin@badhiya.app"
            placeholderTextColor={Colors.ink[300]}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Min 8 characters"
            placeholderTextColor={Colors.ink[300]}
            style={styles.input}
            secureTextEntry
          />

          <Button
            label="Login"
            onPress={handleLogin}
            loading={loginMut.isPending}
            size="hero"
            fullWidth
            style={{ marginTop: Spacing.xl }}
          />
        </FadeInUp>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, justifyContent: 'center', padding: Spacing['2xl'] },
  hero: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  icon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.saffron[50], alignItems: 'center',
    justifyContent: 'center', marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: FontFamily.heading, fontSize: FontSize.h1,
    fontWeight: FontWeight.bold, color: Colors.ink[900],
  },
  subtitle: {
    fontFamily: FontFamily.body, fontSize: FontSize.caption,
    color: Colors.ink[400], marginTop: Spacing.xs,
  },
  label: {
    fontFamily: FontFamily.bodyBold, fontSize: FontSize.micro,
    fontWeight: FontWeight.bold, color: Colors.ink[500],
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.lg, marginBottom: Spacing.xs,
  },
  input: {
    fontFamily: FontFamily.body, fontSize: FontSize.body,
    color: Colors.ink[900], backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
});
