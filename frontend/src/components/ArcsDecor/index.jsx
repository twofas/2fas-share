// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useEffect, useRef } from 'preact/hooks';
import S from './ArcsDecor.module.scss';
import { RUNS, ctaReady, peakOpacity, runDecision, runName, streakBox } from './arcsLight';

// Decor / arcs: five concentric half circles hanging from the top of the page.
const ARCS = [291, 533, 755, 1036, 1388];
const WIDTH = 1388;
const CENTER = 694;

// Event the app fires with the run name (BEHAVIOR-SPEC 50, IMPLEMENTATION-PATTERNS 9.1).
const EVENT = '2fas:arc-light';
const EASING = 'cubic-bezier(0.42, 0, 0.58, 1)';

let lastCtaRun = -Infinity;

/**
 * Start a light run on the background circles: 'ready' after a link is
 * created or a note is revealed, 'cta' on a mouse hover of the main CTA
 * (the caller checks `pointerType === 'mouse'`; at most once every 8 s).
 * Never call it from a timer. The earlier forms still work: no argument
 * means 'ready', `{ throttle: true }` means 'cta'.
 * @param {'entry'|'ready'|'cta'|{throttle?: boolean}} [name] - Run name.
 */
export function runArcsLight (name) {
  document.dispatchEvent(new CustomEvent(EVENT, { detail: runName(name) }));
}

/**
 * Build the rotor and the streak of one circle: the rotor is a 0 × 0 point
 * at the circle center and the only thing that rotates; the streak is a
 * small box with the conic gradient in a 1.5 px ring mask and a ±7 px glow.
 * @param {HTMLElement} decor - The decoration container.
 * @param {number} r - Circle radius in px.
 * @param {number} cx - Circle center from the left of the container, px.
 * @returns {{rotor: HTMLElement, streak: HTMLElement}} The elements.
 */
