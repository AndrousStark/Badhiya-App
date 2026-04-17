/**
 * OtpInput — 6-box OTP entry with auto-advance and paste support.
 *
 * - Large touch targets (52dp boxes)
 * - Auto-advances on type, goes back on Backspace
 * - Handles paste: any input > 1 char fills all boxes at once
 * - Calls onComplete when all 6 digits are filled
 */

import { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Platform,
} from 'react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '@/theme';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
  testID?: string;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  error = false,
  autoFocus = true,
  testID,
}: Props) {
  const refs = useRef<(TextInput | null)[]>([]);

  const digits: string[] = [];
  for (let i = 0; i < length; i++) {
    digits[i] = value[i] ?? '';
  }

  function handleChange(index: number, text: string) {
    const cleaned = text.replace(/\D/g, '');

    // Paste / autofill: multi-character input. Distribute across boxes.
    if (cleaned.length > 1) {
      const next = cleaned.slice(0, length);
      onChange(next);
      if (next.length === length) {
        refs.current[length - 1]?.blur();
        onComplete?.(next);
      } else {
        refs.current[next.length]?.focus();
      }
      return;
    }

    // Single digit entry
    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    const joined = nextDigits.join('');
    onChange(joined);

    if (cleaned && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
    if (cleaned && index === length - 1 && joined.length === length) {
      refs.current[index]?.blur();
      onComplete?.(joined);
    }
  }

  function handleKeyPress(
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      const nextDigits = [...digits];
      nextDigits[index - 1] = '';
      onChange(nextDigits.join(''));
    }
  }

  return (
    <View style={styles.row} testID={testID}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(r) => {
            refs.current[i] = r;
          }}
          value={d}
          onChangeText={(t) => handleChange(i, t)}
          onKeyPress={(e) => handleKeyPress(i, e)}
          keyboardType="number-pad"
          maxLength={Platform.OS === 'android' ? 6 : 1}
          returnKeyType={i === length - 1 ? 'done' : 'next'}
          autoFocus={autoFocus && i === 0}
          selectTextOnFocus
          textContentType={i === 0 ? 'oneTimeCode' : 'none'}
          autoComplete={i === 0 ? 'sms-otp' : 'off'}
          style={[
            styles.box,
            d ? styles.boxFilled : null,
            error ? styles.boxError : null,
          ]}
          accessibilityLabel={`OTP digit ${i + 1}`}
          testID={`otp-digit-${i}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 54,
    maxHeight: 64,
    minHeight: 56,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontFamily: FontFamily.monoBold,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.heavy,
    color: Colors.ink[900],
    padding: 0,
  },
  boxFilled: {
    borderColor: Colors.saffron[500],
    backgroundColor: Colors.saffron[50],
  },
  boxError: {
    borderColor: Colors.loss[500],
    backgroundColor: Colors.loss[50],
  },
});
