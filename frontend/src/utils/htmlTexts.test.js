// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractHtmlKeys, fillHtmlTexts } from './htmlTexts.js';

/**
 * Read a file of the frontend package.
 * @param {string} path - Path from the package root.
 * @returns {string} File content.
 */
const readPackageFile = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf-8');

test('fills nested keys as one line of plain text', () => {
  const messages = { a: { b: 'First line \nsecond line' } };

  assert.equal(fillHtmlTexts('<p>{{a.b}}</p>', messages), '<p>First line second line</p>');
});

test('escapes texts, so they are safe in elements and attributes', () => {
  assert.equal(fillHtmlTexts('<meta content="{{k}}">', { k: 'Terms & "<b>"' }), '<meta content="Terms &amp; &quot;&lt;b&gt;&quot;">');
});

test('params are put in as markup, unknown names stay as they are', () => {
  const messages = { k: 'See {site} or {other}' };

  assert.equal(fillHtmlTexts('{{k}}', messages, { site: '<a href="/">site</a>' }), 'See <a href="/">site</a> or {other}');
});

test('a key without text fails instead of shipping a placeholder', () => {
  assert.throws(() => fillHtmlTexts('{{missing.key}}', {}), /missing\.key/);
  assert.throws(() => fillHtmlTexts('{{plural}}', { plural: { one: 'x', other: 'y' } }), /plural/);
  assert.throws(() => fillHtmlTexts('{{empty}}', { empty: '' }), /empty/);
});

test('extractHtmlKeys lists each key once', () => {
  assert.deepEqual(extractHtmlKeys('{{a.b}} {{ c }} {{a.b}} {single}'), ['a.b', 'c']);
});

test('index.html has every text in every locale', () => {
  const html = readPackageFile('index.html');

  assert.ok(extractHtmlKeys(html).length > 0);

  for (const locale of ['en', 'pl', 'de']) {
    const messages = JSON.parse(readPackageFile(`src/locales/${locale}.json`));

    assert.doesNotMatch(fillHtmlTexts(html, messages), /\{\{/);
  }
});
