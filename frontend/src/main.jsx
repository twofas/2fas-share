// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import './utils/iframeGuard';
import './env';
import { render } from 'preact';
import App from './app';
import { isMontserratWorking } from './utils/isMontserratWorking';
import './styles/global.scss';

/**
 * Detect when Montserrat fails to render correctly (e.g. iOS Lockdown Mode
 * loads the font but breaks the variable weight axis, rendering everything
 * at the thinnest weight). Uses rendering measurement instead of the Font
 * Loading API, which can't detect a loaded-but-broken font.
 * Starts with system-font class to use fallback stack, removes it only
 * when Montserrat is confirmed working with proper weight rendering.
 */
document.documentElement.classList.add('system-font');

let fontResolved = false;

[0, 200, 1000, 3000].forEach(delay => {
  setTimeout(() => {
    if (fontResolved) {
      return;
    }

    if (isMontserratWorking()) {
      fontResolved = true;
      document.documentElement.classList.remove('system-font');
    }
  }, delay);
});

/**
 * Non-root paths without hash are invalid — redirect to 404.
 */
if (window.location.pathname !== '/') {
  window.location.replace('/#/404');
}

/**
 * Mount the application into the DOM.
 */
render(<App />, document.getElementById('app')); // eslint-disable-line jsdoc/require-jsdoc
