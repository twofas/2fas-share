// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Detects card issuer based on card number prefix.
 * Detection order matches iOS PaymentCardUtilityInteractor.detectCardIssuer
 * and 2fas-pass-browser-extension getCardNumberMask.js.
 * @param {string} digits - Digits-only card number string.
 * @returns {string|null} The card issuer identifier or null.
 */
function detectCardIssuer (digits) {
  if (!digits || digits.length === 0) {
    return null;
  }

  if (digits.startsWith('4')) {
    return 'visa';
  }

  const first2 = parseInt(digits.substring(0, 2), 10);

  if (digits.length >= 2 && first2 >= 51 && first2 <= 55) {
    return 'mastercard';
  }

  const first4 = parseInt(digits.substring(0, 4), 10);

  if (digits.length >= 4 && first4 >= 2221 && first4 <= 2720) {
    return 'mastercard';
  }

  if (digits.startsWith('34') || digits.startsWith('37')) {
    return 'americanExpress';
  }

  if (digits.startsWith('6011') || digits.startsWith('65')) {
    return 'discover';
  }

  const first3 = parseInt(digits.substring(0, 3), 10);

  if (digits.length >= 3 && first3 >= 644 && first3 <= 649) {
    return 'discover';
  }

  const first6 = parseInt(digits.substring(0, 6), 10);

  if (digits.length >= 6 && first6 >= 622126 && first6 <= 622925) {
    return 'discover';
  }

  if (digits.startsWith('36') || digits.startsWith('38') || digits.startsWith('39')) {
    return 'dinersClub';
  }

  if (digits.length >= 3 && first3 >= 300 && first3 <= 305) {
    return 'dinersClub';
  }

  if (digits.length >= 4 && first4 >= 3528 && first4 <= 3589) {
    return 'jcb';
  }

  if (digits.startsWith('62')) {
    return 'unionPay';
  }

  return null;
}

/**
 * Formats a card number string with spaces based on detected card issuer.
 * Amex: 4-6-5, standard 16-digit cards: 4-4-4-4, 19-digit cards: 4-4-4-4-3.
 * @param {string} cardNumber - Raw card number (may contain spaces or dashes).
 * @returns {string} The formatted card number with spaces, or the original value if empty.
 */
export default function formatCardNumber (cardNumber) {
  if (!cardNumber) {
    return cardNumber;
  }

  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length === 0) {
    return cardNumber;
  }

  const issuer = detectCardIssuer(digits);

  if (issuer === 'americanExpress') {
    // 4-6-5 format
    const parts = [
      digits.substring(0, 4),
      digits.substring(4, 10),
      digits.substring(10, 15)
    ].filter(Boolean);

    return parts.join(' ');
  }

  // 4-4-4-4(-3) format for all other cards
  const parts = [];

  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.substring(i, i + 4));
  }

  return parts.join(' ');
}
