// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourceLink } from './sourceLink.js';

test('expands the npm GitHub shorthands', () => {
  assert.equal(sourceLink('eslint/eslint'), 'https://github.com/eslint/eslint');
  assert.equal(sourceLink('github:sindresorhus/globals'), 'https://github.com/sindresorhus/globals');
});

test('turns git URLs into browsable HTTPS URLs', () => {
  assert.equal(sourceLink('git+https://github.com/preactjs/preact.git'), 'https://github.com/preactjs/preact');
  assert.equal(sourceLink('git://github.com/soldair/node-qrcode.git'), 'https://github.com/soldair/node-qrcode');
  assert.equal(sourceLink('git+ssh://git@github.com/sass/embedded-host-node.git'), 'https://github.com/sass/embedded-host-node');
});

test('points at the package folder of a GitHub monorepo', () => {
  assert.equal(
    sourceLink('https://github.com/vitejs/vite.git (directory: packages/vite)'),
    'https://github.com/vitejs/vite/tree/HEAD/packages/vite'
  );
});

test('keeps other hosts and homepages as they are', () => {
  assert.equal(sourceLink('https://gitlab.com/a/b (directory: x)'), 'https://gitlab.com/a/b');
  assert.equal(sourceLink('https://www.npmjs.com/package/x'), 'https://www.npmjs.com/package/x');
  assert.equal(sourceLink(''), '');
});
