// src/utils/orderIdGenerator.js

/**
 * Generate display-friendly order ID.
 * Format: KRN-YYYY-XXXX
 * Note: The actual auto-increment is handled in the Order model pre-save hook.
 * This utility is for formatting only.
 */
export function formatOrderId(seq) {
  const year = new Date().getFullYear();
  return `KRN-${year}-${String(seq).padStart(4, '0')}`;
}
