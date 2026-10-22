// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useEffect, useState } from 'preact/hooks';
import { prefersReducedMotion } from '@/utils/reducedMotion';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/:?#.=-_~&%+@';
const TICK_MS = 35;
const REVEAL_CYCLES = 4;
const MAX_STAGGER_MS = 28;
const MAX_REVEAL_MS = 700;

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

    return text.startsWith(prefix) ? prefix.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Scrambled frame of the text at a given time: the prefix stays, every other
 * character settles on its real value one after another.
 * @param {string} text - Full text.
 * @param {number} prefixLen - Number of leading characters that never scramble.
 * @param {number} stagger - Delay between two characters settling, in ms.
 * @param {number} elapsed - Time since the reveal started, in ms.
 * @returns {Array<{ch: string, settled: boolean}>} One entry per character.
 */
function frame(text, prefixLen, stagger, elapsed) {
  return Array.from(text, (ch, i) => {
    const settled = i < prefixLen || elapsed >= (i - prefixLen) * stagger + REVEAL_CYCLES * TICK_MS;

    return { ch: settled ? ch : rand(CHARS), settled };
  });
}

/**
 * Link text with a short glitch reveal when it appears: the characters after
 * the origin scramble and settle left to right in under a second, then the
 * plain text stays. The text is readable, selectable and read as text by a
 * screen reader the whole time (the scrambled frames are aria-hidden).
 * Reduced motion shows the plain text straight away.
 * @param {Object} props
 * @param {string} props.text - The text to display.
 * @returns {import('preact').JSX.Element} The text.
 */
export default function GlitchText({ text }) {
  const [chars, setChars] = useState(null);

  useEffect(() => {
    if (!text || prefersReducedMotion()) {
      setChars(null);
      return;
    }

    const prefixLen = getPrefixLength(text);
    const stagger = Math.min(MAX_STAGGER_MS, MAX_REVEAL_MS / Math.max(1, text.length - prefixLen));
    const start = performance.now();
    let timer;

    const tick = () => {
      const next = frame(text, prefixLen, stagger, performance.now() - start);

      if (next.every(c => c.settled)) {
        setChars(null);
        return;
      }

      setChars(next);
      timer = setTimeout(tick, TICK_MS);
    };

    tick();

    return () => clearTimeout(timer);
  }, [text]);

  if (!chars) {
    return <span>{text}</span>;
  }

  return (
    <span>
      <span aria-hidden='true'>
        {chars.map(({ ch, settled }, i) => (
          <span key={i} style={settled ? undefined : { opacity: 0.4 }}>{ch}</span>
        ))}
      </span>
      <span className='visually-hidden'>{text}</span>
    </span>
  );
}
