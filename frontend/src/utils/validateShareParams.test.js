// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import validateShareParams, { isRecipientLayout, isRecipientRoute, isShareType } from './validateShareParams.js';

/**
 * Base64url without padding of n bytes, as in a share link.
 * @param {number} n - Byte count.
 * @returns {string} Encoded value.
 */
const b64url = n => Buffer.from(new Uint8Array(n).fill(250)).toString('base64url');
const ID = '0b4f2c1e-5d6a-4e7f-8a9b-0c1d2e3f4a5b';
const NONCE = b64url(12);
const KEY = b64url(32);
const SALT = b64url(16);

test('sizes match what the generator and 2FAS Pass produce', () => {
  assert.equal(NONCE.length, 16);
  assert.equal(KEY.length, 43);
  assert.equal(SALT.length, 22);
});

test('full links pass', () => {
  assert.equal(validateShareParams({ id: ID, type: 'v1k', nonce: NONCE, key: KEY }), true);
  assert.equal(validateShareParams({ id: ID, type: 'v1p', nonce: NONCE, key: SALT }), true);
});

test('a link cut inside the key fails', () => {
  for (let cut = 1; cut <= 10; cut++) {
    assert.equal(validateShareParams({ id: ID, type: 'v1k', nonce: NONCE, key: KEY.slice(0, -cut) }), false);
    assert.equal(validateShareParams({ id: ID, type: 'v1p', nonce: NONCE, key: SALT.slice(0, -cut) }), false);
  }
});

test('the key of the other type does not fit', () => {
  assert.equal(validateShareParams({ id: ID, type: 'v1p', nonce: NONCE, key: KEY }), false);
  assert.equal(validateShareParams({ id: ID, type: 'v1k', nonce: NONCE, key: SALT }), false);
});

test('bad nonce, padding and missing parts fail', () => {
  assert.equal(validateShareParams({ id: ID, type: 'v1k', nonce: NONCE.slice(0, -1), key: KEY }), false);
  assert.equal(validateShareParams({ id: ID, type: 'v1k', nonce: NONCE, key: KEY.slice(0, -1) + '=' }), false);
  assert.equal(validateShareParams({ id: ID, type: 'v1k', nonce: NONCE }), false);
  assert.equal(validateShareParams({ id: ID, type: 'v2k', nonce: NONCE, key: KEY }), false);
});

test('isShareType', () => {
  assert.equal(isShareType('v1k'), true);
  assert.equal(isShareType('v1p'), true);
  assert.equal(isShareType('toString'), false);
  assert.equal(isShareType('add'), false);
});

test('recipient routes: a full link, or one cut short after the type', () => {
  assert.equal(isRecipientRoute(`/${ID}/v1k/${NONCE}/${b64url(32)}`), true);
  assert.equal(isRecipientRoute(`/${ID}/v1p/${NONCE}`), true);
  assert.equal(isRecipientRoute(`/${ID}/v1k`), true);
  assert.equal(isRecipientRoute('/a/b/c/d'), true);
});

test('other routes are not recipient routes', () => {
  assert.equal(isRecipientRoute('/'), false);
  assert.equal(isRecipientRoute('/add'), false);
  assert.equal(isRecipientRoute('/privacy-policy'), false);
  assert.equal(isRecipientRoute('/foo/bar'), false);
});

test('the recipient layout also covers "Page not found", not the app pages', () => {
  assert.equal(isRecipientLayout(`/${ID}/v1k/${NONCE}/${b64url(32)}`), true);
  assert.equal(isRecipientLayout('/foo/bar'), true);
  assert.equal(isRecipientLayout('/nope'), true);
  for (const page of ['/', '/add', '/terms-of-use', '/privacy-policy', '/open-source-licenses']) {
    assert.equal(isRecipientLayout(page), false);
  }
});
