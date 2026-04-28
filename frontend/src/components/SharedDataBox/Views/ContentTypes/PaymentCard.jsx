// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import FieldRow from './FieldRow';
import formatCardNumber from '@/utils/formatCardNumber';
import { t } from '@/i18n';

const CARD_VISIBLE_DIGITS = 4;

/**
 * Masks a formatted card number, keeping the last 4 digits visible and
 * preserving the separator spaces from the formatter.
 * @param {string} formatted - The space-formatted card number.
 * @returns {string|undefined} The masked value, or undefined when input is empty.
 */
function maskCardNumber (formatted) {
  if (!formatted) {
    return undefined;
  }

  const totalDigits = (formatted.match(/\d/g) || []).length;
  const hideCount = Math.max(0, totalDigits - CARD_VISIBLE_DIGITS);
  let digitsSeen = 0;

  return Array.from(formatted)
    .map((char) => {
      if (!/\d/.test(char)) {
        return char;
      }

      digitsSeen += 1;

      return digitsSeen <= hideCount ? '●' : char;
    })
    .join('');
}

/**
 * Payment card content type view - displays card details as field rows.
 * @param {Object} props - Component props.
 * @param {Object} props.content - Payment card data.
 * @param {string} [props.content.name] - Card label / display name.
 * @param {string} [props.content.cardHolder] - Cardholder name.
 * @param {string} [props.content.cardNumber] - Card number.
 * @param {string} [props.content.expirationDate] - Expiration date.
 * @param {string} [props.content.securityCode] - CVV / security code.
 * @param {string} [props.content.notes] - Additional notes.
 * @returns {import('preact').JSX.Element} The payment card content view.
 */
export default function ContentPaymentCard ({ content }) {
  const formattedCardNumber = formatCardNumber(content.cardNumber);
  const maskedCardNumber = maskCardNumber(formattedCardNumber);

  return (
    <>
      <FieldRow label={t('content.name')} value={content.name} />
      <FieldRow label={t('content.cardholder')} value={content.cardHolder} />
      <FieldRow
        label={t('content.cardNumber')}
        value={formattedCardNumber}
        sensitive
        maskedValue={maskedCardNumber}
      />
      <FieldRow label={t('content.expirationDate')} value={content.expirationDate} />
      <FieldRow label={t('content.securityCode')} value={content.securityCode} sensitive />
      <FieldRow label={t('content.notes')} value={content.notes} />
    </>
  );
}
