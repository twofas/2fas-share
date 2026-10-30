// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE64URL, GLITCH_CHARS, REVEAL_CYCLES, REVEAL_MS, REVEAL_STAGGER, averageWidth, randomChar, revealDuration, revealSchedule, splitLink } from './geometry.js';

const LINK = 'https://share.2fas.com/#/jtuhrIaoVVmLpi7Ptpu84G-bePYs9ipzimlOJ5KxtrQ/v1k/edSvqkglVIuwgro3/voY0HSkb0ORUGYN0hYH2xZI3b2cFrSGwbOPFBe_oCO8';

/**
 * Seeded pseudo-random numbers (mulberry32).
 * @param {number} seed - Seed.
 * @returns {() => number} Generator of numbers in [0, 1).
 */
function seeded (seed) {
  let a = seed;

  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);

    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

test('the origin stays visible, the four secret parts have the format lengths', () => {
  const { origin, parts } = splitLink(LINK);

  assert.equal(origin, 'https://share.2fas.com/#/');
  assert.deepEqual(parts.map(p => p.length), [43, 3, 16, 43]);
  assert.equal(parts.join('').length, 105);
  assert.equal(origin + parts.join('/'), LINK);
});

test('a password link has a 22-character salt: 84 secret characters', () => {
  const { parts } = splitLink('http://localhost:5173/#/abc/v1p/edSvqkglVIuwgro3/0123456789abcdefghijkl');

  assert.deepEqual(parts.map(p => p.length), [3, 3, 16, 22]);
});

test('a link without a hash route keeps the origin and its slash visible', () => {
  assert.deepEqual(splitLink('https://example.com/a/b'), { origin: 'https://example.com/', parts: ['a', 'b'] });
});

test('every hidden box has the average width of the Base64url alphabet', () => {
  assert.equal(BASE64URL.length, 64);
  assert.ok(Math.abs(averageWidth(() => 9.63) - 9.63) < 1e-9);
  assert.ok(Math.abs(averageWidth(c => (c === '-' || c === '_' ? 0 : 64 / 62)) - 1) < 1e-9);
});

test('a hidden box rolls only characters of the glitch set', () => {
  const random = seeded(3);

  for (let i = 0; i < 500; i++) {
    assert.ok(GLITCH_CHARS.includes(randomChar(GLITCH_CHARS, random)));
  }
});

test('the reveal runs left to right, one stagger apart, 5 or 6 rolls per box', () => {
  const plan = revealSchedule(84, 1000, seeded(7));

  assert.equal(plan.length, 84);
  plan.forEach((p, i) => {
    assert.equal(p.lockAt, 1000 + i * REVEAL_STAGGER);
    assert.ok(p.cycles === REVEAL_CYCLES || p.cycles === REVEAL_CYCLES + 1);
  });
});

test('the last box lands within the reveal duration', () => {
  const plan = revealSchedule(105, 0, () => 0.999);
  const last = plan[plan.length - 1];

  assert.ok(last.lockAt + last.cycles * REVEAL_MS <= revealDuration(105));
  assert.equal(revealDuration(0), (REVEAL_CYCLES + 1) * REVEAL_MS);
});
