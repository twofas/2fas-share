// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Pure helpers of the anchor scroll (MOTION M-24): read the motion tokens as
// the stylesheet gives them and turn the curve into an easing function.

/**
 * Parse a CSS time ("800ms", "0.8s") into milliseconds.
 * @param {string} value Computed value of a duration token.
 * @returns {number} Milliseconds, 0 when the value is missing or not a time.
 */
export function parseDuration (value) {
  const match = /^([\d.]+)(ms|s)$/.exec(String(value ?? '').trim());

  if (!match) {
    return 0;
  }

  const amount = parseFloat(match[1]);

  return Number.isFinite(amount) ? amount * (match[2] === 's' ? 1000 : 1) : 0;
}

/**
 * Parse a cubic-bezier() curve into its four control values.
 * @param {string} value Computed value of an easing token.
 * @returns {[number, number, number, number]|null} x1, y1, x2, y2, or null when the value is not a cubic-bezier().
 */
export function parseCubicBezier (value) {
  const match = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/
    .exec(String(value ?? ''));

  if (!match) {
    return null;
  }

  const points = match.slice(1).map(Number);

  return points.every(Number.isFinite) ? points : null;
}

/**
 * Easing function of a cubic Bézier curve, solved for progress the way browser
 * engines do it: Newton's method, with bisection when it does not converge.
 * @param {number} x1 First control point, x.
 * @param {number} y1 First control point, y.
 * @param {number} x2 Second control point, x.
 * @param {number} y2 Second control point, y.
 * @returns {(x: number) => number} Eased progress for a time progress from 0 to 1.
 */
export function cubicBezier (x1, y1, x2, y2) {
  /**
   * One coordinate of the curve at parameter t.
   * @param {number} t Curve parameter, 0 to 1.
   * @param {number} p1 First control value of that coordinate.
   * @param {number} p2 Second control value of that coordinate.
   * @returns {number} The coordinate.
   */
  const curve = (t, p1, p2) => 3 * p1 * t * (1 - t) * (1 - t) + 3 * p2 * t * t * (1 - t) + t * t * t;

  /**
   * Derivative of curve() with respect to t.
   * @param {number} t Curve parameter, 0 to 1.
   * @param {number} p1 First control value of that coordinate.
   * @param {number} p2 Second control value of that coordinate.
   * @returns {number} The slope.
   */
  const slope = (t, p1, p2) => 3 * p1 * (1 - t) * (1 - t) + 6 * (p2 - p1) * t * (1 - t) + 3 * (1 - p2) * t * t;

  return x => {
    if (x <= 0) {
      return 0;
    }

    if (x >= 1) {
      return 1;
    }

    let t = x;

    for (let i = 0; i < 8; i++) {
      const d = slope(t, x1, x2);

      if (Math.abs(d) < 1e-6) {
        break;
      }

      t -= (curve(t, x1, x2) - x) / d;
    }

    if (!(t >= 0 && t <= 1) || Math.abs(curve(t, x1, x2) - x) > 1e-5) {
      let lo = 0;
      let hi = 1;

      t = x;

      for (let i = 0; i < 30; i++) {
        if (curve(t, x1, x2) < x) {
          lo = t;
        } else {
          hi = t;
        }

        t = (lo + hi) / 2;
      }
    }

    return curve(t, y1, y2);
  };
}
