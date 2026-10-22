// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { MAX_DATA_SIZE, noteData, encodedSize, excessChars, contentLimit } from './contentLimit.js';

/**
 * Real size of the data field: encrypt like the generator and Base64 it.
 * @param {string} text - Note content.
 * @returns {Promise<number>} Base64 length.
 */
async function realSize (text) {
  const key = await webcrypto.subtle.importKey('raw', new Uint8Array(32), 'AES-GCM', false, ['encrypt']);
  const cipher = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(12) },
    key,
    new TextEncoder().encode(JSON.stringify(noteData(text)))
  );

  return Buffer.from(cipher).toString('base64').length;
}

test('encodedSize matches the real encrypted Base64 length', async () => {
  for (const text of ['', 'a', 'Hasło: Coffee2026Buzz!', 'zażółć\n"gęślą"\tjaźń', '🔐'.repeat(50), 'x'.repeat(12000)]) {
    assert.equal(encodedSize(text), await realSize(text), JSON.stringify(text.slice(0, 20)));
  }
});

test('short note: no counter, nothing to cut', () => {
  assert.deepEqual(contentLimit('hello').over, 0);
  assert.equal(contentLimit('hello').showCounter, false);
});

test('counter shows from 80 % of the limit', () => {
  let text = 'x'.repeat(9000);

  while (encodedSize(text) < MAX_DATA_SIZE * 0.8) {
    text += 'x';
  }

  assert.equal(contentLimit(text).showCounter, true);
  assert.equal(contentLimit(text.slice(0, -4)).showCounter, false);
});

test('excessChars is the smallest cut that fits', () => {
  for (const unit of ['x', 'ż', '🔐', '\n']) {
    const text = unit.repeat(13000);
    const cut = excessChars(text);
    const chars = Array.from(text);

    assert.ok(cut > 0);
    assert.ok(encodedSize(chars.slice(0, chars.length - cut).join('')) <= MAX_DATA_SIZE);
    assert.ok(encodedSize(chars.slice(0, chars.length - cut + 1).join('')) > MAX_DATA_SIZE);
  }
});

test('over the limit: no counter, the cut is reported', () => {
  const state = contentLimit('x'.repeat(13000));

  assert.equal(state.showCounter, false);
  assert.ok(state.over > 0);
});
