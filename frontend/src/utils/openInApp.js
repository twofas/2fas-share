// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { isIOS, isAndroid } from './device';

const IOS_STORE = 'https://apps.apple.com/us/app/2fas-pass/id6504464955';
const ANDROID_STORE = 'https://play.google.com/store/apps/details?id=com.twofasapp.pass';
const FALLBACK_DELAY = 1500;

/**
 * Attempts to open a deep link to the 2FAS Pass app.
 * If the app does not respond within 1500 ms (browser stays in foreground),
 * redirects iOS users to the App Store and Android users to the Play Store.
 * On other platforms, does nothing on failure.
 * @param {string} deepLink - The deep link URL (protocol from VITE_UNIVERSAL_LINK_PROTOCOL env var).
 */
export function openInApp (deepLink) {
  const storeUrl = isIOS ? IOS_STORE : isAndroid ? ANDROID_STORE : null;
  let timer = null;

  /**
   * Remove all listeners and clear the pending timeout.
   */
  const cleanup = () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('blur', onBlur);
  };

  /**
   * If the page becomes hidden the app took focus — cancel the fallback.
   */
  const onVisibilityChange = () => {
    if (document.hidden) {
      cleanup();
    }
  };

  /**
   * Window blur also indicates the app (or an OS prompt) took focus.
   */
  const onBlur = () => {
    cleanup();
  };

  window.location.href = deepLink;

  // Defer listener registration to the next frame so a residual blur
  // from a preceding confirm() dialog does not cancel the fallback.
  requestAnimationFrame(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    if (storeUrl) {
      timer = setTimeout(() => {
        cleanup();

        if (!document.hidden) {
          window.location.href = storeUrl;
        }
      }, FALLBACK_DELAY);
    }
  });
}
