/**
 * GST_RATE — single source of truth for GST across the entire app.
 *
 * Change this one value to update:
 *   - Cart bill breakdown
 *   - Checkout total
 *   - Admin pending orders bill
 *   - Receipt printout
 *
 * 0.025 = 2.5%
 * 0.05  = 5%
 * 0.12  = 12%
 */
export const GST_RATE = 0.025;

/**
 * Calculate GST amount from a base price.
 * Always rounds to nearest rupee.
 */
export function calcGST(basePrice) {
  return Math.round(basePrice * GST_RATE);
}

/**
 * Calculate grand total (base + GST).
 */
export function calcTotal(basePrice) {
  return basePrice + calcGST(basePrice);
}

/**
 * Human-readable GST label e.g. "2.5%"
 */
export const GST_LABEL = `${GST_RATE * 100}%`;