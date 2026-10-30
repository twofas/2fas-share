// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import assert from 'node:assert/strict';

/**
 * Picks from a value only the keys present in the expected shape (recursively for plain objects).
 * @param {*} actual - Value under test.
 * @param {*} expected - Expected subset.
 * @return {*} Subset of the actual value.
 */
const pickShape = (actual, expected) => {
  if (!expected || typeof expected !== 'object' || Array.isArray(expected) || !actual || typeof actual !== 'object') {
    return actual;
  }

  return Object.fromEntries(Object.keys(expected).map(key => [key, pickShape(actual[key], expected[key])]));
};

/**
 * Asserts that an object contains the expected keys and values (extra keys are ignored), like vitest's toMatchObject.
 * @param {Object} actual - Value under test.
 * @param {Object} expected - Expected subset.
 * @return {void}
 */
export const assertMatch = (actual, expected) => {
  assert.deepEqual(pickShape(actual, expected), expected);
};
