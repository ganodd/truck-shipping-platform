/**
 * Currency utilities — all monetary values stored in cents (integer).
 * Display conversions only happen at the UI layer.
 */

/**
 * Convert cents to dollars, e.g. 15050 -> 150.50
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents, e.g. 150.50 -> 15050
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Format cents as a dollar string with commas, e.g. 15050 -> "$150.50"
 */
export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centsToDollars(cents));
}

/**
 * Format a dollars value with commas, e.g. 150.5 -> "$150.50"
 */
export function formatDollars(dollars: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Parse a user-entered dollar string to cents.
 * Strips $, commas, and whitespace. Returns null if invalid.
 * e.g. "$1,500.00" -> 150000
 */
export function parseToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  const value = parseFloat(cleaned);
  if (isNaN(value) || value < 0) return null;
  return dollarsToCents(value);
}
