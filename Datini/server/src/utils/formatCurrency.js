// src/utils/formatCurrency.js

/**
 * Format a number as Indian Rupee currency.
 * @param {number} amount
 * @returns {string} e.g. "₹1,234.50"
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}
