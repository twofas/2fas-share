// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// The hidden link engine (BEHAVIOR-SPEC 53, pattern A "signs in dust" of
// demo/link-ready.html): the character boxes of the address and one canvas of
// dust over the secret parts. While hidden the page holds no secret
// character: every box is empty and of one width, and the secret lives only
// in the `secret` array of this closure.

import { prefersReducedMotion } from '@/utils/reducedMotion';
import {
  TAU,
  arrivals,
  averageWidth,
  clamp01,
  easeInOut,
  easeOut,
  rnd,
  rippleReach,
  signStrokes,
  splitLink
} from './geometry';

// Numbers of the dust (BEHAVIOR-SPEC 53.3, 53.4; the demo defaults; no tokens).
const GRAINS = 18;
const GRAIN = 1.15;
const DRIFT = 1;
const CYCLE_MS = 1800;
const RIPPLE_MS = 450;
const JOIN = 0.9;
const ENTER_DELAY_MS = 480;
const ENTER_SPAN_MS = 520;
const ENTER_FADE_MS = 260;
const LETTER_FADE_MS = 180;
// The letter starts fading in 200 ms after the ripple reaches its box.
const LAND_MS = 200;
const DECODE_MS = 420;
const ENCODE_MS = 320;

/**
 * Font metrics of the link text, measured on a canvas.
 * @param {HTMLElement} text - The element with the link text.
 * @param {CanvasRenderingContext2D} meas - Measuring context.
 * @returns {{font: string, fa: number, fd: number, cap: number, xh: number}} Metrics.
 */
function fontMetrics (text, meas) {
  const cs = getComputedStyle(text);
  const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const fs = parseFloat(cs.fontSize);

  meas.font = font;
  const mH = meas.measureText('H');
  const mx = meas.measureText('x');

  return {
    font,
    fa: mH.fontBoundingBoxAscent || fs * 0.97,
    fd: mH.fontBoundingBoxDescent || fs * 0.24,
    cap: mH.actualBoundingBoxAscent || fs * 0.73,
    xh: mx.actualBoundingBoxAscent || fs * 0.55
  };
}

/**
 * Build the hidden link inside a field.
 * @param {object} options - Options.
 * @param {HTMLElement} options.field - The field (`Field / link`), the canvas covers it.
 * @param {HTMLElement} options.text - Empty element that receives the address.
 * @param {HTMLCanvasElement} options.canvas - Canvas over the text.
 * @param {string} options.link - The full link.
 * @param {string} options.hiddenSuffix - Text after the origin in the accessible name while hidden.
 * @param {(shown: boolean) => void} options.onChange - Called when the visibility changes.
 * @returns {{toggle: (show: boolean, origin: {x: number, y: number}) => void, shown: () => boolean, destroy: () => void}} Controller.
 */
