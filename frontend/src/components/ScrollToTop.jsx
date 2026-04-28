// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useEffect } from 'preact/hooks';
import { useHashLocation } from 'wouter-preact/use-hash-location';

/**
 * Scrolls the window to the top whenever the hash location changes.
 * @returns {null} Renders nothing.
 */
export default function ScrollToTop() {
  const [location] = useHashLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
