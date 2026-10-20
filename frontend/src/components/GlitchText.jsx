// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef, useEffect } from 'preact/hooks';
import { prefersReducedMotion } from '@/utils/reducedMotion';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/:?#.=-_~&%+@';
const IDLE_MS = 90;
const REVEAL_STAGGER = 28;
const REVEAL_CYCLES = 5;
const REVEAL_MS = 35;

/**
 * Pick a random character from a string.
 * @param {string} set - Character pool.
 * @returns {string} A single random character.
 */
function rand(set) {
  return set[Math.floor(Math.random() * set.length)];
}

/**
 * Calculate the length of the URL origin prefix (protocol + host + trailing slash).
 * Characters within this prefix are never scrambled by the glitch effect.
 * @param {string} text - The full URL text.
 * @returns {number} Length of the prefix to skip in glitch animation.
 */
function getPrefixLength(text) {
  try {
    const url = new URL(text);
    const prefix = url.origin + '/';

    if (text.startsWith(prefix)) {
      return prefix.length;
    }

    return 0;
  } catch {
    return 0;
  }
}

/**
 * Build a fresh chars array for animation.
 * @param {string} displayText - Text to render.
 * @param {number} prefixLen - Number of leading chars to lock (domain prefix).
 * @returns {Array<Object>} Character state objects.
 */
function buildChars(displayText, prefixLen = 0) {
  return Array.from(displayText, (ch, i) => ({
    real: ch,
    cur: i < prefixLen ? ch : rand(CHARS),
    locked: i < prefixLen,
    lockAt: 0,
    cycles: 0,
    timer: 0,
    gAlpha: 0,
    gOff: 0
  }));
}

/**
 * Read the theme text colour from the design tokens.
 * @returns {string} CSS colour of --theme-text-primary.
 */
function readTextColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--theme-text-primary').trim() || 'currentColor';
}

/**
 * Split the text into lines that fit the available width. A line prefers to
 * break after a "/" in its second half, otherwise it breaks between any two
 * characters (a URL has no spaces).
 * @param {string} text - Full text.
 * @param {number[]} widths - Width of every character.
 * @param {number} availW - Available width in px.
 * @returns {Array<{start: number, end: number}>} Character ranges per line.
 */
function wrapLines(text, widths, availW) {
  const lines = [];
  let start = 0;

  while (start < text.length) {
    let w = 0;
    let end = start;

    while (end < text.length && (w + widths[end] <= availW || end === start)) {
      w += widths[end];
      end++;
    }

    if (end < text.length) {
      const slash = text.lastIndexOf('/', end - 1);

      if (slash >= start && slash - start >= (end - start) / 2) {
        end = slash + 1;
      }
    }

    lines.push({ start, end });
    start = end;
  }

  return lines;
}

/**
 * Canvas-based glitch-scramble text effect.
 * Fills its parent width and wraps onto as many lines as the text needs,
 * using the font of the parent element. Reacts to resizes through a
 * ResizeObserver and follows the theme colour (--theme-text-primary).
 * @param {Object} props
 * @param {string} props.text - The text to display.
 * @param {boolean} props.revealed - Whether to show the real text.
 * @returns {import('preact').JSX.Element} A canvas element.
 */
