// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useLayoutEffect, useState } from 'preact/hooks';

// Share of the viewport height cut off at the bottom of the view.
const VIEW_BOTTOM_INSET = 0.05;

/**
 * Observe when an element enters the viewport and latch the state.
 * Once visible, the observer disconnects — the element stays "in view" permanently.
 * The view ends 5 % above the bottom edge (MOTION section 1: rootMargin
 * `0px 0px -5% 0px`, each element once, leaving the view reverses nothing).
 * Uses useLayoutEffect with a synchronous rect check so elements already
 * in the viewport get their visible class before the first paint.
 * No-op (always true) when IntersectionObserver is unavailable.
 * @param {import('preact').RefObject<Element>} ref - Ref to the element to observe.
 * @returns {boolean} Whether the element has entered the viewport.
 */
export function useInView (ref) {
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;

    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const rect = el.getBoundingClientRect();

    if (rect.top < window.innerHeight * (1 - VIEW_BOTTOM_INSET) && rect.bottom > 0) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: `0px 0px -${VIEW_BOTTOM_INSET * 100}% 0px` }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return visible;
}
