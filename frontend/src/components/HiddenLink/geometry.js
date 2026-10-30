// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Pure helpers of the hidden link (BEHAVIOR-SPEC 53): splitting the address,
// the box width and the timing of the glitch reveal. Nothing here touches the
// DOM, so it runs under `node --test`.

/** The URL-safe Base64 alphabet, the characters the secret parts are made of. */
export const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Characters the hidden boxes cycle through (the glitch of the main branch). */
export const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/:?#.=-_~&%+@';

// Timing of the glitch, in ms: a hidden box rolls a new character every
// IDLE_MS; on reveal box n starts n × REVEAL_STAGGER after the click, rolls
// REVEAL_CYCLES (or one more) times every REVEAL_MS, then lands on its letter.
export const IDLE_MS = 90;
export const REVEAL_STAGGER = 10;
export const REVEAL_CYCLES = 5;
export const REVEAL_MS = 24;

/**
 * Split a share link into the visible origin and the secret parts.
 * `https://share.2fas.com/#/id/type/nonce/key` gives the origin
 * `https://share.2fas.com/#/` and the four parts; the slashes between the
 * parts stay visible.
 * @param {string} link - The full share link.
 * @returns {{origin: string, parts: string[]}} Visible origin and the secret parts.
 */
export function splitLink (link) {
  const hash = link.indexOf('#/');
  let cut = hash >= 0 ? hash + 2 : -1;

  if (cut < 0) {
    const scheme = link.indexOf('://');
    const slash = link.indexOf('/', scheme >= 0 ? scheme + 3 : 0);

    cut = slash >= 0 ? slash + 1 : link.length;
  }

  const rest = link.slice(cut);

  return { origin: link.slice(0, cut), parts: rest ? rest.split('/') : [] };
}

/**
 * Average advance width of the Base64url alphabet: the one width of every
 * empty character box while the link is hidden.
 * @param {(ch: string) => number} measure - Width of one character in the link font.
 * @returns {number} Average width in px.
 */
export function averageWidth (measure) {
  let sum = 0;

  for (const ch of BASE64URL) {
    sum += measure(ch);
  }

  return sum / BASE64URL.length;
}

/**
 * A random character of a set.
 * @param {string} set - Character pool.
 * @param {() => number} [random] - Source of randomness.
 * @returns {string} One character.
 */
export function randomChar (set, random = Math.random) {
  return set[Math.floor(random() * set.length)];
}

/**
 * When each box of a reveal starts rolling and how many rolls it makes
 * before it lands on its letter: left to right, one stagger apart.
 * @param {number} count - Number of secret boxes.
 * @param {number} now - Time of the click in ms.
 * @param {() => number} [random] - Source of randomness.
 * @returns {Array<{lockAt: number, cycles: number}>} Schedule per box.
 */
export function revealSchedule (count, now, random = Math.random) {
  return Array.from({ length: count }, (_, i) => ({
    lockAt: now + i * REVEAL_STAGGER,
    cycles: REVEAL_CYCLES + Math.floor(random() * 2)
  }));
}

/**
 * When the last box of a reveal lands on its letter.
 * @param {number} count - Number of secret boxes.
 * @returns {number} Time from the click in ms.
 */
export function revealDuration (count) {
  return Math.max(0, count - 1) * REVEAL_STAGGER + (REVEAL_CYCLES + 1) * REVEAL_MS;
}
