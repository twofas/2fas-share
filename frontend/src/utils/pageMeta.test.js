// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageTitle, plainText } from './pageMeta.js';

const STRINGS = {
  'meta.homeTitle': '2FAS Share – Send a password or a note. Only once.',
  'meta.pageTitle': '{page} – 2FAS Share',
  'meta.note': 'Private note',
  'v2.addNew.title': 'Create link',
  'legal.termsOfUse': 'Terms of Use',
  'legal.privacyPolicy': 'Privacy Policy',
  'openSourceLicenses.title': 'Open Source\nLicenses',
  'notFound.title': 'Page not found'
};

/**
 * Minimal translate function over STRINGS.
 * @param {string} key - Key.
 * @param {object} [params] - Interpolation values.
 * @returns {string} Text.
 */
const t = (key, params = {}) => Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, v), STRINGS[key]);

test('home and named pages', () => {
  assert.equal(pageTitle('/', t), '2FAS Share – Send a password or a note. Only once.');
  assert.equal(pageTitle('/add', t), 'Create link – 2FAS Share');
  assert.equal(pageTitle('/terms-of-use', t), 'Terms of Use – 2FAS Share');
  assert.equal(pageTitle('/privacy-policy', t), 'Privacy Policy – 2FAS Share');
  assert.equal(pageTitle('/open-source-licenses', t), 'Open Source Licenses – 2FAS Share');
});

test('share links, also cut short, and unknown paths', () => {
  assert.equal(pageTitle('/abc/v1k/nonce/key', t), 'Private note – 2FAS Share');
  assert.equal(pageTitle('/abc/v1p', t), 'Private note – 2FAS Share');
  assert.equal(pageTitle('/abc/foo', t), 'Page not found – 2FAS Share');
  assert.equal(pageTitle('/nope', t), 'Page not found – 2FAS Share');
});

test('plainText flattens line breaks and no-break spaces', () => {
  assert.equal(plainText('a note\nOnly  once '), 'a note Only once');
});
