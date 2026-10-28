// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE64URL, arrivals, averageWidth, easeInOut, easeOut, rippleReach, signStrokes, splitLink } from './geometry.js';

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

test('the curves start at 0 and end at 1', () => {
  for (const f of [easeOut, easeInOut]) {
    assert.equal(f(0), 0);
    assert.equal(f(1), 1);
  }

  assert.ok(easeOut(0.5) > 0.5);
  assert.equal(easeInOut(0.5), 0.5);
});

test('the ripple reaches nearer boxes first and the farthest within its duration', () => {
  const boxes = [0, 100, 200, 300].map(x => ({ x, w: 10, top: 0, h: 24 }));
  const t = arrivals(boxes, { x: 0, y: 12 }, 400, 100, 450);

  assert.ok(t[0] < t[1] && t[1] < t[2] && t[2] < t[3]);
  assert.ok(t[3] <= 450);
  assert.ok(rippleReach({ x: 0, y: 0 }, 300, 400) === 520);
});

test('a sign has 1 or 2 walks, stays near its box and does not use the character', () => {
  const random = seeded(7);
  const box = { x: 10, w: 9.63, base: 20, xh: 8.8, cap: 11.6 };

  for (let n = 0; n < 200; n++) {
    const strokes = signStrokes(box, random);

    assert.ok(strokes.length >= 1 && strokes.length <= 2);

    for (const s of strokes) {
      assert.ok(s.length >= 3);

      for (const [x, y] of s) {
        assert.ok(x > box.x - 4 && x < box.x + box.w + 4);
        assert.ok(y > box.base - box.cap - 4 && y < box.base + box.xh);
      }
    }
  }

  assert.equal(signStrokes.length, 1);
});
