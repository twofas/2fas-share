// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

const VALID_TYPES = new Set(['v1p', 'v1k']);
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;
const MAX_PARAM_LENGTH = 1000;

/**
 * Validates shared data route parameters.
 * @param {object} params - Route parameters.
 * @param {string} params.id - Base64url-encoded identifier.
 * @param {string} params.type - Share type (v1p or v1k).
 * @param {string} params.nonce - Base64url-encoded nonce.
 * @param {string} params.key - Base64url-encoded key (v1k) or salt (v1p).
 * @returns {boolean} True if all parameters are valid.
 */
export default function validateShareParams ({ id, type, nonce, key }) {
  if (!id || id.length > MAX_PARAM_LENGTH) return false;
  if (!VALID_TYPES.has(type)) return false;
  if (!nonce || !BASE64URL_RE.test(nonce) || nonce.length > MAX_PARAM_LENGTH) return false;
  if (!key || !BASE64URL_RE.test(key) || key.length > MAX_PARAM_LENGTH) return false;
  return true;
}
