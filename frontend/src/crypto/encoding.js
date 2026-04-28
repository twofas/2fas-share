// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Encode a Uint8Array to a standard Base64 string (with padding).
 * @param {Uint8Array} bytes - Binary data to encode.
 * @returns {string} Base64-encoded string.
 */
export function toBase64 (bytes) {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Encode a Uint8Array to a Base64URL string (no padding).
 * @param {Uint8Array} bytes - Binary data to encode.
 * @returns {string} Base64URL-encoded string.
 */
export function toBase64Url (bytes) {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a Base64URL string back to a Uint8Array.
 * @param {string} str - Base64URL-encoded string.
 * @returns {Uint8Array} Decoded binary data.
 */
export function fromBase64Url (str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}
