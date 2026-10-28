// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;
const MAX_PARAM_LENGTH = 1000;

// Base64url without padding of the 12-byte nonce, the 32-byte key (v1k) and
// the 16-byte salt (v1p); the same sizes in the generator and in 2FAS Pass.
const NONCE_LENGTH = 16;
const KEY_LENGTH = { v1k: 43, v1p: 22 };

/**
 * Whether a path segment names a share type.
 * @param {string} type - Path segment.
 * @returns {boolean} True for v1k and v1p.
 */
export function isShareType (type) {
  return Object.hasOwn(KEY_LENGTH, type);
}

/**
 * Whether the hash route is a shared-data link (/:id/:type/:nonce/:key), also
 * one cut short after the type (the Broken recipient state).
 * @param {string} location - Current wouter location.
 * @returns {boolean} True on the recipient page.
 */
export function isRecipientRoute (location) {
  const parts = location.split('/').filter(Boolean);

  return parts.length === 4 || (parts.length >= 2 && isShareType(parts[1]));
}

// Routes of the app's own pages (app.jsx); any other path is a note link, a
// broken one, or "Page not found".
const PAGE_ROUTES = ['/', '/add', '/terms-of-use', '/privacy-policy', '/open-source-licenses'];

/**
 * Whether the page uses the recipient layout: the recipient bar and a footer
 * without the 4|8 line. Besides note links (also Broken) this covers "Page
 * not found", which is shown in the layout of Broken (BEHAVIOR-SPEC 59.8).
 * @param {string} location - Current wouter location.
 * @returns {boolean} True on the recipient page and on the not found page.
 */
export function isRecipientLayout (location) {
  return isRecipientRoute(location) || !PAGE_ROUTES.includes(location);
}

/**
 * Validates shared data route parameters. A link cut short (for example by a
 * messenger) misses the end of the key, so the lengths are checked before
 * anything is fetched: a one-time note must not be spent on a broken link.
 * @param {object} params - Route parameters.
 * @param {string} params.id - Base64url-encoded identifier.
 * @param {string} params.type - Share type (v1p or v1k).
 * @param {string} params.nonce - Base64url-encoded nonce.
 * @param {string} params.key - Base64url-encoded key (v1k) or salt (v1p).
 * @returns {boolean} True if all parameters are valid.
 */
export default function validateShareParams ({ id, type, nonce, key }) {
  if (!id || id.length > MAX_PARAM_LENGTH) return false;
  if (!isShareType(type)) return false;
  if (!nonce || nonce.length !== NONCE_LENGTH || !BASE64URL_RE.test(nonce)) return false;
  if (!key || key.length !== KEY_LENGTH[type] || !BASE64URL_RE.test(key)) return false;
  return true;
}
