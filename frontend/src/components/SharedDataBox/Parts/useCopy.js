// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useEffect, useContext } from 'preact/hooks';
import { AnnounceContext } from './context';

export const COPIED_MS = 2000;

/**
 * Clipboard copy with a "copied" flag that resets after 2 s; the message is
 * announced in the page role="status" region (no focus move, no toast).
 * @param {string} value - Text to copy.
 * @param {string} [message] - Text announced after a successful copy.
 * @returns {[boolean, function(): Promise<void>]} The copied flag and the copy handler.
 */
export default function useCopy (value, message) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const announce = useContext(AnnounceContext);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  /**
   * Copy the value to the clipboard.
   */
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      if (message) {
        announce(message, COPIED_MS);
      }

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS context)
    }
  };

  return [copied, copy];
}
