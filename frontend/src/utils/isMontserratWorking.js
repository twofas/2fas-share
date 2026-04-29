// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Check if Montserrat is loaded and its weight axis renders correctly.
 * Compares glyph widths at weight 400 vs 800 — if identical, the font
 * is stuck at a single weight (broken). Also checks against monospace
 * to verify Montserrat is actually rendering (not just falling through).
 * @returns {boolean} Whether Montserrat renders with working font weights
 */
export function isMontserratWorking () {
  const el = document.createElement('span');
  el.textContent = 'BESbswy';
  el.style.cssText = 'position:absolute;left:-9999px;visibility:hidden;font-size:300px';
  document.body.appendChild(el);

  el.style.fontFamily = 'monospace';
  el.style.fontWeight = '400';
  const mono = el.offsetWidth;

  el.style.fontFamily = "'Montserrat', monospace";
  el.style.fontWeight = '400';
  const w400 = el.offsetWidth;
  el.style.fontWeight = '800';
  const w800 = el.offsetWidth;

  el.remove();

  return w400 !== mono && w400 !== w800;
}
