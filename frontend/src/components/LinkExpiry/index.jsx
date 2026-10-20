// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useEffect, useRef, useContext } from 'preact/hooks';
import { InfoRow } from '@/components/SharedDataBox/Parts';
import { AnnounceContext } from '@/components/SharedDataBox/Parts/context';
import TimeIcon from '@/assets/icons/time-line.svg?react';
import { formatRemaining, formatDay, formatClock, isLastMinutes } from './expiryText';
import S from './LinkExpiry.module.scss';
import { t, currentLang } from '@/i18n';

const LAST_MINUTES_ANNOUNCE_MS = 5000;

/**
 * Title of the row for the remaining time.
 * @param {number} remaining - Remaining time in ms.
 * @returns {string} "The link disappears in 56 minutes." or the expired text.
 */
function remainingTitle (remaining) {
  if (remaining <= 0) {
    return t('recipient.expired');
  }

  return t('recipient.expiresIn', { relative: formatRemaining(remaining, currentLang) });
}

/**
 * Expiry row of Recipient / window (the "Expires in" row): a time medallion,
 * "The link disappears in 56 minutes." and "Today at 12:15." with the date
 * in <time datetime>. No aria-live: the row updates silently; one message
 * goes to the page status region when the link enters its last 5 minutes.
 * @param {Object} props - Component props.
 * @param {string} props.validUntil - ISO date string when the link expires.
 * @param {string} [props.className] - Additional CSS class for the root element.
 * @returns {import('preact').JSX.Element} The expiry row.
 */
export default function LinkExpiry ({ validUntil, className }) {
  const expiresDate = new Date(validUntil);
  const expiresMs = expiresDate.getTime();
  const [now, setNow] = useState(() => Date.now());
  const announce = useContext(AnnounceContext);
  const announcedRef = useRef(false);
  const remaining = expiresMs - now;

  useEffect(() => {
    const id = setInterval(() => {
      const next = Date.now();
      setNow(next);

      if (next >= expiresMs) {
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [expiresMs]);

  // One message when the link enters its last 5 minutes.
  useEffect(() => {
    if (!announcedRef.current && isLastMinutes(remaining)) {
      announcedRef.current = true;
      announce(remainingTitle(remaining), LAST_MINUTES_ANNOUNCE_MS);
    }
  }, [remaining, announce]);

  const iso = Number.isNaN(expiresMs) ? undefined : expiresDate.toISOString();

  return (
    <div className={`${S.linkExpiry}${className ? ` ${className}` : ''}`}>
      <InfoRow
        icon={TimeIcon}
        title={remainingTitle(remaining)}
        body={iso && (
          <time dateTime={iso}>
            {t('recipient.expiresAt', {
              day: formatDay(expiresDate, new Date(now), currentLang),
              time: formatClock(expiresDate, currentLang)
            })}
          </time>
        )}
      />
    </div>
  );
}
