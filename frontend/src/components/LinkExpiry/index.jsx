// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useEffect, useRef } from 'preact/hooks';
import S from './LinkExpiry.module.scss';
import Sparkle from '@/assets/decor2.svg?react';
import { t } from '@/i18n';

const DAY_NAMES = [
  t('linkExpiry.daySun'),
  t('linkExpiry.dayMon'),
  t('linkExpiry.dayTue'),
  t('linkExpiry.dayWed'),
  t('linkExpiry.dayThu'),
  t('linkExpiry.dayFri'),
  t('linkExpiry.daySat')
];

/**
 * Format a Date as "DD.MM.YY".
 * @param {Date} date - The date to format.
 * @returns {string} Formatted date string.
 */
function formatDate (date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

/**
 * Format a Date as "HH:MM".
 * @param {Date} date - The date to format.
 * @returns {string} Formatted time string.
 */
function formatTime (date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Compute the remaining percentage of time based on total lifespan.
 * @param {number} expiresMs - Expiry timestamp in ms.
 * @param {number} totalDuration - Total lifespan in ms (validUntil - createdAt).
 * @returns {number} Percentage from 0 to 100.
 */
function computePercent (expiresMs, totalDuration) {
  const remaining = expiresMs - Date.now();

  if (totalDuration <= 0 || remaining <= 0) {
    return 0;
  }

  return Math.min(100, (remaining / totalDuration) * 100);
}

/**
 * Link expiry indicator with date display and live countdown progress bar,
 * or a single-use access notice.
 * @param {Object} props - Component props.
 * @param {boolean} [props.singleUse] - Whether the link is single-use.
 * @param {string} [props.createdAt] - ISO date string when the link was created.
 * @param {string} [props.validUntil] - ISO date string when the link expires.
 * @param {string} [props.className] - Additional CSS class for the root element.
 * @returns {import('preact').JSX.Element} The link expiry display.
 */
export default function LinkExpiry ({ singleUse, createdAt, validUntil, className }) {
  if (singleUse) {
    return (
      <div className={`${S.linkExpiry}${className ? ` ${className}` : ''}`}>
        <Sparkle className={S.linkExpirySparkle} />
        <div className={`${S.linkExpiryInfo} ${S.linkExpirySingleUse}`}>
          <span className={S.linkExpiryTitle}>{t('linkExpiry.oneTimeAccess')}</span>
          <span className={S.linkExpirySubtitle}>{t('linkExpiry.oneTimeAccessDesc')}</span>
        </div>
      </div>
    );
  }

  const expiresDate = new Date(validUntil);
  const expiresMs = expiresDate.getTime();
  const createdMs = new Date(createdAt).getTime();

  /** @type {{ current: number }} Total lifespan of the link (validUntil - createdAt). */
  const totalRef = useRef(expiresMs - createdMs);

  const [percent, setPercent] = useState(() => computePercent(expiresMs, totalRef.current));

  useEffect(() => {
    const id = setInterval(() => {
      const next = computePercent(expiresMs, totalRef.current);
      setPercent(next);

      if (next <= 0) {
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [expiresMs]);

  return (
    <div className={`${S.linkExpiry}${className ? ` ${className}` : ''}`}>
      <div className={S.linkExpiryInfo}>
        <span className={S.linkExpiryLabel}>{t('linkExpiry.willExpire')}</span>
        <div className={S.linkExpiryDateRow}>
          <span>{DAY_NAMES[expiresDate.getDay()]}</span>
          <span className={S.linkExpiryDivider} />
          <span>{formatDate(expiresDate)}</span>
          <span className={S.linkExpiryDivider} />
          <span>{formatTime(expiresDate)}</span>
        </div>
      </div>

      <div className={S.linkExpiryTrack}>
        <div
          className={S.linkExpiryFill}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
