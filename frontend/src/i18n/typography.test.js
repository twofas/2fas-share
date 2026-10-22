// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindShortWords } from './typography.js';

const NB = '\u00A0';

test('one-letter words stick to the next word', () => {
  assert.equal(bindShortWords('Send a password or a note.'), `Send a${NB}password or a${NB}note.`);
  assert.equal(bindShortWords('Klucz w linku i w przeglądarce'), `Klucz w${NB}linku i${NB}w${NB}przeglądarce`);
  assert.equal(bindShortWords('Z linku do notatki'), `Z${NB}linku do notatki`);
  assert.equal(bindShortWords('(i dalej)'), `(i${NB}dalej)`);
  assert.equal(bindShortWords('1 h'), `1${NB}h`);
});

test('longer words, explicit line breaks and the end of text stay', () => {
  assert.equal(bindShortWords('Short answers.\nThe rest is on GitHub.'), 'Short answers.\nThe rest is on GitHub.');
  assert.equal(bindShortWords('or a\nnote'), 'or a\nnote');
  assert.equal(bindShortWords('plan B'), 'plan B');
  assert.equal(bindShortWords('2FAS Share'), '2FAS Share');
});
