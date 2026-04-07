/**
 * /settings/profile — Dukan Profile editing.
 *
 * Reads from auth$ store and allows editing business name, type, city.
 * Uses the existing businesses module to save changes.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Store } from 'lucide-react-native';

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
import { FadeInUp } from '@/components/animations';
import { Button } from '@/components/ui';
import { auth$ } from '@/stores/auth';
import { api } from '@/lib/api';

export default function ProfileScreen() {
  const bId = auth$.businessId.get();
  const [name, setName] = useState(auth$.businessName.get() ?? '');
  const [city, setCity] = useState(auth$.businessCity.get() ?? '');
  const [type, setType] = useState(auth$.businessType.get() ?? '');
  const [phone, setPhone] = useState(auth$.phone.get() ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!bId) return;
    setSaving(true);
    haptic('tap');
    try {
      await api.patch(`/businesses/${bId}`, {
        name: name.trim(),
        city: city.trim(),
        type: type.trim(),
      });
      auth$.businessName.set(name.trim());
      auth$.businessCity.set(city.trim());
      auth$.businessType.set(type.trim());
      Alert.alert('Saved', 'Dukan profile update ho gaya');
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ArrowLeft color={Colors.ink[700]} size={22} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Dukan Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInUp delay={0}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Store color={Colors.white} size={28} strokeWidth={2.2} />
            </View>
            <View>
              <Text style={styles.avatarName}>{name || 'Aapki Dukan'}</Text>
              <Text style={styles.avatarPhone}>+91 {phone}</Text>
            </View>
          </View>
        </FadeInUp>

        <FadeInUp delay={40}>
          <Text style={styles.label}>Dukan ka naam</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Sharma General Store" placeholderTextColor={Colors.ink[300]} />

          <Text style={styles.label}>City / Shehar</Text>
          <TextInput value={city} onChangeText={setCity} style={styles.input} placeholder="Lucknow, Delhi…" placeholderTextColor={Colors.ink[300]} />

          <Text style={styles.label}>Business type</Text>
          <TextInput value={type} onChangeText={setType} style={styles.input} placeholder="Kirana, Medical, Garments…" placeholderTextColor={Colors.ink[300]} />

          <Button label="Save Changes" onPress={handleSave} loading={saving} size="lg" fullWidth style={{ marginTop: Spacing.xl }} />
        </FadeInUp>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backBtnPressed: { backgroundColor: Colors.saffron[50] },
  title: { fontFamily: FontFamily.heading, fontSize: FontSize.h2, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  scroll: { padding: Spacing.xl },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing['2xl'] },
  avatar: { width: 64, height: 64, borderRadius: Radius.xl, backgroundColor: Colors.saffron[500], alignItems: 'center', justifyContent: 'center' },
  avatarName: { fontFamily: FontFamily.heading, fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.ink[900] },
  avatarPhone: { fontFamily: FontFamily.mono, fontSize: FontSize.micro, color: Colors.ink[400], marginTop: 2 },
  label: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.micro, fontWeight: FontWeight.bold, color: Colors.ink[500], textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  input: { fontFamily: FontFamily.body, fontSize: FontSize.body, color: Colors.ink[900], backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
});
