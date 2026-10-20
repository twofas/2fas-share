// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useEffect, useState } from 'preact/hooks';
import S from './ArcsDecor.module.scss';
import { prefersReducedMotion } from '@/utils/reducedMotion';

// Decor / arcs: five concentric half circles hanging from the top of the page.
const ARCS = [291, 533, 755, 1036, 1388];
const WIDTH = 1388;

// Light streaks: circle diameter, head angles (clockwise from the top),
// start delay and duration in ms (Figma: Decor / arcs, MOTION).
const RUNS = [
  { d: 533, from: 104, to: 164, delay: 600, duration: 2900 },
  { d: 1036, from: 206, to: 258, delay: 900, duration: 3000 },
  { d: 1388, from: 98, to: 140, delay: 1200, duration: 3100 }
];

const MIN_GAP_MS = 8000;
let lastRun = 0;

/**
 * Start one light run around the background circles, e.g. when a link is
 * ready or a note is revealed. Never call it in a loop.
 * @param {object} [options] - Options.
 * @param {boolean} [options.throttle] - Skip when the last run was under 8 s ago (CTA hover).
 */
export function runArcsLight ({ throttle = false } = {}) {
  if (throttle && performance.now() - lastRun < MIN_GAP_MS) {
    return;
  }

  window.dispatchEvent(new Event('arcs:run'));
}

/**
 * Decorative background circles with a one-time entrance and a single light
 * run after the page is shown. Hidden from assistive technology.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Extra class for positioning.
 * @returns {import('preact').JSX.Element} Background decoration.
 */
export default function ArcsDecor ({ className }) {
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const start = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      lastRun = performance.now();
      setRun(n => n + 1);
    };

    start();
    window.addEventListener('arcs:run', start);

    return () => window.removeEventListener('arcs:run', start);
  }, []);

  return (
    <div className={`${S.arcs} ${className || ''}`} aria-hidden='true'>
      <svg viewBox={`0 0 ${WIDTH} 696`} fill='none' focusable='false'>
        {ARCS.map((d, i) => (
          <path
            key={d}
            className={S.arc}
            style={{ '--i': i }}
            d={`M${694 + d / 2} 0a${d / 2} ${d / 2} 0 0 1-${d} 0`}
          />
        ))}
      </svg>

      {run > 0 && RUNS.map(({ d, from, to, delay, duration }) => (
        <span
          key={`${d}-${run}`}
          className={S.light}
          style={{
            '--size': `${(d / WIDTH) * 100}%`,
            '--from': `${from}deg`,
            '--to': `${to}deg`,
            '--delay': `${run === 1 ? delay : delay - 600}ms`,
            '--duration': `${duration}ms`,
            '--streak': `${Math.min(36, (300 / (Math.PI * d)) * 360)}deg`
          }}
        >
          <span className={S.halo} />
          <span className={S.core} />
        </span>
      ))}
    </div>
  );
}
