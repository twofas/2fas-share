// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Timings of the view changes in Recipient / window, from the motion tokens
// (MOTION.md M-28, M-33, M-35). Pure functions; the component reads the
// tokens with getComputedStyle and passes them in.

/** Token names read from :root, keyed by the name used here. */
export const MOTION_TOKENS = {
  layout: '--motion-duration-layout',
  toggle: '--motion-duration-toggle',
  reveal: '--motion-duration-reveal',
  standard: '--motion-easing-standard',
  out: '--motion-easing-out'
};

/**
 * A CSS time ("480ms", "0.48s") in milliseconds.
 * @param {string} value - Computed value of a duration token.
 * @returns {number} Milliseconds; 0 for an empty or unknown value.
 */
export function parseDuration (value) {
  const text = String(value || '').trim();
  const number = parseFloat(text);

  if (Number.isNaN(number)) {
    return 0;
  }

  if (text.endsWith('ms')) {
    return number;
  }

  return text.endsWith('s') ? number * 1000 : 0;
}

/**
 * Phases of a change of view in the window.
 * M-33 (reveal: Intro or Password to Revealed): the old content goes out in
 * the first part of `layout` (layout minus toggle, 160 ms), the window takes
 * the new height in `layout` `standard`, the content fades in over `reveal`
 * on `out`, together with the height. M-28 (every other change): 160 ms out,
 * the new height and the content entering in `toggle` (320 ms) with an 8 px
 * rise, all `standard`.
 * @param {{ layout: number, toggle: number, reveal: number, standard: string, out: string }} tokens - Durations in ms and curves.
 * @param {boolean} reveal - Whether the change reveals the note (M-33).
 * @returns {{ outMs: number, heightMs: number, inMs: number, outEasing: string, heightEasing: string, inEasing: string, rise: boolean }} Phases.
 */
export function viewChangeTimings (tokens, reveal) {
  const outMs = Math.max(0, tokens.layout - tokens.toggle);

  if (reveal) {
    return {
      outMs,
      heightMs: tokens.layout,
      inMs: tokens.reveal,
      outEasing: tokens.standard,
      heightEasing: tokens.standard,
      inEasing: tokens.out,
      rise: false
    };
  }

  return {
    outMs,
    heightMs: tokens.toggle,
    inMs: tokens.toggle,
    outEasing: tokens.standard,
    heightEasing: tokens.standard,
    inEasing: tokens.standard,
    rise: true
  };
}

/**
 * Read the motion tokens from the root element.
 * @param {Element} [root=document.documentElement] - Element whose computed style holds the tokens.
 * @returns {{ layout: number, toggle: number, reveal: number, standard: string, out: string }} Durations in ms and curves.
 */
export function readMotionTokens (root = document.documentElement) {
  const style = getComputedStyle(root);

  /**
   * Computed value of one token.
   * @param {keyof MOTION_TOKENS} name - Short token name.
   * @returns {string} The value.
   */
  const value = (name) => style.getPropertyValue(MOTION_TOKENS[name]).trim();

  return {
    layout: parseDuration(value('layout')),
    toggle: parseDuration(value('toggle')),
    reveal: parseDuration(value('reveal')),
    standard: value('standard') || 'ease',
    out: value('out') || 'ease-out'
  };
}
