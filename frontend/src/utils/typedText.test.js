// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typedPrefix } from './typedText.js';

test('nothing before the delay, then one character per step', () => {
  assert.equal(typedPrefix('Hasło', 0, 100, 40), '');
  assert.equal(typedPrefix('Hasło', 99, 100, 40), '');
  assert.equal(typedPrefix('Hasło', 100, 100, 40), 'H');
  assert.equal(typedPrefix('Hasło', 180, 100, 40), 'Has');
});

test('full text at the end and after it', () => {
  assert.equal(typedPrefix('Hasło', 260, 100, 40), 'Hasło');
  assert.equal(typedPrefix('Hasło', 10000, 100, 40), 'Hasło');
});

test('counts code points, not UTF-16 units', () => {
  assert.equal(typedPrefix('🔐ab', 100, 100, 40), '🔐');
});
