// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Pure wording helpers of the "Expires in" row (no i18n import, so they run
// under node --test). Plural forms come from Intl.RelativeTimeFormat, which
// applies the CLDR plural rules of the language (EN/PL/DE).

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Remaining time at or under which the link is in its last 5 minutes. */
export const LAST_MINUTES_MS = 5 * MINUTE;

/**
 * Pick the unit and value for the remaining time: minutes up to an hour,
 * hours up to two days, days after that. Never less than 1 minute.
 * @param {number} ms - Remaining time in ms (> 0).
 * @returns {{ value: number, unit: 'minute'|'hour'|'day' }} Value and unit.
 */
export function remainingUnit (ms) {
  const minutes = Math.max(1, Math.ceil(ms / MINUTE));

  if (minutes <= 60) {
    return { value: minutes, unit: 'minute' };
  }

  const hours = Math.round(ms / HOUR);

  if (hours < 48) {
    return { value: hours, unit: 'hour' };
  }

  return { value: Math.round(ms / DAY), unit: 'day' };
}

/**
 * Relative phrase for the remaining time, e.g. "in 56 minutes",
 * "za 56 minut", "in 56 Minuten".
 * @param {number} ms - Remaining time in ms (> 0).
 * @param {string} lang - BCP 47 language.
 * @returns {string} Relative phrase.
 */
export function formatRemaining (ms, lang) {
  const { value, unit } = remainingUnit(ms);
  return new Intl.RelativeTimeFormat(lang, { numeric: 'always' }).format(value, unit);
}

/**
 * Upper-case the first letter (in the given language).
 * @param {string} str - Text.
 * @param {string} lang - BCP 47 language.
 * @returns {string} Text with a capital first letter.
 */
function capitalize (str, lang) {
  return str.charAt(0).toLocaleUpperCase(lang) + str.slice(1);
}

/**
 * Day part of the absolute expiry: "Today", "Tomorrow" (in the language),
 * otherwise the weekday with the date.
 * @param {Date} date - Expiry date.
 * @param {Date} now - Current date.
 * @param {string} lang - BCP 47 language.
 * @returns {string} Day label, capitalised.
 */
export function formatDay (date, now, lang) {
  /**
   * Local midnight of a date.
   * @param {Date} d - Date.
   * @returns {number} Timestamp of the start of that day.
   */
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(date) - startOf(now)) / DAY);

  if (diff === 0 || diff === 1) {
    return capitalize(new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(diff, 'day'), lang);
  }

  return capitalize(
    new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(date),
    lang
  );
}

/**
 * Clock time of the expiry, 24-hour in every language (Figma), e.g. "12:15".
 * @param {Date} date - Expiry date.
 * @param {string} lang - BCP 47 language.
 * @returns {string} Time.
 */
export function formatClock (date, lang) {
  return new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
}

/**
 * Whether the remaining time is within the last 5 minutes (and not over).
 * @param {number} ms - Remaining time in ms.
 * @returns {boolean} True in the last 5 minutes.
 */
export function isLastMinutes (ms) {
  return ms > 0 && ms <= LAST_MINUTES_MS;
}
