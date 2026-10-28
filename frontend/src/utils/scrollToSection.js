// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Scroll to an anchor (MOTION M-24, ACCESSIBILITY 18.2): the page scrolls in
// JavaScript over --motion-duration-scroll (800 ms) on --motion-easing-in-out,
// because native `behavior: smooth` lets the browser pick the time and the
// curve. A wheel, a touch, a key or a mouse press stops it at once, and so does
// a position the script did not write (the scrollbar dragged by hand fires none
// of those events). Reduced motion: a jump. Without the motion tokens the
// browser scrolls natively.

import { prefersReducedMotion } from './reducedMotion';
import { cubicBezier, parseCubicBezier, parseDuration } from './scrollMotion';

const WAIT_MS = 1500;
const STOP_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'];

// Id of the run in progress; any newer run or stop event bumps it.
let run = 0;
let finishRun = null;

/**
 * Stop the scroll animation in progress, if any; its onEnd still runs.
 */
export function stopScroll () {
  run++;
  finishRun?.();
}

/**
 * Scroll the window to a vertical position as M-24 describes.
 * @param {number} top Target scroll position in CSS px (clamped to the page).
 * @param {{ onEnd?: () => void, instant?: boolean }} [options] onEnd runs once when the scroll has ended or was
 *   stopped; instant jumps without motion.
 */
export function scrollToY (top, { onEnd, instant = false } = {}) {
  stopScroll();

  const root = document.documentElement;
  const style = getComputedStyle(root);
  const y0 = window.scrollY;
  const y1 = Math.max(0, Math.min(top, root.scrollHeight - window.innerHeight));
  const duration = parseDuration(style.getPropertyValue('--motion-duration-scroll'));
  const points = parseCubicBezier(style.getPropertyValue('--motion-easing-in-out'));
  let ended = false;

  /** Run onEnd once. */
  const end = () => {
    if (!ended) {
      ended = true;
      onEnd?.();
    }
  };

  if (Math.abs(y1 - y0) < 1 || instant || prefersReducedMotion()) {
    window.scrollTo({ top: y1, behavior: 'instant' });
    end();
    return;
  }

  if (!duration || !points) {
    window.addEventListener('scrollend', end, { once: true });
    window.scrollTo({ top: y1, behavior: 'smooth' });
    return;
  }

  const id = ++run;
  const ease = cubicBezier(...points);
  let written = y0;
  let start = 0;

  /** Remove the stop listeners and report the end of this run. */
  const finish = () => {
    STOP_EVENTS.forEach(type => window.removeEventListener(type, stopScroll, true));
    if (finishRun === finish) {
      finishRun = null;
    }
    end();
  };

  /**
   * One frame of the scroll.
   * @param {number} now Frame time.
   */
  const step = now => {
    if (id !== run) {
      return;
    }

    if (Math.abs(window.scrollY - written) > 1) {
      run++;
      finish();
      return;
    }

    start ||= now;

    const progress = Math.min(1, (now - start) / duration);

    window.scrollTo({ top: y0 + (y1 - y0) * ease(progress), behavior: 'instant' });
    written = window.scrollY;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      finish();
    }
  };

  finishRun = finish;
  STOP_EVENTS.forEach(type => window.addEventListener(type, stopScroll, { capture: true, passive: true }));
  requestAnimationFrame(step);
}

/**
 * Scroll to the top of the page (the bar logo on the home page, BEHAVIOR-SPEC
 * 59.4); the address and the focus stay where they are.
 */
export function scrollToTop () {
  scrollToY(0);
}

/**
 * Move focus to the heading of a section without scrolling: the next Tab
 * continues from there, as after a native jump to a fragment (the app routes
 * on the hash, so the fragment itself cannot hold the section id).
 * @param {HTMLElement} target Section or block the link points to.
 */
function focusHeading (target) {
  const heading = target.matches('h1, h2, h3') ? target : (target.querySelector('h1, h2, h3') ?? target);

  if (!heading.hasAttribute('tabindex')) {
    heading.setAttribute('tabindex', '-1');
  }

  heading.focus({ preventScroll: true });
}

/**
 * Scroll to a home page section by id: focus its heading first, then scroll so
 * the section lands under the bar (scroll-padding-top on html). When the
 * section is not on screen yet (another route), wait for the home page to
 * render it.
 * @param {string} id Section element id.
 * @param {{ onEnd?: () => void, instant?: boolean }} [options] onEnd runs when the scroll has ended (also when the
 *   section never appears); instant jumps without motion (opening the home page from another route).
 */
export function scrollToSection (id, { onEnd, instant = false } = {}) {
  const start = performance.now();

  /** Scroll once the section exists, retrying for up to WAIT_MS. */
  const attempt = () => {
    const el = document.getElementById(id);

    if (el) {
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;

      focusHeading(el);
      scrollToY(el.getBoundingClientRect().top + window.scrollY - padding, { onEnd, instant });
      return;
    }

    if (performance.now() - start < WAIT_MS) {
      requestAnimationFrame(attempt);
    } else {
      onEnd?.();
    }
  };

  // Let ScrollToTop run first after a route change.
  requestAnimationFrame(() => requestAnimationFrame(attempt));
}
