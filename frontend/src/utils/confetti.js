// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import canvasConfetti from 'canvas-confetti';
import { prefersReducedMotion } from '@/utils/reducedMotion';

/** @type {import('canvas-confetti').Options} Shared confetti defaults. */
const defaults = {
  spread: 360,
  ticks: 50,
  gravity: 0,
  decay: 0.94,
  startVelocity: 30,
  colors: ['6D28D9', '7C3AED', '8B5CF6', 'A78BFA', 'C4B5FD']
};

/**
 * Fire a confetti burst using canvas-confetti.
 * Skipped entirely when the user prefers reduced motion.
 * @returns {void}
 */
export default function confetti () {
  if (prefersReducedMotion()) {
    return;
  }

  canvasConfetti({
    ...defaults,
    particleCount: 40,
    scalar: 1.2,
    shapes: ['circle']
  });

  canvasConfetti({
    ...defaults,
    particleCount: 10,
    scalar: 0.75,
    shapes: ['circle']
  });
}
