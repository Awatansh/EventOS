/**
 * Format price from paise/cents to readable format.
 * e.g., 50000 → ₹500, 0 → FREE
 */
export function formatCurrency(priceCents: number, currency: string = 'INR'): string {
  if (priceCents === 0) return 'FREE';

  const amount = priceCents / 100;
  const symbol = currency === 'INR' ? '₹' : '$';

  return `${symbol}${amount.toLocaleString('en-IN')}`;
}

/**
 * Calculate total price.
 */
export function calculateTotal(priceCents: number, quantity: number): number {
  return priceCents * quantity;
}
