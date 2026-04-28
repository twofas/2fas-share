// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useLayoutEffect, useState } from 'preact/hooks';

/**
 * Observe when an element enters the viewport and latch the state.
 * Once visible, the observer disconnects — the element stays "in view" permanently.
 * Uses useLayoutEffect with a synchronous rect check so elements already
 * in the viewport get their visible class before the first paint.
 * No-op (always true) when IntersectionObserver is unavailable.
 * @param {import('preact').RefObject<Element>} ref - Ref to the element to observe.
 * @param {number} [threshold=0.15] - Fraction of the element that must be visible.
 * @returns {boolean} Whether the element has entered the viewport.
 */
export function useInView (ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;

    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const rect = el.getBoundingClientRect();

    if (rect.top < window.innerHeight && rect.bottom > 0) {
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
      { threshold }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return visible;
}
