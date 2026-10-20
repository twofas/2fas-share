// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import Star from '@/assets/star.svg?react';
import { t } from '@/i18n';
import S from './Benefits.module.scss';

const ITEMS = ['welcome.benefit1', 'welcome.benefit2', 'welcome.benefit3'];

/**
 * Three benefits with the star mark (hero and the full generator view).
 * @param {object} props - Component props.
 * @param {string} [props.className] - Extra class for layout.
 * @param {boolean} [props.centered] - Center the items (full generator view).
 * @returns {import('preact').JSX.Element} Benefit list.
 */
export default function Benefits ({ className, centered }) {
  return (
    <ul className={`${S.benefits} ${centered ? S.centered : ''} ${className || ''}`}>
      {ITEMS.map((key, i) => (
        <li key={key} className={S.item} style={{ '--i': i }}>
          <Star className={S.star} aria-hidden='true' />
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
