// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// The "create" CTAs (navigation bar, final CTA section) take the user to the
// generator and put focus in the content field (Figma: Button / CTA,
// accessibility notes). A direct visit to /add does not steal focus.
let pending = false;

/**
 * Ask the generator page to focus its content field when it mounts.
 */
export function requestGeneratorFocus () {
  pending = true;
}

/**
 * Read and clear the pending focus request.
 * @returns {boolean} Whether the content field should take focus.
 */
export function consumeGeneratorFocus () {
  const value = pending;
  pending = false;
  return value;
}
