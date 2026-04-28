// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Check whether the user prefers reduced motion.
 * @returns {boolean} True if the user has enabled the reduce-motion OS setting.
 */
export function prefersReducedMotion () {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
