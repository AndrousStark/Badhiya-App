/**
 * AddTeamMemberSheet — bottom sheet to add a new team member.
 *
 * Fields: name, phone, role (manager/staff/accountant), salary type,
 * base salary. Wires to useAddMember() mutation.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { X, UserPlus } from 'lucide-react-native';
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
import { Button, Chip } from '@/components/ui';
import { useAddMember } from '@/features/team/hooks';
import type { MemberRole, SalaryType } from '@/features/team/schemas';

export interface AddTeamMemberProps {
  visible: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: Array<{ value: MemberRole; label: string }> = [
  { value: 'staff', label: 'Staff · Karmchari' },
  { value: 'manager', label: 'Manager' },
  { value: 'accountant', label: 'Munim · Accountant' },
];

const SALARY_OPTIONS: Array<{ value: SalaryType; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'daily', label: 'Daily' },
  { value: 'hourly', label: 'Hourly' },
];

export function AddTeamMemberSheet({ visible, onClose }: AddTeamMemberProps) {
  const addMut = useAddMember();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<MemberRole>('staff');
  const [salaryType, setSalaryType] = useState<SalaryType>('monthly');
  const [baseSalary, setBaseSalary] = useState('');

  function reset() {
    setName('');
    setPhone('');
    setRole('staff');
    setSalaryType('monthly');
    setBaseSalary('');
  }

  async function handleSubmit() {
    if (name.trim().length < 2) {
      Alert.alert('Name chahiye', 'Kam se kam 2 character daalo');
      return;
    }
    haptic('tap');
    try {
      await addMut.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || undefined,
        role: role as 'manager' | 'staff' | 'accountant',
        salaryType,
        baseSalary: baseSalary ? parseFloat(baseSalary) : undefined,
      });
      reset();
      onClose();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  }

  function handleClose() {
    haptic('tap');
    reset();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPress} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <UserPlus color={Colors.saffron[500]} size={22} strokeWidth={2.4} />
            <Text style={styles.headerTitle}>Naya member add karo</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X color={Colors.ink[400]} size={22} strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.label}>Naam *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Raju, Priya…"
              placeholderTextColor={Colors.ink[300]}
              style={styles.input}
              autoCapitalize="words"
            />

            {/* Phone */}
            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="9876543210"
              placeholderTextColor={Colors.ink[300]}
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={10}
            />

            {/* Role */}
            <Text style={styles.label}>Role</Text>
            <View style={styles.chipRow}>
              {ROLE_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  active={role === opt.value}
                  onPress={() => {
                    haptic('tap');
                    setRole(opt.value);
                  }}
                />
              ))}
            </View>

            {/* Salary type */}
            <Text style={styles.label}>Salary type</Text>
            <View style={styles.chipRow}>
              {SALARY_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  active={salaryType === opt.value}
                  onPress={() => {
                    haptic('tap');
                    setSalaryType(opt.value);
                  }}
                />
              ))}
            </View>

            {/* Base salary */}
            <Text style={styles.label}>Base salary (₹)</Text>
            <TextInput
              value={baseSalary}
              onChangeText={setBaseSalary}
              placeholder={
                salaryType === 'monthly'
                  ? '15000'
                  : salaryType === 'daily'
                    ? '500'
                    : '100'
              }
              placeholderTextColor={Colors.ink[300]}
              style={styles.input}
              keyboardType="numeric"
            />

            <Button
              label="Add Member"
              onPress={handleSubmit}
              loading={addMut.isPending}
              size="lg"
              fullWidth
              style={{ marginTop: Spacing.xl }}
            />

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  backdropPress: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    maxHeight: '85%',
    ...Shadow.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.ink[900],
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.ink[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  input: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.ink[900],
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