export default function GlitchText({ text, revealed }) {
  const canvasRef = useRef(null);
  const state = useRef(null);
  const isReduced = prefersReducedMotion();

  // Initialise canvas, ResizeObserver and render loop
  useEffect(() => {
    if (isReduced) {
      return;
    }

    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;

    if (!canvas || !parent || !text) {
      return;
    }

    const ctx = canvas.getContext('2d');
    const dpr = Math.max(devicePixelRatio || 1, 1);
    const prefixLen = getPrefixLength(text);

    /**
     * Resize the canvas to the parent, measure the font and rebuild the lines.
     */
    function layout() {
      const availW = parent.clientWidth;

      if (availW <= 0) {
        return;
      }

      const cs = getComputedStyle(parent);
      const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const fontSize = parseFloat(cs.fontSize) || 16;
      const lineH = parseFloat(cs.lineHeight) || Math.round(fontSize * 1.5);

      ctx.font = font;
      const widths = Array.from(text, (ch) => ctx.measureText(ch).width);
      const lines = wrapLines(text, widths, availW);
      const h = lines.length * lineH;

      canvas.width = Math.ceil(availW * dpr);
      canvas.height = Math.ceil(h * dpr);
      canvas.style.width = `${availW}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const pos = [];

      lines.forEach(({ start, end }, row) => {
        let x = 0;

        for (let i = start; i < end; i++) {
          pos[i] = { x, y: row * lineH + lineH / 2 };
          x += widths[i];
        }
      });

      const wasHovered = state.current?.hovered || false;
      const chars = buildChars(text, prefixLen);

      if (wasHovered) {
        chars.forEach((c) => {
          c.locked = true;
          c.cur = c.real;
        });
      }

      const blurVal = wasHovered ? 0 : 1.5;
      state.current = { chars, pos, w: availW, h, font, hovered: wasHovered, last: 0, prefixLen, blur: blurVal, targetBlur: blurVal, textColor: readTextColor() };
    }

    /**
     * Re-read the theme colour after a theme change.
     */
    function syncColor() {
      if (state.current) {
        state.current.textColor = readTextColor();
      }
    }

    layout();

    const ro = new ResizeObserver(() => layout());
    ro.observe(parent);

    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', syncColor);
    window.addEventListener('themechange', syncColor);

    const mo = new MutationObserver(syncColor);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let raf;

    /**
     * Animation frame callback — draws every character.
     * @param {number} now - Current timestamp from rAF.
     */
    function draw(now) {
      const s = state.current;

      if (!s) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const dt = now - (s.last || now);
      s.last = now;

      // Animate blur toward target (smooth exponential ease)
      if (s.blur !== s.targetBlur) {
        const t = 1 - Math.exp(-dt * 0.012);
        s.blur += (s.targetBlur - s.blur) * t;

        if (Math.abs(s.blur - s.targetBlur) < 0.01) {
          s.blur = s.targetBlur;
        }
      }

      ctx.clearRect(0, 0, s.w, s.h);
      ctx.font = s.font;
      ctx.textBaseline = 'middle';

      // Prefix chars are never blurred; non-prefix chars blur when s.blur > 0
      ctx.filter = s.prefixLen > 0 ? 'none' : (s.blur > 0 ? `blur(${s.blur}px)` : 'none');

      for (let i = 0; i < s.chars.length; i++) {
        if (i === s.prefixLen && s.prefixLen > 0) {
          ctx.filter = s.blur > 0 ? `blur(${s.blur}px)` : 'none';
        }
        const c = s.chars[i];
        const { x, y } = s.pos[i];

        c.timer += dt;

        if (s.hovered) {
          if (!c.locked && now >= c.lockAt) {
            if (c.timer >= REVEAL_MS) {
              c.timer = 0;
              c.cycles--;
              c.cur = rand(CHARS);

              if (c.cycles <= 0) {
                c.locked = true;
                c.cur = c.real;
                c.gAlpha = 0.6;
                c.gOff = (Math.random() - 0.5) * 2;
              }
            }
          } else if (!c.locked && c.timer >= IDLE_MS) {
            c.timer = 0;
            c.cur = rand(CHARS);
          }
        } else {
          if (!c.locked && c.timer >= IDLE_MS) {
            c.timer = 0;
            c.cur = rand(CHARS);
          }
        }

        if (c.gAlpha > 0) {
          c.gAlpha = Math.max(0, c.gAlpha - dt * 0.005);
        }

        const isPrefix = i < s.prefixLen;
        const shown = isPrefix || (s.hovered && c.locked);

        // RGB glitch ghosts
        if (c.gAlpha > 0) {
          ctx.globalAlpha = c.gAlpha * 0.35;
          ctx.fillStyle = '#ff5a78';
          ctx.fillText(c.cur, x + c.gOff + 1, y);
          ctx.fillStyle = '#50a0ff';
          ctx.fillText(c.cur, x + c.gOff - 1, y);
        }

        ctx.globalAlpha = shown ? 1 : 0.4;
        ctx.fillStyle = s.textColor;

        if (shown) {
          ctx.shadowColor = 'rgba(120, 240, 200, 0.2)';
          ctx.shadowBlur = 5;
        }

        ctx.fillText(c.cur, x, y);
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      }

      ctx.globalAlpha = 1;
      ctx.filter = 'none';
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      mq.removeEventListener('change', syncColor);
      window.removeEventListener('themechange', syncColor);
    };
  }, [text]);

  // React to revealed prop changes
  useEffect(() => {
    if (isReduced) {
      return;
    }

    const s = state.current;
    const canvas = canvasRef.current;

    if (!s || !canvas) {
      return;
    }

    const now = performance.now();

    if (revealed) {
      s.hovered = true;
      s.targetBlur = 0;
      s.chars.forEach((c, i) => {
        if (i < s.prefixLen) {
          return;
        }

        c.locked = false;
        c.lockAt = now + (i - s.prefixLen) * REVEAL_STAGGER;
        c.cycles = REVEAL_CYCLES + Math.floor(Math.random() * 2);
        c.timer = 0;
      });
    } else {
      s.hovered = false;
      s.targetBlur = 1.5;
      s.chars.forEach((c, i) => {
        if (i < s.prefixLen) {
          return;
        }

        c.locked = false;
        c.timer = 0;
      });
    }
  }, [revealed, text]);

  if (isReduced) {
    return (
      <span
        style={{
          overflowWrap: 'anywhere',
          opacity: revealed ? 1 : 0.4,
          filter: revealed ? 'none' : 'blur(1.5px)'
        }}
        role='img'
        aria-label={text}
      >
        {text}
      </span>
    );
  }

  return <canvas ref={canvasRef} role='img' aria-label={text}>{text}</canvas>;
}