function buildStreak (decor, r, cx) {
  const box = streakBox(r);
  const at = `circle at ${box.cx}px ${box.cy}px`;
  const streak = document.createElement('div');
  streak.className = S.streak;
  Object.assign(streak.style, {
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`
  });
  streak.style.setProperty('--cx', `${box.cx}px`);
  streak.style.setProperty('--cy', `${box.cy}px`);
  streak.style.setProperty('--arc', `${box.arc}deg`);
  streak.style.setProperty('--mask', `radial-gradient(${at}, transparent ${r - 1.5}px, #000 ${r - 0.75}px, #000 ${r + 0.75}px, transparent ${r + 1.5}px)`);
  streak.style.setProperty('--glow-mask', `radial-gradient(${at}, transparent ${r - 7}px, #000 ${r}px, transparent ${r + 7}px)`);

  const glow = document.createElement('div');
  glow.className = S.glow;
  streak.append(glow);

  const rotor = document.createElement('div');
  rotor.className = S.rotor;
  rotor.style.left = `${cx}px`;
  rotor.append(streak);
  decor.append(rotor);

  return { rotor, streak };
}

/**
 * Decorative background circles with a one-time entrance (M-18) and short
 * light runs (M-19): 'entry' once the fonts are loaded, 'ready' and 'cta' on
 * request (runArcsLight). Never in a loop; no run in a hidden tab, with the
 * circles off screen or with reduced motion (read live). Hidden from
 * assistive technology.
 * @param {object} props - Component props.
 * @param {string} [props.className] - Extra class for positioning.
 * @returns {import('preact').JSX.Element} Background decoration.
 */
export default function ArcsDecor ({ className }) {
  const ref = useRef(null);

  useEffect(() => {
    const decor = ref.current;

    if (!decor || typeof decor.animate !== 'function') {
      return undefined;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Streaks are built for the current drawing scale and rebuilt when it changes.
    const streaks = new Map();
    let scale = 0;
    let inView = true;
    let running = null;
    let disposed = false;

    /**
     * Whether the animation may run: motion allowed, tab visible, decor on screen.
     * @returns {boolean} True when the streaks can move.
     */
    const canRun = () => !reducedMotion.matches && !document.hidden && inView;

    /**
     * The streak elements of one circle at the current scale.
     * @param {number} d - Circle diameter in the 1388 px drawing.
     * @returns {{rotor: HTMLElement, streak: HTMLElement}} The elements.
     */
    const streakFor = d => {
      const next = decor.clientWidth / WIDTH;

      if (next !== scale) {
        streaks.forEach(({ rotor }) => rotor.remove());
        streaks.clear();
        scale = next;
      }

      if (!streaks.has(d)) {
        streaks.set(d, buildStreak(decor, (d / 2) * scale, CENTER * scale));
      }

      return streaks.get(d);
    };

    /** Stop the run in progress for good: no resuming, no seconds added. */
    const stop = () => {
      if (!running) {
        return;
      }

      running.animations.forEach(a => a.cancel());
      running = null;
    };

    /**
     * Play a run if the guards allow it.
     * @param {string} name - Run name.
     * @returns {boolean} Whether the run started.
     */
    const play = name => {
      if (disposed || !canRun()) {
        return false;
      }

      const decision = runDecision(name, Boolean(running));

      if (decision === 'skip') {
        return false;
      }

      if (decision === 'interrupt') {
        stop();
      }

      const params = RUNS[name];
      const peak = peakOpacity(params);
      const animations = [];

      for (const s of params.streaks) {
        const { rotor, streak } = streakFor(s.d);
        const timing = { duration: s.duration, delay: params.startDelay + s.start, fill: 'backwards' };

        // In the rotor's coordinates the head lies at 180°. The backwards
        // fill holds the start during the delay and leaves nothing behind.
        animations.push(rotor.animate(
          [{ transform: `rotate(${s.from - 180}deg)` }, { transform: `rotate(${s.to - 180}deg)` }],
          { ...timing, easing: EASING }
        ));
        animations.push(streak.animate(
          [{ opacity: 0 }, { opacity: peak, offset: 0.22 }, { opacity: peak, offset: 0.68 }, { opacity: 0 }],
          { ...timing, easing: 'linear' }
        ));
      }

      // Each run has its own object, so the late settling of a cancelled
      // run never clears the pointer of the run that replaced it.
      const run = { animations, name };
      running = run;

      Promise.all(animations.map(a => a.finished.catch(() => {}))).then(() => {
        if (running === run) {
          running = null;
        }
      });

      return true;
    };

    /**
     * Run requested by the app.
     * @param {CustomEvent} e - Event with the run name in `detail`.
     */
    const onRun = e => {
      const name = e.detail;

      if (name === 'cta') {
        const now = performance.now();

        if (ctaReady(now, lastCtaRun) && play('cta')) {
          lastCtaRun = now;
        }

        return;
      }

      play(name);
    };

    /** Hidden tab: interrupt the run. */
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      }
    };

    /** Reduced motion switched on during the visit: interrupt the run. */
    const onMotion = () => {
      if (reducedMotion.matches) {
        stop();
      }
    };

    let observer = null;

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;

        if (!inView) {
          stop();
        }
      });
      observer.observe(decor);
    }

    document.addEventListener(EVENT, onRun);
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', onMotion);

    // Entering the page: after the fonts load, so the run does not meet a
    // layout shift.
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => play('entry'));

    return () => {
      disposed = true;
      stop();
      observer?.disconnect();
      document.removeEventListener(EVENT, onRun);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotion);
      streaks.forEach(({ rotor }) => rotor.remove());
    };
  }, []);

  return (
    <div ref={ref} className={`${S.arcs} ${className || ''}`} aria-hidden='true'>
      <svg viewBox={`0 0 ${WIDTH} 696`} fill='none' aria-hidden='true' focusable='false'>
        {ARCS.map((d, i) => (
          <path
            key={d}
            className={S.arc}
            style={{ '--i': i }}
            d={`M${CENTER + d / 2} 0a${d / 2} ${d / 2} 0 0 1-${d} 0`}
          />
        ))}
      </svg>
    </div>
  );
}
