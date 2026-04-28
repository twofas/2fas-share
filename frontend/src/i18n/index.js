// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import en from '../locales/en.json';
import pl from '../locales/pl.json';

/** @type {Record<string, object>} */
const translations = { en, pl };

const fallbackLang = 'en';

/**
 * Detect the best matching language from navigator.language.
 * Tries full tag (e.g. 'pl-PL'), then base (e.g. 'pl'), then fallback.
 * @returns {string} Resolved language code.
 */
function detectLanguage () {
  const nav = navigator.language;

  if (translations[nav]) {
    return nav;
  }

  const short = nav.split('-')[0];

  if (translations[short]) {
    return short;
  }

  return fallbackLang;
}

const currentLang = detectLanguage();
const dict = translations[currentLang] || translations[fallbackLang];

/**
 * Resolve a dot-separated key against a nested object.
 * @param {object} obj - The nested translations object.
 * @param {string} key - Dot-separated key (e.g. 'home.title').
 * @returns {string|undefined} The resolved string, or undefined if not found.
 */
function resolve (obj, key) {
  let cur = obj;

  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object') {
      return undefined;
    }

    cur = cur[part];
  }

  return typeof cur === 'string' ? cur : undefined;
}

/**
 * Translate a key with optional interpolation.
 * Missing keys return the key itself so untranslated strings are visible in the UI.
 * @param {string} key - Dot-namespaced translation key (e.g. 'home.title').
 * @param {Record<string, string|number>} [params] - Interpolation values for {placeholder} tokens.
 * @returns {string} Translated string.
 */
export function t (key, params) {
  let str = resolve(dict, key) ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }

  return str;
}
