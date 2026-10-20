// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { prefersReducedMotion } from './reducedMotion';

const WAIT_MS = 1500;

/**
 * Scroll to a home page section by id. The app routes on the hash, so section
 * anchors cannot use "#id"; when the section is not on screen yet (another
 * route), wait for the home page to render it.
 * @param {string} id Section element id.
 */
export function scrollToSection (id) {
  const start = performance.now();

  /** Scroll once the section exists, retrying for up to WAIT_MS. */
  const attempt = () => {
    const el = document.getElementById(id);

    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      el.focus?.({ preventScroll: true });
      return;
    }

    if (performance.now() - start < WAIT_MS) {
      requestAnimationFrame(attempt);
    }
  };

  // Let ScrollToTop run first after a route change.
  requestAnimationFrame(() => requestAnimationFrame(attempt));
}
