// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * The part of a text typed after a given time, one character (code point)
 * at a time, after an initial delay.
 * @param {string} text - Full text.
 * @param {number} elapsed - Time since the start, in ms.
 * @param {number} delay - Time before the first character, in ms.
 * @param {number} perChar - Time per character, in ms.
 * @returns {string} Typed prefix; the full text once done.
 */
export function typedPrefix (text, elapsed, delay, perChar) {
  const chars = Array.from(text);
  const count = Math.max(0, Math.floor((elapsed - delay) / perChar) + 1);

  return elapsed < delay ? '' : chars.slice(0, count).join('');
}
