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
 * @param {string} displayText - Text to render (may include trailing "...").
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
 * Compute visible text, truncating with "..." if needed.
 * @param {string} text - Full text.
 * @param {number} maxChars - Maximum characters that fit.
 * @returns {string} Text to display.
 */
function truncate(text, maxChars) {
  if (text.length <= maxChars) {
    return text;
  }

  const keep = Math.max(0, maxChars - 3);
  return text.slice(0, keep) + '...';
}

/**
 * Canvas-based glitch-scramble text effect.
 * Fills its parent width; truncates with "..." when the URL
 * is too long. Reacts to window resize via ResizeObserver.
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
    const fontSize = 12;
    const font = `400 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    const padY = Math.round(fontSize * 0.25);
    const h = fontSize + padY * 2;

    // Measure average char width (before any canvas resize resets ctx)
    ctx.font = font;
    const charW = ctx.measureText(text).width / text.length;

    const prefixLen = getPrefixLength(text);

    /**
     * Resize canvas to fit parent and rebuild visible chars.
     */
    function layout() {
      const availW = parent.clientWidth;

      if (availW <= 0) {
        return;
      }

      const maxChars = Math.floor(availW / charW);
      const displayText = truncate(text, maxChars);
      const visiblePrefix = Math.min(prefixLen, displayText.length);

      canvas.width = Math.ceil(availW * dpr);
      canvas.height = Math.ceil(h * dpr);
      canvas.style.width = `${availW}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const wasHovered = state.current?.hovered || false;
      const chars = buildChars(displayText, visiblePrefix);

      if (wasHovered) {
        chars.forEach((c) => {
          c.locked = true;
          c.cur = c.real;
        });
      }

      const blurVal = wasHovered ? 0 : 1.5;
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--2fas-text-color').trim();
      state.current = { chars, charW, w: availW, h, font, hovered: wasHovered, last: 0, prefixLen: visiblePrefix, blur: blurVal, targetBlur: blurVal, textColor };
    }

    layout();

    const ro = new ResizeObserver(() => layout());
    ro.observe(parent);

    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', layout);

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
      const y = s.h / 2;

      // Prefix chars are never blurred; non-prefix chars blur when s.blur > 0
      ctx.filter = s.prefixLen > 0 ? 'none' : (s.blur > 0 ? `blur(${s.blur}px)` : 'none');

      for (let i = 0; i < s.chars.length; i++) {
        if (i === s.prefixLen && s.prefixLen > 0) {
          ctx.filter = s.blur > 0 ? `blur(${s.blur}px)` : 'none';
        }
        const c = s.chars[i];
        const x = i * s.charW;

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
      mq.removeEventListener('change', layout);
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
          font: '400 12px ui-monospace, SFMono-Regular, Menlo, monospace',
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
