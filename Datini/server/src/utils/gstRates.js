// src/utils/gstRates.js

// Common HSN code to GST rate mapping (inline data)
const hsnCodes = {
  '1001': { category: 'Grains', gstRate: 0 },
  '1006': { category: 'Grains', gstRate: 0 },
  '0713': { category: 'Pulses', gstRate: 0 },
  '1507': { category: 'Oils', gstRate: 5 },
  '1517': { category: 'Oils', gstRate: 12 },
  '0402': { category: 'Dairy', gstRate: 5 },
  '0406': { category: 'Dairy', gstRate: 12 },
  '0701': { category: 'Vegetables', gstRate: 0 },
  '0805': { category: 'Fruits', gstRate: 0 },
  '1905': { category: 'Snacks', gstRate: 12 },
  '2106': { category: 'Instant', gstRate: 18 },
  '2202': { category: 'Beverages', gstRate: 12 },
  '3402': { category: 'Cleaning', gstRate: 18 },
  '3401': { category: 'Personal Care', gstRate: 18 },
};

/**
 * Get GST rate for an HSN code.
 * @param {string} hsnCode - 4-digit HSN code
 * @returns {number} GST rate percentage (0, 5, 12, 18, 28)
 */
export function getGstRate(hsnCode) {
  const entry = hsnCodes[hsnCode];
  return entry ? entry.gstRate : 12; // Default to 12% if not found
}

/**
 * Calculate GST amount from a total (inclusive).
 * Formula: GST = total * rate / (100 + rate)
 */
export function calculateGstInclusive(total, gstRate) {
  if (!gstRate || gstRate === 0) return 0;
  return Math.round((total * gstRate / (100 + gstRate)) * 100) / 100;
}

/**
 * Calculate GST amount from a base price (exclusive).
 * Formula: GST = base * rate / 100
 */
export function calculateGstExclusive(baseAmount, gstRate) {
  if (!gstRate || gstRate === 0) return 0;
  return Math.round((baseAmount * gstRate / 100) * 100) / 100;
}
