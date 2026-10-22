// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { isShareType } from './validateShareParams.js';

/** Named routes and the key of their page name. */
const PAGES = {
  '/add': 'v2.addNew.title',
  '/terms-of-use': 'legal.termsOfUse',
  '/privacy-policy': 'legal.privacyPolicy',
  '/open-source-licenses': 'openSourceLicenses.title'
};

/**
 * One line of plain text: translation line breaks and no-break spaces (\s
 * covers U+00A0) become ordinary spaces (a tab title or a meta tag has no layout).
 * @param {string} str - Translated text.
 * @returns {string} Plain text.
 */
export function plainText (str) {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Document title for a hash route: the home page has its own line, every
 * other page "<page> – 2FAS Share" in the language of the UI.
 * @param {string} location - Wouter location, e.g. "/add".
 * @param {(key: string, params?: object) => string} t - Translate function.
 * @returns {string} Title for document.title.
 */
export function pageTitle (location, t) {
  if (location === '/') {
    return plainText(t('meta.homeTitle'));
  }

  const parts = location.split('/').filter(Boolean);
  const pageKey = PAGES[location] ?? (parts.length >= 2 && isShareType(parts[1]) ? 'meta.note' : 'notFound.title');

  return plainText(t('meta.pageTitle', { page: plainText(t(pageKey)) }));
}
