/**
 * Mobile-side NLU — parse Hindi/Hinglish/English voice text into a
 * structured transaction intent.
 *
 * Strategy: keyword detection + regex extraction. Runs on-device,
 * works offline, ~1ms per call. Falls through to defaults when
 * confidence is low; the UI shows a confirm sheet so the user can
 * fix anything before saving.
 *
 * Examples that should parse correctly:
 *   "becha 5 kg atta 250 rupaye"      → sale, 250, "5 kg atta"
 *   "5 kilo aata becha 250 mein"      → sale, 250, "5 kilo aata"
 *   "bijli bill 4200 diya"            → expense, 4200, "bijli bill"
 *   "ravi se 500 mile"                → payment, 500, customer="Ravi"
 *   "amul butter 23 packet 720 ka"    → sale, 720, "amul butter 23 packet"
 *   "subzi kharcha 150"               → expense, 150, "subzi"
 *   "rent 8000 diya"                  → expense, 8000, "rent"
 *
 * NOT designed to be perfect — designed to land in the ballpark and
 * let the user finalize via the confirm sheet.
 */

import type { TransactionTypeMobile } from './schemas';

export interface ParsedTransaction {
  type: TransactionTypeMobile | null;
  amount: number | null;
  item: string | null;
  customerName: string | null;
  quantity: string | null;
  confidence: number; // 0-1
  raw: string;
  warnings: string[];
}

// ─── Keyword dictionaries ───────────────────────────────
const SALE_KEYWORDS = [
  'becha', 'bechi', 'beche', 'bechta', 'bechti',
  'sold', 'sale', 'sell', 'sells',
  'bik', 'bikra', 'bikri', 'bikraa',
];

const EXPENSE_KEYWORDS = [
  'kharcha', 'kharch', 'kharcha hua', 'kharch hua',
  'diya', 'di ', 'diye', 'gave', 'paid', 'pay',
  'expense', 'spent', 'bill',
  'rent', 'rent diya',
];

const PAYMENT_KEYWORDS = [
  'mile', 'mila', 'milgaye', 'milay', 'milgaya',
  'received', 'collect', 'collected',
  'payment', 'paise mil', 'paisa mil',
  'paid up', 'wapas mile', 'wapas mila',
];

// Words to strip when extracting the item description
const STOP_WORDS = [
  'ka', 'ke', 'ki', 'ko', 'me', 'mein', 'se', 'liye',
  'par', 'pe', 'aur', 'ya', 'is', 'ye', 'wo',
  'ho', 'gaya', 'gayi', 'gaye', 'kar', 'liya', 'ji',
  'aaj', 'kal', 'abhi', 'pehle',
];

const CURRENCY_WORDS = [
  'rupaye', 'rupay', 'rs', 'rupees', 'rupee', 'inr', '₹', '/-',
];

// ─── Helpers ─────────────────────────────────────────────
function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildKeywordRegex(words: string[]): RegExp {
  const escaped = words.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

/**
 * Word-bounded containment check. Prevents "pay" from falsely matching
 * inside "rupaye" and similar substring collisions across our keyword
 * lists.
 */
function containsKeyword(text: string, words: string[]): boolean {
  return buildKeywordRegex(words).test(text);
}

const allTypeKeywordsRegex = buildKeywordRegex([
  ...SALE_KEYWORDS,
  ...EXPENSE_KEYWORDS,
  ...PAYMENT_KEYWORDS,
]);

const stopAndCurrencyRegex = buildKeywordRegex([
  ...STOP_WORDS,
  ...CURRENCY_WORDS,
]);

// ─── Main parser ─────────────────────────────────────────
export function parseTransaction(text: string): ParsedTransaction {
  const raw = text.trim();
  const warnings: string[] = [];

  if (!raw) {
    return {
      type: null,
      amount: null,
      item: null,
      customerName: null,
      quantity: null,
      confidence: 0,
      raw,
      warnings: ['Empty input'],
    };
  }

  // Normalize Devanagari digits to ASCII for amount extraction.
  const normalized = raw
    .toLowerCase()
    .replace(/[०१२३४५६७८९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)));

  // ─── Type detection ──────────────────────────────────
  let type: TransactionTypeMobile | null = null;
  let typeScore = 0;

  // Order matters: payment is the most specific (look for "X mile" / "received")
  //
  // We match keywords on **word boundaries** rather than plain substring,
  // otherwise short tokens like "pay" in EXPENSE_KEYWORDS false-match
  // inside words like "rupaye" and misroute a sale ("becha ... rupaye")
  // to expense.
  if (containsKeyword(normalized, PAYMENT_KEYWORDS)) {
    type = 'payment';
    typeScore = 0.85;
  } else if (containsKeyword(normalized, EXPENSE_KEYWORDS)) {
    type = 'expense';
    typeScore = 0.85;
  } else if (containsKeyword(normalized, SALE_KEYWORDS)) {
    type = 'sale';
    typeScore = 0.9;
  } else {
    // No keyword — guess sale (most common) at low confidence
    type = 'sale';
    typeScore = 0.35;
    warnings.push('No type keyword detected — assuming sale');
  }

  // ─── Amount extraction ───────────────────────────────
  // Take the LARGEST number in the string (heuristic — handles "5 kg atta 250"
  // where 5 is quantity and 250 is the amount).
  const numberMatches = [...normalized.matchAll(/(\d+(?:\.\d+)?)/g)];
  let amount: number | null = null;
  let quantity: string | null = null;

  if (numberMatches.length > 0) {
    const numbers = numberMatches.map((m) => parseFloat(m[1]!));
    amount = Math.max(...numbers);

    // If there's a smaller number followed by a unit word, treat it as quantity
    if (numbers.length > 1) {
      const min = Math.min(...numbers);
      const unitMatch = normalized.match(
        /(\d+(?:\.\d+)?)\s*(kg|kilo|gram|gm|litre|liter|ml|packet|piece|pcs|dozen|nos)/i,
      );
      if (unitMatch && parseFloat(unitMatch[1]!) === min) {
        quantity = `${unitMatch[1]} ${unitMatch[2]}`;
      }
    }
  }

  if (amount === null) {
    warnings.push('No amount detected');
  }

  // ─── Customer name extraction ────────────────────────
  // Patterns: "ravi se 500 mile" / "ravi ko 500 diya"
  let customerName: string | null = null;
  const custMatch = normalized.match(/^(\w+)\s+(?:se|ko)\s+/i);
  if (custMatch && custMatch[1] && custMatch[1].length > 1) {
    customerName = capitalize(custMatch[1]);
  }

  // ─── Item extraction (everything else) ───────────────
  let item = normalized;
  // Strip the customer name prefix if found
  if (customerName) {
    item = item.replace(/^\w+\s+(?:se|ko)\s+/i, '');
  }
  // Strip type keywords
  item = item.replace(allTypeKeywordsRegex, ' ');
  // Strip numbers (after we've extracted them)
  item = item.replace(/\d+(?:\.\d+)?/g, ' ');
  // Strip currency + stop words
  item = item.replace(stopAndCurrencyRegex, ' ');
  // Collapse whitespace
  item = item.replace(/\s+/g, ' ').trim();

  if (!item) item = '';

  // ─── Confidence ──────────────────────────────────────
  let confidence = typeScore;
  if (amount !== null) confidence += 0.1;
  if (item.length > 0) confidence += 0.05;
  confidence = Math.min(1, confidence);

  return {
    type,
    amount,
    item: item || null,
    customerName,
    quantity,
    confidence,
    raw,
    warnings,
  };
}
