// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, viewChangeTimings } from './viewMotion.js';

const TOKENS = { layout: 480, toggle: 320, reveal: 450, standard: 'S', out: 'O' };

test('parses milliseconds and seconds', () => {
  assert.equal(parseDuration('480ms'), 480);
  assert.equal(parseDuration(' 0.32s '), 320);
  assert.equal(parseDuration('0.01ms'), 0.01);
});

test('unknown or empty values give 0', () => {
  assert.equal(parseDuration(''), 0);
  assert.equal(parseDuration(undefined), 0);
  assert.equal(parseDuration('fast'), 0);
  assert.equal(parseDuration('12px'), 0);
});

test('M-33 reveal: 160 ms out, height in layout standard, content in reveal out', () => {
  assert.deepEqual(viewChangeTimings(TOKENS, true), {
    outMs: 160, heightMs: 480, inMs: 450, outEasing: 'S', heightEasing: 'S', inEasing: 'O', rise: false
  });
});

test('M-28 other changes: 160 ms out, 320 ms height and entrance with a rise', () => {
  assert.deepEqual(viewChangeTimings(TOKENS, false), {
    outMs: 160, heightMs: 320, inMs: 320, outEasing: 'S', heightEasing: 'S', inEasing: 'S', rise: true
  });
});

test('never a negative fade-out', () => {
  assert.equal(viewChangeTimings({ ...TOKENS, layout: 0.01, toggle: 0.01 }, false).outMs, 0);
});
