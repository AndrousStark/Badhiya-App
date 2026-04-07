/**
 * WhatsApp deep link helper.
 *
 * The killer feature for kirana shopkeepers: tap a customer in Khata,
 * tap "WhatsApp pe yaad dilao", and the customer's WhatsApp opens
 * with a polite Hindi reminder pre-filled. They tap send. Done.
 *
 * Uses wa.me URL format which works on iOS, Android, and desktop:
 *   https://wa.me/<countrycode><number>?text=<urlencoded>
 *
 * Phone numbers must be E.164 without the '+' sign:
 *   "+919319788556" → "919319788556"
 *   "9319788556"    → "919319788556"  (auto-prefixed)
 */

import { Linking, Alert } from 'react-native';
import { auth$ } from '@/stores/auth';

export interface ReminderTemplate {
  customerName: string;
  shopName: string;
  amount: number;
  daysOverdue?: number;
  upiId?: string;
}

/**
 * Build a wa.me URL with an URL-encoded message.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanedPhone = normalizePhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhone}?text=${encoded}`;
}

/**
 * Normalize a phone number to E.164 without the '+'.
 *   "+919319788556" → "919319788556"
 *   "9319788556"    → "919319788556"
 *   "919319788556"  → "919319788556"
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 13 && digits.startsWith('091')) return digits.slice(1);
  return digits;
}

/**
 * Polite, warm Hindi/Hinglish reminder template.
 *
 * Designed to feel like a friendly nudge from a known shopkeeper,
 * not a debt collector. Uses customer's name + shop name + amount,
 * and offers a UPI payment shortcut if configured.
 */
export function buildReminderMessage(t: ReminderTemplate): string {
  const lines: string[] = [];

  lines.push(`Namaste ${t.customerName} ji 🙏`);
  lines.push('');
  lines.push(
    `${t.shopName} mein aapka ₹${t.amount.toLocaleString('en-IN')} ka udhaar pending hai.`,
  );

  if (t.daysOverdue && t.daysOverdue > 60) {
    lines.push(`(${t.daysOverdue} din se)`);
  }

  lines.push('');
  lines.push('Convenient ho to pay kar dijiye, dhanyawad! 🙏');

  if (t.upiId) {
    lines.push('');
    lines.push(`UPI: ${t.upiId}`);
  }

  return lines.join('\n');
}

/**
 * Open WhatsApp with a pre-filled reminder. Falls back to an alert
 * if WhatsApp isn't installed (rare in India — 500M+ users).
 *
 * Returns `true` if WhatsApp opened, `false` otherwise.
 */
export async function openWhatsAppReminder(
  phone: string | null | undefined,
  customerName: string,
  amount: number,
  daysOverdue?: number,
): Promise<boolean> {
  if (!phone) {
    Alert.alert(
      'Phone number missing',
      `${customerName} ka phone number nahi hai. Pehle add karein.`,
    );
    return false;
  }

  const shopName = auth$.businessName.get() ?? 'Sharma General Store';
  const message = buildReminderMessage({
    customerName,
    shopName,
    amount,
    daysOverdue,
  });
  const url = buildWhatsAppUrl(phone, message);

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(
        'WhatsApp nahi mila',
        'Phone par WhatsApp install nahi hai.',
      );
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch (err) {
    Alert.alert('Error', `WhatsApp open nahi hua: ${(err as Error).message}`);
    return false;
  }
}
