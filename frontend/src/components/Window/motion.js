// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Motion tokens read in JavaScript (MOTION.md: durations and curves are the
// motion/* tokens, never literals). Web Animations need numbers, so the
// computed custom properties of :root are parsed here.

/**
 * Parse a CSS time (`480ms`, `0.48s`) into milliseconds.
 * @param {string} value - Computed value of a duration token.
 * @param {number} fallback - Value when the token is missing or invalid.
 * @returns {number} Milliseconds.
 */
export function parseTime (value, fallback) {
  const v = String(value ?? '').trim();
  const n = parseFloat(v);

  if (!Number.isFinite(n)) {
    return fallback;
  }

  return v.endsWith('ms') ? n : v.endsWith('s') ? n * 1000 : n;
}

/**
 * Read a motion token from :root.
 * @param {string} name - Token name without the prefix, e.g. 'duration-layout' or 'easing-standard'.
 * @returns {string} The computed value, empty when missing.
 */
function token (name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--motion-${name}`).trim();
}

/**
 * A duration token in milliseconds.
 * @param {string} name - 'layout', 'expand', 'toggle', ...
 * @param {number} fallback - Value when the token is missing.
 * @returns {number} Milliseconds.
 */
export const motionMs = (name, fallback) => parseTime(token(`duration-${name}`), fallback);

/**
 * An easing token as a CSS timing function.
 * @param {string} name - 'standard', 'out', ...
 * @param {string} fallback - Value when the token is missing.
 * @returns {string} Timing function.
 */
export const motionEasing = (name, fallback) => token(`easing-${name}`) || fallback;
