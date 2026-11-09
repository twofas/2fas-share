// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useEffect, useRef, useState } from 'preact/hooks';
import { prefersReducedMotion } from '@/utils/reducedMotion';
import { motionMs } from '@/components/Window/motion';

/**
 * Keep a block under a field in the tree while it collapses (MOTION.md M-06:
 * the message or the counter goes in reverse of how it came, `expand`), and
 * remember what it showed, so the closing block keeps its text.
 * @template T
 * @param {boolean} open - Whether the block should be shown.
 * @param {T} content - What it shows while open.
 * @returns {{present: boolean, closing: boolean, content: T}} Whether to render it,
 *   whether it is collapsing, and the content to render.
 */
export default function usePresence (open, content) {
  const [present, setPresent] = useState(open);
  const last = useRef(content);

  if (open) {
    last.current = content;
  }

  useEffect(() => {
    if (open) {
      setPresent(true);
      return undefined;
    }

    const timer = setTimeout(() => setPresent(false), prefersReducedMotion() ? 0 : motionMs('expand', 400));

    return () => clearTimeout(timer);
  }, [open]);

  return { present: open || present, closing: !open && present, content: last.current };
}
