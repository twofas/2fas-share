// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

/**
 * Copy failed (BEHAVIOR-SPEC 57): focus the field first, then select its
 * text, so Ctrl+C or ⌘C works at once. A textarea or an input selects
 * itself; any other element (a div with tabindex="-1") gets focus and its
 * text node is selected with a Range.
 * @param {HTMLElement|null} field - The element that takes focus.
 * @param {HTMLElement|null} [content] - The element whose text is selected; the field by default.
 */
export function selectContent (field, content = field) {
  if (!field) {
    return;
  }

  field.focus();

  if (typeof field.select === 'function') {
    field.select();
    return;
  }

  if (!content) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(content);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
