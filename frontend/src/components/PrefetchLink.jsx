// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { Link } from 'wouter-preact';
import { preloadRoute } from '@/lazyRoutes';

/**
 * Wouter Link that starts downloading the target route's chunk on hover, focus
 * or touch — so by the time the user clicks, the chunk is in cache and Suspense
 * never shows its fallback. Composes with caller-supplied handlers if present.
 * @param {object} props - Component props.
 * @param {string} props.href - Wouter route path (e.g. '/add').
 * @param {Function} [props.onMouseEnter] - Optional caller mouseenter handler.
 * @param {Function} [props.onFocus] - Optional caller focus handler.
 * @param {Function} [props.onTouchStart] - Optional caller touchstart handler.
 * @returns {import('preact').JSX.Element} Wrapped Link element.
 */
export default function PrefetchLink ({ href, onMouseEnter, onFocus, onTouchStart, ...rest }) {
  /**
   * Compose preload with an optional caller-supplied handler.
   * @param {Function|undefined} orig Original handler from props, if any.
   * @returns {(event: Event) => void} Combined handler.
   */
  const trigger = (orig) => (event) => {
    preloadRoute(href);

    if (orig) {
      orig(event);
    }
  };

  return (
    <Link
      {...rest}
      href={href}
      onMouseEnter={trigger(onMouseEnter)}
      onFocus={trigger(onFocus)}
      onTouchStart={trigger(onTouchStart)}
    />
  );
}
