// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Fill the {{key}} placeholders of index.html from a translation file, so the
 * texts for link previews and the no-JavaScript version live in Loco with the
 * rest of the copy. Used by the html-texts plugin in vite.config.js and by the
 * key audit in scripts/pull-translations.mjs.
 */

import { plainText } from './pageMeta.js';

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;

const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escape text for an HTML element or a quoted attribute.
 * @param {string} str - Plain text.
 * @returns {string} Escaped text.
 */
function escapeHtml (str) {
  return str.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);
}

/**
 * List the translation keys used by an HTML file.
 * @param {string} html - HTML source.
 * @returns {string[]} Keys, in order of first use.
 */
export function extractHtmlKeys (html) {
  return [...new Set([...html.matchAll(PLACEHOLDER)].map((match) => match[1]))];
}

/**
 * Replace every {{key}} with its text as one escaped line. A {name} inside the
 * text becomes params[name] unescaped, so params may hold markup such as a link.
 * @param {string} html - HTML source.
 * @param {object} messages - Nested translation object.
 * @param {Record<string, string>} [params] - Trusted values for {name} in the texts.
 * @returns {string} HTML with the texts in place.
 * @throws {Error} When a key has no text, so a key lost from Loco fails the build.
 */
export function fillHtmlTexts (html, messages, params = {}) {
  return html.replace(PLACEHOLDER, (_, key) => {
    const text = key.split('.').reduce((node, part) => node?.[part], messages);

    if (typeof text !== 'string' || text === '') {
      throw new Error(`index.html: no text for translation key "${key}"`);
    }

    return escapeHtml(plainText(text)).replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
  });
}