export function createHiddenLink ({ field, text, canvas, link, hiddenSuffix, onChange }) {
  const { origin, parts } = splitLink(link);
  const secret = parts.flatMap((s, si) => Array.from(s, (c) => ({ c, si })));
  const ctx = canvas.getContext('2d');
  const meas = document.createElement('canvas').getContext('2d');
  const boxes = [];
  let visible = true;
  let alive = true;
  let raf = 0;
  let last = 0;
  let vt = 0;
  let chars = [];
  let W = 0;
  let H = 0;
  let dpr = 1;
  let rip = null;
  let shown = false;
  let entering = true;
  let clearTimer = 0;
  let wanted = false;

  // ── The address: origin, slashes and one empty box per secret character ──
  const pub = document.createElement('span');

  pub.className = 'pub';
  pub.textContent = origin;
  text.append(pub);
  parts.forEach((s, si) => {
    if (si) {
      const sep = document.createElement('span');

      sep.className = 'pub';
      sep.textContent = '/';
      text.append(sep);
    }

    for (let k = 0; k < s.length; k++) {
      const el = document.createElement('span');

      el.className = 'ch';
      text.append(el);
      boxes.push(el);
    }
  });

  /**
   * Hidden: every box has the average width of the link alphabet. Shown: the
   * boxes hold the real characters at their own widths.
   * @param {boolean} real - Real widths.
   */
  function sizeBoxes (real) {
    if (real) {
      boxes.forEach((el) => { el.style.inlineSize = ''; });
      return;
    }

    const cs = getComputedStyle(text);

    meas.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const avg = averageWidth((c) => meas.measureText(c).width).toFixed(2);

    boxes.forEach((el) => { el.style.inlineSize = `${avg}px`; });
  }

  /**
   * Write the secret into the boxes, or take it out again.
   * @param {boolean} on - Write it in.
   */
  function writeSecret (on) {
    boxes.forEach((el, i) => { el.textContent = on ? secret[i].c : ''; });
    text.setAttribute('aria-label', on ? link : `${origin} ${hiddenSuffix}`);
  }

  // ── Geometry ──
  /**
   * Boxes of the secret characters in field coordinates.
   * @returns {Array<object>} Box geometry with the baseline and the font.
   */
  function charBoxes () {
    const fr = field.getBoundingClientRect();
    const M = fontMetrics(text, meas);

    return boxes.map((el, i) => {
      const r = el.getBoundingClientRect();
      const top = r.top - fr.top;

      return {
        i,
        si: secret[i].si,
        x: r.left - fr.left,
        w: r.width,
        top,
        h: r.height,
        base: top + (r.height - (M.fa + M.fd)) / 2 + M.fa,
        xh: M.xh,
        cap: M.cap,
        font: M.font
      };
    });
  }

  /** Size the canvas to the field, device pixel ratio capped at 2. */
  function fit () {
    const r = field.getBoundingClientRect();

    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    W = r.width;
    H = r.height;
  }

  /**
   * The real letter shapes as pixel lists, one per box. Rasterised only on
   * reveal, never while the link is hidden.
   * @param {Array<object>} B - Character boxes.
   * @returns {Array<Array<[number, number]>>} Points per box.
   */
  function realPixels (B) {
    const off = document.createElement('canvas');

    off.width = Math.ceil(W);
    off.height = Math.ceil(H);
    const o = off.getContext('2d', { willReadFrequently: true });

    o.font = B[0].font;
    o.fillStyle = '#000';
    o.textBaseline = 'alphabetic';
    B.forEach((b) => o.fillText(secret[b.i].c, b.x, b.base));
    const img = o.getImageData(0, 0, off.width, off.height).data;
    const out = B.map((b) => {
      const pts = [];

      for (let y = Math.max(0, Math.floor(b.top)); y < Math.min(off.height, b.top + b.h); y++) {
        for (let x = Math.max(0, Math.floor(b.x)); x < Math.min(off.width, b.x + b.w + 1); x++) {
          if (img[(y * off.width + x) * 4 + 3] > 120) {
            pts.push([x + 0.5, y + 0.5]);
          }
        }
      }

      return pts;
    });

    off.width = 0;
    off.height = 0;
    return out;
  }

  // ── Clock and frame loop: sleeps off screen, in a hidden tab, with reduced motion ──
  /**
   * One frame.
   * @param {number} now - rAF time.
   */
  function tick (now) {
    vt += last ? Math.min(50, now - last) : 16;
    last = now;
    const more = draw();

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

  // ── Dust ──
  /**
   * Set the phase of a character's cycle.
   * @param {object} c - Character.
   * @param {string} ph - Phase.
   * @param {number} dur - Duration in ms.
   */
  function setPhase (c, ph, dur) {
    c.ph = ph;
    c.t0 = vt;
    c.dur = dur;
  }

  /** Fresh grains for every box, each character on its own random phase. */
  function layout () {
    fit();
    chars = charBoxes().map((c) => {
      const nJoin = Math.round(GRAINS * JOIN);

      c.grains = Array.from({ length: GRAINS }, (_, k) => ({
        join: k < nJoin,
        hx: c.x + 0.5 + Math.random() * Math.max(0, c.w - 1),
        hy: c.top + 5 + Math.random() * (c.h - 9),
        f1: TAU / rnd(2.5, 4.5),
        f2: TAU / rnd(2.5, 4.5),
        p1: rnd(0, TAU),
        p2: rnd(0, TAU),
        tf: TAU / rnd(1.4, 2.6),
        tp: rnd(0, TAU),
        s: rnd(0.8, 1.15),
        o: rnd(0.3, 1),
        tw: rnd(0.1, 0.3),
        tx: 0,
        ty: 0,
        x: 0,
        y: 0,
        fx: 0,
        fy: 0
      }));
      c.pend = null;
      // Signs start after the entrance, out of step.
      setPhase(c, 'cloud', rnd(0, CYCLE_MS * 0.5) + 1000);

      if (shown) {
        c.ph = 'gone';
      }

      return c;
    });
  }

  /**
   * Gather 90 % of a character's grains onto a new made-up sign.
   * @param {object} c - Character.
   */
  function newSign (c) {
    const strokes = signStrokes(c);
    const pts = [];
    const cum = [];
    let L = 0;

    strokes.forEach((s) => s.forEach((p, j) => {
      if (j) {
        L += Math.hypot(p[0] - s[j - 1][0], p[1] - s[j - 1][1]);
      }

      pts.push(p);
      cum.push(L);
    }));

    const joined = c.grains.filter((g) => g.join);

    joined.forEach((g, k) => {
      const u = (k + rnd(0.15, 0.85)) / joined.length * L;
      let j = 1;

      while (j < cum.length - 1 && cum[j] < u) {
        j++;
      }

      const [ax, ay] = pts[j - 1];
      const [bx, by] = pts[j];
      const d = Math.hypot(bx - ax, by - ay) || 1;
      const off = rnd(-0.45, 0.45);

      g.tx = Math.min(c.x + c.w - 0.3, Math.max(c.x + 0.3, ax - (by - ay) / d * off));
      g.ty = ay + (bx - ax) / d * off;
    });
  }

  /**
   * Next phase of the cycle: dust 8-20 %, gather 20 %, hold 36-48 %, loosen 18 %.
   * @param {object} c - Character.
   */
  function nextPhase (c) {
    if (c.ph === 'decode') {
      c.ph = 'gone';
    } else if (c.ph === 'cloud') {
      newSign(c);
      setPhase(c, 'form', CYCLE_MS * 0.2);
    } else if (c.ph === 'form') {
      setPhase(c, 'hold', CYCLE_MS * rnd(0.36, 0.48));
    } else if (c.ph === 'hold') {
      setPhase(c, 'release', CYCLE_MS * 0.18);
    } else {
      setPhase(c, 'cloud', CYCLE_MS * rnd(0.08, 0.2));
    }
  }

  /**
   * Draw one frame of the dust.
   * @returns {boolean} Whether another frame is needed.
   */
  function draw () {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // The text color, read once per frame: follows a theme change at once.
    ctx.fillStyle = getComputedStyle(text).color;

    if (entering && vt > ENTER_DELAY_MS + ENTER_SPAN_MS + ENTER_FADE_MS) {
      entering = false;
    }

    const tt = vt / 1000;

    for (const c of chars) {
      if (c.pend && vt >= c.pend.at) {
        const ph = c.pend.ph;

        c.pend = null;

        if (ph === 'decode' && (c.ph === 'wait' || c.ph === 'gone')) {
          c.ph = 'gone';
        } else {
          for (const g of c.grains) {
            g.fx = g.x;
            g.fy = g.y;
          }

          setPhase(c, ph, ph === 'decode' ? DECODE_MS : ENCODE_MS);
        }
      }

      while (c.ph !== 'gone' && c.ph !== 'wait' && vt - c.t0 >= c.dur) {
        nextPhase(c);
      }

      if (c.ph === 'gone' || c.ph === 'wait') {
        continue;
      }

      const p = clamp01((vt - c.t0) / c.dur);
      const since = vt - c.t0;
      const mSign = c.ph === 'form' ? easeInOut(p) : c.ph === 'hold' ? 1 : c.ph === 'release' ? 1 - easeInOut(p) : 0;

      for (const g of c.grains) {
        // Each grain keeps its own opacity (0.3 to 1) and breathes down by 10 to 30 %.
        let a = g.o * (1 - g.tw * (0.5 + 0.5 * Math.sin(tt * g.tf + g.tp)));
        let x;
        let y;

        if (c.ph === 'decode') {
          // Onto the real letter in 240 ms, then away (200 ms from 220 ms).
          const k = easeOut(Math.min(1, since / 240));

          x = g.fx + (g.rx - g.fx) * k;
          y = g.fy + (g.ry - g.fy) * k;
          a = Math.max(0.5, g.o) * 0.9 * Math.max(0, 1 - Math.max(0, since - 220) / 200);
        } else {
          const hx = g.hx + Math.sin(tt * g.f1 + g.p1) * DRIFT;
          const hy = g.hy + Math.cos(tt * g.f2 + g.p2) * DRIFT * 0.6;
          const m = g.join ? mSign : 0;
          const tx = g.tx + Math.sin(tt * 1.3 + g.p2) * 0.18;
          const ty = g.ty + Math.cos(tt * 1.1 + g.p1) * 0.18;

          x = hx + (tx - hx) * m;
          y = hy + (ty - hy) * m;
          // The sign stands out: its grains brighten by about a third, the loose ones of that box dim.
          a = g.join ? a + (Math.min(1, a * 1.3 + 0.12) - a) * m * 0.85 : a * (1 - 0.7 * mSign);

          if (c.ph === 'encode') {
            // Hide: the dust is reborn in place.
            a *= p;
          }
        }

        if (entering) {
          // Entrance: born left to right across the field from 480 ms over 520 ms.
          a *= clamp01((vt - ENTER_DELAY_MS - (g.hx / W) * ENTER_SPAN_MS) / ENTER_FADE_MS);
        }

        g.x = x;
        g.y = y;

        if (a <= 0.02) {
          continue;
        }

        const s = GRAIN * g.s;

        ctx.globalAlpha = a;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }

    if (rip && vt >= rip.end) {
      shown = rip.show;
      rip = null;

      if (shown) {
        for (const c of chars) {
          for (const g of c.grains) {
            g.rx = undefined;
            g.ry = undefined;
          }
        }
      }
    }

    return !(shown && !rip);
  }

  /** Reduced motion: one still frame of signs (nothing when shown). */
  function staticDraw () {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (shown) {
      return;
    }

    ctx.fillStyle = getComputedStyle(text).color;

    for (const c of chars) {
      newSign(c);

      for (const g of c.grains) {
        const s = GRAIN * g.s;

        ctx.globalAlpha = g.join ? Math.min(1, g.o * 1.3 + 0.12) : g.o * 0.4;
        ctx.fillRect((g.join ? g.tx : g.hx) - s / 2, (g.join ? g.ty : g.hy) - s / 2, s, s);
      }
    }
  }

  /**
   * Start the ripple of a reveal or a hide.
   * @param {boolean} show - Reveal (letters) or hide (dust).
   * @param {{x: number, y: number}} o - Origin in field coordinates.
   * @returns {number[]} Arrival time per box in ms.
   */
  function ripple (show, o) {
    if (!show) {
      // Equal boxes again, fresh grains.
      layout();
    }

    const B = charBoxes();
    const arrive = arrivals(B, o, W, H, RIPPLE_MS);

    if (prefersReducedMotion()) {
      shown = show;
      rip = null;
      chars.forEach((c) => {
        c.pend = null;
        c.ph = show ? 'gone' : 'cloud';
      });
      staticDraw();
      return arrive.map(() => 0);
    }

    if (show) {
      realPixels(B).forEach((pts, n) => chars[n].grains.forEach((g, k) => {
        const p = pts.length
          ? pts[Math.floor((k + Math.random()) * pts.length / chars[n].grains.length) % pts.length]
          : [B[n].x + B[n].w / 2, B[n].base - B[n].xh / 2];

        g.rx = p[0] + rnd(-0.3, 0.3);
        g.ry = p[1] + rnd(-0.3, 0.3);
      }));
    }

    chars.forEach((c, i) => {
      if (show) {
        c.pend = { ph: 'decode', at: vt + arrive[i] };
      } else {
        c.ph = 'wait';
        c.pend = { ph: 'encode', at: vt + arrive[i] };
      }
    });

    shown = false;
    rip = { show, max: rippleReach(o, W, H), end: vt + Math.max(...arrive) + (show ? 480 : 400) };
    kick();
    return arrive;
  }

  /**
   * Reveal or hide. During a ripple the other direction starts at once.
   * @param {boolean} show - Reveal.
   * @param {{x: number, y: number}} o - Ripple origin in field coordinates.
   */
  function toggle (show, o) {
    clearTimeout(clearTimer);
    entering = false;
    wanted = show;
    onChange(show);

    if (show) {
      // The real characters exist only from here on; each fades in when the
      // dust has turned into it.
      writeSecret(true);
      sizeBoxes(true);
      const arrive = ripple(true, o);

      boxes.forEach((el, i) => el.style.setProperty('--t', `${Math.round(arrive[i] + (prefersReducedMotion() ? 0 : LAND_MS))}ms`));
      void text.offsetWidth;
      text.dataset.shown = 'true';
    } else {
      // All letters go at once (180 ms), then the boxes return to equal width
      // and the dust comes back by a ripple from the eye.
      boxes.forEach((el) => el.style.setProperty('--t', '0ms'));
      delete text.dataset.shown;

      /** Take the letters out and bring the dust back. */
      const done = () => {
        writeSecret(false);
        sizeBoxes(false);
        ripple(false, o);
      };

      if (prefersReducedMotion()) {
        done();
      } else {
        clearTimer = setTimeout(done, LETTER_FADE_MS);
      }
    }
  }

  /** Redraw for the current settings: the loop, or the still frame. */
  function refresh () {
    if (prefersReducedMotion()) {
      staticDraw();
    } else {
      kick();
    }
  }

  // ── Start: hidden, with the entrance ──
  writeSecret(false);
  sizeBoxes(false);
  layout();
  refresh();

  // A new field WIDTH rebuilds the dust (a ripple in progress jumps to its end
  // state); a change of height only refits the canvas.
  let lastW = field.clientWidth;
  const ro = new ResizeObserver(() => {
    const w = field.clientWidth;

    if (w === lastW || shown) {
      lastW = w;
      fit();

      if (!shown && !rip && prefersReducedMotion()) {
        staticDraw();
      }

      return;
    }

    lastW = w;

    if (rip) {
      const show = rip.show;

      rip = null;
      shown = show;

      if (show) {
        chars.forEach((c) => {
          c.ph = 'gone';
          c.pend = null;
        });
        fit();
        return;
      }
    }

    layout();
    refresh();
  });

  ro.observe(field);

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    kick();
  });

  io.observe(field);

  /** The tab came back: wake the loop. */
  const onVisibility = () => {
    kick();
  };
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colorQuery = window.matchMedia('(prefers-color-scheme: dark)');
  /** Reduced motion read live: a still frame, or the loop again. */
  const onMotion = () => {
    if (rip) {
      shown = rip.show;
      rip = null;
      chars.forEach((c) => {
        c.pend = null;
        c.ph = shown ? 'gone' : 'cloud';
      });
    }

    refresh();
  };
  /** Theme change: the still frame is redrawn in the new text color. */
  const onTheme = () => {
    requestAnimationFrame(() => {
      if (prefersReducedMotion()) {
        staticDraw();
      }
    });
  };

  document.addEventListener('visibilitychange', onVisibility);
  motionQuery.addEventListener('change', onMotion);
  colorQuery.addEventListener('change', onTheme);
  window.addEventListener('themechange', onTheme);

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
      clearTimeout(clearTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotion);
      colorQuery.removeEventListener('change', onTheme);
      window.removeEventListener('themechange', onTheme);
      text.replaceChildren();
    }
  };
}
