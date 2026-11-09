// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// The hidden link engine (BEHAVIOR-SPEC 53) with the glitch of the main
// branch: while hidden every box after the origin rolls a random character, blurred and
// dimmed; a reveal sweeps left to right, each box rolls a few more times and
// lands on its letter with an RGB flash. While hidden the page holds no secret
// character: the secret lives only in the `secret` array of this closure.

import { prefersReducedMotion } from '@/utils/reducedMotion';
import {
  GLITCH_CHARS,
  IDLE_MS,
  REVEAL_MS,
  averageWidth,
  randomChar,
  revealSchedule,
  splitLink
} from './geometry';

/**
 * Build the hidden link inside an element.
 * @param {object} options - Options.
 * @param {HTMLElement} options.text - Empty element that receives the address.
 * @param {string} options.link - The full link.
 * @param {string} options.hiddenSuffix - Text after the origin in the accessible name while hidden.
 * @param {(shown: boolean) => void} options.onChange - Called when the visibility changes.
 * @returns {{toggle: (show: boolean, instant?: boolean) => void, shown: () => boolean, destroy: () => void}} Controller.
 */
export function createHiddenLink ({ text, link, hiddenSuffix, onChange }) {
  const { origin, parts } = splitLink(link);
  const secret = Array.from(parts.join('/'));
  const meas = document.createElement('canvas').getContext('2d');
  const boxes = [];
  let visible = true;
  let alive = true;
  let raf = 0;
  let last = 0;
  let idle = 0;
  let wanted = false;

  // ── The address: the origin, then one box per character after it (the
  // slashes between the secret parts roll too) ──
  const pub = document.createElement('span');

  pub.className = 'pub';
  pub.textContent = origin;
  text.append(pub);

  for (let k = 0; k < secret.length; k++) {
    const el = document.createElement('span');

    el.className = 'ch';
    text.append(el);
    boxes.push({ el, locked: false, lockAt: 0, cycles: 0, timer: 0 });
  }

  /** Every box has the average width of the link alphabet: rolling never reflows the text. */
  function sizeBoxes () {
    const cs = getComputedStyle(text);

    meas.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const avg = averageWidth((c) => meas.measureText(c).width).toFixed(2);

    boxes.forEach((b) => { b.el.style.inlineSize = `${avg}px`; });
  }

  /**
   * Land a box on its letter; the flash runs from the CSS of `data-lock`.
   * @param {object} b - Box.
   * @param {number} i - Index of the box.
   */
  function lock (b, i) {
    b.locked = true;
    b.el.textContent = secret[i];
    b.el.style.setProperty('--g', `${((Math.random() - 0.5) * 2).toFixed(2)}px`);
    b.el.dataset.lock = '';
  }

  /** Give every unlocked box a new random character. */
  function rollAll () {
    for (const b of boxes) {
      if (!b.locked) {
        b.el.textContent = randomChar(GLITCH_CHARS);
      }
    }
  }

  /**
   * One frame: idle rolls while hidden, the reveal sweep while shown.
   * @param {number} now - rAF time.
   * @returns {boolean} Whether another frame is needed.
   */
  function step (now) {
    const dt = last ? Math.min(50, now - last) : 16;

    last = now;

    if (!wanted) {
      idle += dt;

      if (idle >= IDLE_MS) {
        idle = 0;
        rollAll();
      }

      return true;
    }

    let pending = false;

    boxes.forEach((b, i) => {
      if (b.locked) {
        return;
      }

      pending = true;
      b.timer += dt;

      if (now < b.lockAt) {
        // Not reached by the sweep yet: keeps rolling at the idle pace.
        if (b.timer >= IDLE_MS) {
          b.timer = 0;
          b.el.textContent = randomChar(GLITCH_CHARS);
        }
      } else if (b.timer >= REVEAL_MS) {
        b.timer = 0;
        b.cycles--;

        if (b.cycles <= 0) {
          lock(b, i);
        } else {
          b.el.textContent = randomChar(GLITCH_CHARS);
        }
      }
    });

    return pending;
  }

  // ── Frame loop: sleeps off screen, in a hidden tab, with reduced motion ──
  /**
   * One frame.
   * @param {number} now - rAF time.
   */
  function tick (now) {
    const more = step(now);

    raf = more && visible && alive && !document.hidden && !prefersReducedMotion() ? requestAnimationFrame(tick) : 0;

    if (!raf) {
      last = 0;
    }
  }

  /** Wake the loop if it may run. */
  function kick () {
    if (!raf && visible && alive && !document.hidden && !prefersReducedMotion()) {
      raf = requestAnimationFrame(tick);
    }
  }

  /**
   * Reveal or hide. A reveal during a reveal keeps its sweep; a hide takes
   * every letter out at once.
   * @param {boolean} show - Reveal.
   * @param {boolean} [instant] - Land every box at once (reduced motion, or
   *   the address must be selectable right away).
   */
  function toggle (show, instant = false) {
    if (show === wanted && !instant) {
      return;
    }

    wanted = show;
    onChange(show);
    text.setAttribute('aria-label', show ? link : `${origin} ${hiddenSuffix}`);

    if (show) {
      text.dataset.shown = 'true';

      if (instant || prefersReducedMotion()) {
        boxes.forEach((b, i) => { if (!b.locked) lock(b, i); });
        return;
      }

      const plan = revealSchedule(boxes.length, performance.now());

      boxes.forEach((b, i) => {
        b.lockAt = plan[i].lockAt;
        b.cycles = plan[i].cycles;
        b.timer = 0;
      });
      kick();
      return;
    }

    delete text.dataset.shown;
    boxes.forEach((b) => {
      b.locked = false;
      b.timer = 0;
      delete b.el.dataset.lock;
    });
    rollAll();
    kick();
  }

  // ── Start: hidden and rolling ──
  text.setAttribute('aria-label', `${origin} ${hiddenSuffix}`);
  sizeBoxes();
  rollAll();
  kick();

  // A new font size (breakpoint) changes the box width.
  const ro = new ResizeObserver(sizeBoxes);

  ro.observe(text);

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    kick();
  });

  io.observe(text);

  /** The tab came back: wake the loop. */
  const onVisibility = () => {
    kick();
  };
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  /** Reduced motion read live: a reveal in progress lands at once, or the loop runs again. */
  const onMotion = () => {
    if (prefersReducedMotion() && wanted) {
      boxes.forEach((b, i) => { if (!b.locked) lock(b, i); });
    }

    kick();
  };

  document.addEventListener('visibilitychange', onVisibility);
  motionQuery.addEventListener('change', onMotion);

  return {
    toggle,
    /**
     * Whether the link is shown, or being revealed.
     * @returns {boolean} The visibility the person chose.
     */
    shown: () => wanted,
    /** Stop the loop, the observers and the listeners; empty the text. */
    destroy () {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotion);
      text.replaceChildren();
    }
  };
}
