// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Size of a note as the server sees it: the Base64 of the AES-GCM ciphertext
// of the JSON payload. The server rejects anything above MAX_DATA_SIZE
// (api: MAX_DATA_SIZE, 16 384 B on production).

/** Server limit of the `data` field, in bytes of Base64. */
export const MAX_DATA_SIZE = 16384;

/** The counter shows from this share of the limit (BEHAVIOR-SPEC §3). */
export const COUNTER_FROM = 0.8;

/** AES-GCM appends a 128-bit authentication tag. */
const GCM_TAG_BYTES = 16;

const encoder = new TextEncoder();

/**
 * Payload encrypted for a note.
 * @param {string} text - Note content.
 * @returns {{contentType: string, contentVersion: number, content: {text: string}}} Payload.
 */
export function noteData (text) {
  return { contentType: 'custom', contentVersion: 1, content: { text } };
}

/**
 * Size of the note as sent to the server.
 * @param {string} text - Note content.
 * @returns {number} Length of the Base64 `data` field, in bytes.
 */
export function encodedSize (text) {
  const bytes = encoder.encode(JSON.stringify(noteData(text))).length + GCM_TAG_BYTES;

  return 4 * Math.ceil(bytes / 3);
}

/**
 * How many characters (code points) to cut from the end so the note fits.
 * @param {string} text - Note content.
 * @param {number} [max] - Limit in bytes of Base64.
 * @returns {number} 0 when the note fits.
 */
export function excessChars (text, max = MAX_DATA_SIZE) {
  if (encodedSize(text) <= max) {
    return 0;
  }

  const chars = Array.from(text);
  let lo = 1;
  let hi = chars.length;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;

    if (encodedSize(chars.slice(0, chars.length - mid).join('')) <= max) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return lo;
}

/**
 * State of the content limit for the field.
 * @param {string} text - Note content.
 * @param {number} [max] - Limit in bytes of Base64.
 * @returns {{showCounter: boolean, remaining: number, over: number}} remaining:
 *   about how many more plain characters fit; over: characters to cut.
 */
export function contentLimit (text, max = MAX_DATA_SIZE) {
  const size = encodedSize(text);

  if (size > max) {
    return { showCounter: false, remaining: 0, over: excessChars(text, max) };
  }

  return {
    showCounter: size >= max * COUNTER_FROM,
    remaining: Math.floor((max - size) * 3 / 4),
    over: 0
  };
}
