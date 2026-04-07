/**
 * useCurrency — Indian rupee formatting with lakh/crore suffixes.
 *
 *     ₹1,240          → "₹1,240"
 *     ₹1,24,000       → "₹1.24L"
 *     ₹1,24,00,000    → "₹1.24Cr"
 *
 * Pass `compact=false` to always get full digit grouping.
 */

export function formatRupees(
  amount: number,
  options: { compact?: boolean; showSymbol?: boolean } = {},
): string {
  const { compact = true, showSymbol = true } = options;
  const symbol = showSymbol ? '₹' : '';
  const sign = amount < 0 ? '−' : '';
  const abs = Math.abs(amount);

  if (compact) {
    if (abs >= 10_000_000) {
      return `${sign}${symbol}${(abs / 10_000_000).toFixed(2)}Cr`;
    }
    if (abs >= 100_000) {
      return `${sign}${symbol}${(abs / 100_000).toFixed(2)}L`;
    }
  }

  return `${sign}${symbol}${abs.toLocaleString('en-IN')}`;
}

export function useCurrency() {
  return { format: formatRupees };
}
