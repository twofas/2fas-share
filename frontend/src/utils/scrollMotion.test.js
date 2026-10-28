// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cubicBezier, parseCubicBezier, parseDuration } from './scrollMotion.js';

test('durations in ms and s, nothing for other values', () => {
  assert.equal(parseDuration('800ms'), 800);
  assert.equal(parseDuration(' 0.8s '), 800);
  assert.equal(parseDuration(''), 0);
  assert.equal(parseDuration(undefined), 0);
  assert.equal(parseDuration('var(--x)'), 0);
});

test('cubic-bezier values, null for other curves', () => {
  assert.deepEqual(parseCubicBezier('cubic-bezier(0.42, 0, 0.58, 1)'), [0.42, 0, 0.58, 1]);
  assert.deepEqual(parseCubicBezier(' cubic-bezier(0.22,1.2,0.36,1)'), [0.22, 1.2, 0.36, 1]);
  assert.equal(parseCubicBezier('ease-in-out'), null);
  assert.equal(parseCubicBezier(''), null);
});

test('in-out curve: ends fixed, symmetric, slow at both ends', () => {
  const ease = cubicBezier(0.42, 0, 0.58, 1);

  assert.equal(ease(0), 0);
  assert.equal(ease(1), 1);
  assert.equal(ease(-1), 0);
  assert.equal(ease(2), 1);
  assert.ok(Math.abs(ease(0.5) - 0.5) < 1e-4);
  assert.ok(Math.abs(ease(0.2) + ease(0.8) - 1) < 1e-4);
  assert.ok(ease(0.1) < 0.1);
  assert.ok(ease(0.9) > 0.9);
});

test('linear control points give linear progress', () => {
  const ease = cubicBezier(0, 0, 1, 1);

  for (const x of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    assert.ok(Math.abs(ease(x) - x) < 1e-4);
  }
});
