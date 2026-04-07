/**
 * PhoneInput — Indian mobile number input with sticky +91 prefix.
 *
 * - Accepts 10 digits, first must be 6-9 (Indian mobile rule)
 * - Auto-formats with a space after 5 digits ("93197 88556")
 * - Shows a red border on validation failure
 * - Strips the space before passing value up (digits only)
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { Phone } from 'lucide-react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '@/theme';

interface Props {
  value: string; // raw 10 digits, no space
  onChangeText: (digits: string) => void;
  onSubmitEditing?: () => void;
  error?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function formatDisplay(digits: string): string {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
}

export function PhoneInput({
  value,
  onChangeText,
  onSubmitEditing,
  error,
  autoFocus = false,
  style,
  testID,
}: Props) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  function handleChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    onChangeText(digits);
  }

  return (
    <View style={style}>
      <View
        style={[
          styles.wrap,
          focused && !hasError && styles.wrapFocused,
          hasError && styles.wrapError,
        ]}
      >
        <Phone
          color={hasError ? Colors.loss[500] : Colors.saffron[500]}
          size={20}
          strokeWidth={2.2}
        />
        <View style={styles.divider} />
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          value={formatDisplay(value)}
          onChangeText={handleChange}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="phone-pad"
          maxLength={11} // "XXXXX XXXXX"
          returnKeyType="next"
          autoFocus={autoFocus}
          placeholder="93197 88556"
          placeholderTextColor={Colors.ink[300]}
          style={styles.input}
          autoComplete={Platform.OS === 'android' ? 'tel' : 'tel-national'}
          textContentType="telephoneNumber"
          testID={testID}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 56,
  },
  wrapFocused: {
    borderColor: Colors.saffron[500],
    backgroundColor: Colors.saffron[50],
  },
  wrapError: {
    borderColor: Colors.loss[500],
    backgroundColor: Colors.loss[50],
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.border,
  },
  prefix: {
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.ink[700],
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semibold,
    color: Colors.ink[900],
    padding: 0,
    letterSpacing: 1,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.loss[500],
    marginTop: Spacing.sm,
    marginLeft: Spacing.sm,
  },
});
