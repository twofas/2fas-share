// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Block rendering if the page is embedded in an iframe (clickjacking protection).
 * Imported as the very first module in main.jsx so it runs before anything else.
 */
if (window.self !== window.top) {
  document.body.textContent = '';
  throw new Error('Embedding in iframes is not allowed.');
}
