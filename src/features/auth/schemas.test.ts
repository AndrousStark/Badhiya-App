/**
 * Auth schema tests — locks the exact regex contract with the backend
 * so drift is caught before shipping. The login flow sends these
 * values literally to /auth/otp/send and /auth/otp/verify; a bad
 * regex here silently breaks every new user's first screen.
 */

import {
  phoneRawSchema,
  phoneE164Schema,
  otpSchema,
  toE164,
} from './schemas';

describe('phoneRawSchema', () => {
  it.each([['6234567890'], ['7234567890'], ['8234567890'], ['9876543210']])(
    'accepts %s',
    (phone) => {
      expect(() => phoneRawSchema.parse(phone)).not.toThrow();
    },
  );

  it.each([
    ['1234567890', 'starts with 1'],
    ['5234567890', 'starts with 5'],
    ['0234567890', 'starts with 0'],
    ['987654321', 'only 9 digits'],
    ['98765432109', '11 digits'],
    ['98765abcde', 'non-numeric'],
    ['+919876543210', 'includes prefix'],
    ['', 'empty'],
  ])('rejects %s (%s)', (phone) => {
    expect(() => phoneRawSchema.parse(phone)).toThrow();
  });
});

describe('phoneE164Schema', () => {
  it('accepts a well-formed +91 phone', () => {
    expect(() => phoneE164Schema.parse('+919876543210')).not.toThrow();
  });

  it.each([
    ['9876543210', 'missing prefix'],
    ['+929876543210', 'wrong country code'],
    ['+9198765432', 'too short'],
    ['+919876543210x', 'trailing char'],
  ])('rejects %s (%s)', (phone) => {
    expect(() => phoneE164Schema.parse(phone)).toThrow();
  });
});

describe('otpSchema', () => {
  it('accepts a 6-digit numeric OTP', () => {
    expect(() => otpSchema.parse('123456')).not.toThrow();
    expect(() => otpSchema.parse('000000')).not.toThrow();
  });

  it.each([
    ['12345', '5 digits'],
    ['1234567', '7 digits'],
    ['abcdef', 'letters'],
    ['12 456', 'space inside'],
    ['', 'empty'],
  ])('rejects %s (%s)', (otp) => {
    expect(() => otpSchema.parse(otp)).toThrow();
  });
});

describe('toE164', () => {
  it('prefixes +91 to a 10-digit phone', () => {
    expect(toE164('9876543210')).toBe('+919876543210');
  });

  it('is the identity transform for the regex pair', () => {
    const raw = '7777777777';
    expect(phoneRawSchema.parse(raw)).toBe(raw);
    expect(phoneE164Schema.parse(toE164(raw))).toBe(toE164(raw));
  });
});
