// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { prefersReducedMotion } from '@/utils/reducedMotion';

/**
 * Animates the height change of an element using Web Animations API.
 * Captures current height, applies new state, then animates from old to new.
 * Skipped when the user prefers reduced motion.
 * @param {HTMLElement} el - The element to animate.
 * @param {number} fromHeight - The starting height in pixels.
 */
export default function animateHeight (el, fromHeight) {
  const toHeight = el.offsetHeight;

  if (fromHeight === toHeight || prefersReducedMotion()) {
    return;
  }

  el.animate(
    [
      { height: `${fromHeight}px` },
      { height: `${toHeight}px` }
    ],
    { duration: 500, easing: 'ease-in-out' }
  );
}
