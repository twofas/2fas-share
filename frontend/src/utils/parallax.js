// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useEffect } from 'preact/hooks';
import { prefersReducedMotion } from '@/utils/reducedMotion';

/**
 * Attaches a cursor-parallax effect to elements with data-dx/data-dy
 * attributes inside the given container ref. Each element translates
 * proportionally to the cursor distance from viewport center.
 * No-op when the user prefers reduced motion.
 * @param {import('preact').RefObject<HTMLElement>} containerRef - Ref to the container element.
 */
export function useParallax (containerRef) {
  useEffect(() => {
    const container = containerRef.current;

    if (!container || prefersReducedMotion()) {
      return;
    }

    const items = container.querySelectorAll('[data-dx]');
    let rafId = null;

    /**
     * Applies parallax offset based on cursor position.
     * @param {MouseEvent} e - The mousemove event.
     */
    function handleMouseMove (e) {
      if (rafId) {
        return;
      }

      rafId = requestAnimationFrame(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const nx = (e.clientX - cx) / cx;
        const ny = (e.clientY - cy) / cy;

        items.forEach(item => {
          const dx = parseFloat(item.dataset.dx);
          const dy = parseFloat(item.dataset.dy);
          item.style.translate = `${nx * dx}px ${ny * dy}px`;
        });

        rafId = null;
      });
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);

      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);
}
