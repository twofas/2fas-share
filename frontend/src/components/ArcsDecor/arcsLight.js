// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Light on the background circles (Decor / arcs, BEHAVIOR-SPEC 50, MOTION
// M-19): the numbers and the rules of the three short runs, ported from
// handoff/background-arcs-light.html. No DOM here, so the rules are testable
// with node --test; ArcsDecor builds and plays the streaks.

/**
 * @typedef {object} Streak
 * @property {number} d - Diameter of the circle in the 1388 px drawing (ARCS).
 * @property {number} from - Head angle at the start, degrees clockwise from the top.
 * @property {number} to - Head angle at the end.
 * @property {number} start - Offset from the run start, ms.
 * @property {number} duration - Duration, ms.
 */

/**
 * @typedef {object} Run
 * @property {number} startDelay - Delay of the whole run, ms.
 * @property {number} [brightness] - Multiplier of the peak opacity.
 * @property {Streak[]} streaks - Streaks of the run.
 */

/**
 * Runs, from `RUNS` of the pattern. The tracks lie on the sides of the
 * circles (right 90-165°, left 200-270°), where no content covers them.
 * @type {Record<'entry'|'ready'|'cta', Run>}
 */
export const RUNS = {
  // Entering the page: three streaks 300 ms apart, alternating sides.
  entry: {
    startDelay: 600,
    streaks: [
      { d: 533, from: 104, to: 164, start: 0, duration: 2900 },
      { d: 1036, from: 206, to: 258, start: 300, duration: 3000 },
      { d: 1388, from: 98, to: 140, start: 600, duration: 3100 }
    ]
  },
  // Link ready or note revealed: faster and brighter, both sides at once.
  ready: {
    startDelay: 0,
    brightness: 1.25,
    streaks: [
      { d: 755, from: 200, to: 262, start: 0, duration: 2600 },
      { d: 1388, from: 100, to: 160, start: 150, duration: 2800 }
    ]
  },
  // Mouse hover on the main CTA: one short streak beside the window.
  cta: {
    startDelay: 0,
    streaks: [
      { d: 1036, from: 100, to: 150, start: 0, duration: 2200 }
    ]
  }
};

// Streak length: about 10 % of the circumference, at most about 300 px.
export const STREAK_ARC = 36;
export const STREAK_MAX_PX = 300;
// Peak opacity of the streak element; the token color has its own alpha.
export const STREAK_OPACITY = 0.8;
// Hover on the CTA starts a run at most once every 8 s.
export const CTA_COOLDOWN = 8000;
// WCAG 2.2.2 safety limit: no run lasts longer.
export const RUN_LIMIT = 4500;

/**
 * End of a run from its start, ms.
 * @param {Run} run - Run parameters.
 * @returns {number} Time of the last streak's end.
 */
export function runEnd (run) {
  return Math.max(...run.streaks.map(s => run.startDelay + s.start + s.duration));
}

/**
 * Peak opacity of a run's streaks ("ready" is brighter).
 * @param {Run} run - Run parameters.
 * @returns {number} Opacity, at most 1.
 */
export function peakOpacity (run) {
  return Math.min(1, STREAK_OPACITY * (run.brightness || 1));
}

/**
 * What a new run does against the one in progress: a deliberate action
 * ("ready") interrupts it, "entry" and "cta" do not start during another.
 * @param {string} name - Name of the run asked for.
 * @param {boolean} busy - Whether a run is in progress.
 * @returns {'start'|'interrupt'|'skip'} The decision.
 */
export function runDecision (name, busy) {
  if (!RUNS[name]) {
    return 'skip';
  }

  if (!busy) {
    return 'start';
  }

  return name === 'ready' ? 'interrupt' : 'skip';
}

/**
 * Whether the CTA cooldown has passed.
 * @param {number} now - Current time, ms.
 * @param {number} last - Time of the last CTA run, ms.
 * @returns {boolean} True when a CTA run may start.
 */
export function ctaReady (now, last) {
  return now - last >= CTA_COOLDOWN;
}

/**
 * Map the call of the earlier API (an options object or nothing) to a run
 * name: the throttled CTA hover meant "cta", a plain call meant "ready".
 * @param {string|{throttle?: boolean}} [arg] - Run name or legacy options.
 * @returns {string} Run name.
 */
export function runName (arg) {
  if (typeof arg === 'string') {
    return arg;
  }

  return arg?.throttle ? 'cta' : 'ready';
}

/**
 * Box of a streak: a small rectangle that covers only its arc. In the
 * rotor's coordinates (origin at the circle center) the head lies at 180°
 * (the bottom of the circle) and the tail reaches back by `arc` degrees.
 * @param {number} r - Circle radius in px.
 * @returns {{left: number, top: number, width: number, height: number, cx: number, cy: number, arc: number}} Box and the circle center inside it, px; arc in degrees.
 */
export function streakBox (r) {
  const arc = Math.min(STREAK_ARC, (STREAK_MAX_PX / r) * 180 / Math.PI);
  const t = arc * Math.PI / 180;
  const pad = 8;
  const left = -pad;
  const top = r * Math.cos(t) - pad;

  return {
    left,
    top,
    width: r * Math.sin(t) + 2 * pad,
    height: r * (1 - Math.cos(t)) + 2 * pad,
    cx: -left,
    cy: -top,
    arc
  };
}
