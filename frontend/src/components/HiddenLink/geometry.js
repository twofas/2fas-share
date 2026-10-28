// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Pure helpers of the hidden link (BEHAVIOR-SPEC 53): splitting the address,
// curves, ripple arrival times and the made-up signs of the dust. Nothing here
// touches the DOM, so it runs under `node --test`.

/** The URL-safe Base64 alphabet, the characters the secret parts are made of. */
export const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export const TAU = Math.PI * 2;

/**
 * Split a share link into the visible origin and the secret parts.
 * `https://share.2fas.com/#/id/type/nonce/key` gives the origin
 * `https://share.2fas.com/#/` and the four parts; the slashes between the
 * parts stay visible.
 * @param {string} link - The full share link.
 * @returns {{origin: string, parts: string[]}} Visible origin and the secret parts.
 */
export function splitLink (link) {
  const hash = link.indexOf('#/');
  let cut = hash >= 0 ? hash + 2 : -1;

  if (cut < 0) {
    const scheme = link.indexOf('://');
    const slash = link.indexOf('/', scheme >= 0 ? scheme + 3 : 0);

    cut = slash >= 0 ? slash + 1 : link.length;
  }

  const rest = link.slice(cut);

  return { origin: link.slice(0, cut), parts: rest ? rest.split('/') : [] };
}

/**
 * Average advance width of the Base64url alphabet: the one width of every
 * empty character box while the link is hidden.
 * @param {(ch: string) => number} measure - Width of one character in the link font.
 * @returns {number} Average width in px.
 */
export function averageWidth (measure) {
  let sum = 0;

  for (const ch of BASE64URL) {
    sum += measure(ch);
  }

  return sum / BASE64URL.length;
}

/**
 * Clamp to 0..1.
 * @param {number} x - Value.
 * @returns {number} Clamped value.
 */
export const clamp01 = (x) => Math.min(1, Math.max(0, x));

/**
 * Cubic ease-out (the `motion/easing/out` family).
 * @param {number} x - Progress 0..1.
 * @returns {number} Eased progress.
 */
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);

/**
 * Cubic ease-in-out (the `motion/easing/in-out` family).
 * @param {number} x - Progress 0..1.
 * @returns {number} Eased progress.
 */
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/**
 * A random number in a range.
 * @param {number} a - Lower bound.
 * @param {number} b - Upper bound.
 * @param {() => number} [random] - Source of randomness.
 * @returns {number} A value in [a, b).
 */
export const rnd = (a, b, random = Math.random) => a + random() * (b - a);

/**
 * Distance from a point to the farthest corner of a box, plus a margin: the
 * radius at which a ripple from that point has covered the whole field.
 * @param {{x: number, y: number}} o - Ripple origin.
 * @param {number} w - Field width.
 * @param {number} h - Field height.
 * @returns {number} Radius in px.
 */
export function rippleReach (o, w, h) {
  return Math.max(...[[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => Math.hypot(x - o.x, y - o.y))) + 20;
}

/**
 * When the ripple reaches each character box: the radius grows on the cubic
 * ease-out curve, so the arrival time is the inverse of that curve.
 * @param {Array<{x: number, w: number, top: number, h: number}>} boxes - Character boxes.
 * @param {{x: number, y: number}} o - Ripple origin, in field coordinates.
 * @param {number} w - Field width.
 * @param {number} h - Field height.
 * @param {number} duration - Ripple duration in ms.
 * @returns {number[]} Arrival time in ms per box.
 */
export function arrivals (boxes, o, w, h, duration) {
  const max = rippleReach(o, w, h);

  return boxes.map((b) => {
    const d = Math.min(1, Math.hypot(b.x + b.w / 2 - o.x, b.top + b.h / 2 - o.y) / max);

    return duration * (1 - Math.cbrt(1 - d));
  });
}

/**
 * A made-up sign for a character box: 1 to 3 strokes walked over a grid of 2
 * to 3 columns × 3 to 5 rows (x-height, middle, baseline, sometimes an
 * ascender or a descender), each segment bowed a little, sampled every 0.5 px.
 * The sign never depends on the real character.
 * @param {{x: number, w: number, base: number, xh: number, cap: number}} c - Box geometry.
 * @param {() => number} [random] - Source of randomness.
 * @returns {Array<Array<[number, number]>>} Strokes as point lists.
 */
export function signStrokes (c, random = Math.random) {
  const pad = Math.min(1.6, c.w * 0.16);
  const slim = random() < 0.3;
  const xs = slim ? [c.x + c.w * 0.3, c.x + c.w * 0.7] : [c.x + pad, c.x + c.w / 2, c.x + c.w - pad];
  const up = random() < 0.3;
  const down = !up && random() < 0.22;
  const ys = [];

  if (up) {
    ys.push(c.base - c.cap);
  }

  ys.push(c.base - c.xh, c.base - c.xh / 2, c.base);

  if (down) {
    ys.push(c.base + c.xh * 0.42);
  }

  const grid = xs.map((x) => ys.map((y) => [x + rnd(-0.5, 0.5, random), y + rnd(-0.6, 0.6, random)]));
  const walks = [];

  /**
   * Walk the grid to neighbouring points, never straight back.
   * @param {number} steps - Number of segments.
   */
  const walk = (steps) => {
    let ci = Math.floor(random() * xs.length);
    let ri = Math.floor(random() * ys.length);
    let prev = null;
    const pts = [grid[ci][ri]];

    for (let s = 0; s < steps; s++) {
      const opts = [];

      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          const nc = ci + dc;
          const nr = ri + dr;

          if ((dc || dr) && nc >= 0 && nc < xs.length && nr >= 0 && nr < ys.length && !(prev && prev[0] === nc && prev[1] === nr)) {
            opts.push([nc, nr]);
          }
        }
      }

      const [nc, nr] = opts[Math.floor(random() * opts.length)];

      prev = [ci, ri];
      ci = nc;
      ri = nr;
      pts.push(grid[ci][ri]);
    }

    walks.push(pts);
  };

  walk(2 + Math.floor(random() * 3));

  if (random() < 0.55) {
    walk(1 + Math.floor(random() * 2));
  }

  return walks.map((s) => {
    const bow = random() < 0.6 ? rnd(-0.32, 0.32, random) : 0;
    const out = [];

    for (let k = 0; k < s.length - 1; k++) {
      const [ax, ay] = s[k];
      const [bx, by] = s[k + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const mx = (ax + bx) / 2 - dy * bow;
      const my = (ay + by) / 2 + dx * bow;
      const n = Math.max(2, Math.ceil(Math.hypot(dx, dy) / 0.5));

      for (let j = k ? 1 : 0; j <= n; j++) {
        const t = j / n;
        const u = 1 - t;

        out.push([u * u * ax + 2 * u * t * mx + t * t * bx, u * u * ay + 2 * u * t * my + t * t * by]);
      }
    }

    return out;
  });
}

