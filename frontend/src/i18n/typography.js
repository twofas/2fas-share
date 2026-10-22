// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// A one-letter word ("a", "i", "w", "z", "o") must not end a line. The space
// after it becomes a no-break space when the text is rendered, so the
// translations (edited in Loco) keep ordinary spaces. Explicit line breaks
// (\n, shown by white-space: pre-line) stay as they are.

const SHORT_WORD = /(?<=^|[\s\u00A0(„"«])([\p{L}\p{N}]) (?=\S)/gu;

/**
 * Glue every one-letter word to the word after it.
 * @param {string} str - Text.
 * @returns {string} Text with no-break spaces after one-letter words.
 */
export function bindShortWords (str) {
  return str.replace(SHORT_WORD, '$1\u00A0');
}
