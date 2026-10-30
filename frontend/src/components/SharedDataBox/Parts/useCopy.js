// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useEffect, useContext } from 'preact/hooks';
import { AnnounceContext } from './context';
import { t } from '@/i18n';

export const COPIED_MS = 2000;

/** How long the Copy failed instruction stays in the status region. */
const FAILED_ANNOUNCE_MS = 5000;

/**
 * Clipboard copy with a "copied" flag that resets after 2 s; the message is
 * announced in the page role="status" region (no focus move, no toast).
 * When the clipboard refuses (BEHAVIOR-SPEC 57) the label stays, there is no
 * checkmark, the failure count goes up (the field selects its text and shows
 * the instruction) and the instruction goes to the same status region; a
 * later successful copy clears it, and so does `clearFailures` (a masked
 * value hidden again).
 * @param {string} value - Text to copy.
 * @param {string} [message] - Text announced after a successful copy.
 * @returns {[boolean, function(): Promise<void>, number, function(): void]} The copied flag, the copy handler, the number of failed copies since the last success and a reset of that number.
 */
export default function useCopy (value, message) {
  const [copied, setCopied] = useState(false);
  const [failures, setFailures] = useState(0);
  const timerRef = useRef(null);
  const announce = useContext(AnnounceContext);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  /**
   * Copy the value to the clipboard.
   */
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setFailures(0);
      setCopied(true);

      if (message) {
        announce(message, COPIED_MS);
      }

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // The clipboard refused (permission, a frame, an old browser).
      clearTimeout(timerRef.current);
      setCopied(false);
      setFailures((n) => n + 1);
      announce(`${t('recipient.copyFailedTitle')} ${t('recipient.copyFailedBody')}`, FAILED_ANNOUNCE_MS);
    }
  };

  /**
   * Forget the failed copies: the Copy failed message closes.
   */
  const clearFailures = () => {
    setFailures(0);
  };

  return [copied, copy, failures, clearFailures];
}
