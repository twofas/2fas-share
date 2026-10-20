// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remainingUnit, formatRemaining, formatDay, isLastMinutes } from './expiryText.js';

const MIN = 60 * 1000;

test('remainingUnit picks minutes, hours and days', () => {
  assert.deepEqual(remainingUnit(55.5 * MIN), { value: 56, unit: 'minute' });
  assert.deepEqual(remainingUnit(10 * 1000), { value: 1, unit: 'minute' });
  assert.deepEqual(remainingUnit(60 * MIN), { value: 60, unit: 'minute' });
  assert.deepEqual(remainingUnit(23 * 60 * MIN), { value: 23, unit: 'hour' });
  assert.deepEqual(remainingUnit(7 * 24 * 60 * MIN), { value: 7, unit: 'day' });
});

test('formatRemaining uses the plural rules of the language', () => {
  assert.equal(formatRemaining(56 * MIN, 'en'), 'in 56 minutes');
  assert.equal(formatRemaining(1 * MIN, 'en'), 'in 1 minute');
  assert.equal(formatRemaining(2 * MIN, 'pl'), 'za 2 minuty');
  assert.equal(formatRemaining(5 * MIN, 'pl'), 'za 5 minut');
  assert.equal(formatRemaining(22 * MIN, 'pl'), 'za 22 minuty');
  assert.equal(formatRemaining(5 * MIN, 'de'), 'in 5 Minuten');
  assert.equal(formatRemaining(1 * MIN, 'de'), 'in 1 Minute');
});

test('formatDay says today and tomorrow, else the date', () => {
  const now = new Date(2026, 9, 20, 11, 0);
  assert.equal(formatDay(new Date(2026, 9, 20, 12, 15), now, 'en'), 'Today');
  assert.equal(formatDay(new Date(2026, 9, 21, 9, 0), now, 'en'), 'Tomorrow');
  assert.equal(formatDay(new Date(2026, 9, 20, 12, 15), now, 'pl'), 'Dzisiaj');
  assert.equal(formatDay(new Date(2026, 9, 21, 9, 0), now, 'de'), 'Morgen');
  assert.match(formatDay(new Date(2026, 9, 27, 9, 0), now, 'en'), /Tuesday/);
});

test('isLastMinutes is true only in the last 5 minutes', () => {
  assert.equal(isLastMinutes(6 * MIN), false);
  assert.equal(isLastMinutes(5 * MIN), true);
  assert.equal(isLastMinutes(1000), true);
  assert.equal(isLastMinutes(0), false);
});
