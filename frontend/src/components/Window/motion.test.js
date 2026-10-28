// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTime } from './motion.js';

test('milliseconds and seconds become milliseconds', () => {
  assert.equal(parseTime('480ms', 0), 480);
  assert.equal(parseTime(' 0.32s ', 0), 320);
  assert.equal(parseTime('400', 0), 400);
});

test('a missing token gives the fallback', () => {
  assert.equal(parseTime('', 480), 480);
  assert.equal(parseTime(undefined, 160), 160);
  assert.equal(parseTime('none', 320), 320);
});
