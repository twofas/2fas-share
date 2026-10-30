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
import { isFontWorking } from './utils/isFontWorking';
import { currentLang, t } from './i18n';
import { plainText } from './utils/pageMeta';
import './styles/global.scss';

/**
 * index.html ships lang="en" as the pre-JS fallback; correct it to the
 * language the UI actually renders in, so screen readers pick the right
 * voice and the browser offers translation only when it makes sense.
 */
document.documentElement.lang = currentLang;

// The description in index.html is English for crawlers and link previews;
// in the page it follows the UI language (the hero lead).
for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
  document.querySelector(selector)?.setAttribute('content', plainText(t('v2.welcome.subtitle')));
}

/**
 * Detect when Inter fails to render correctly (e.g. iOS Lockdown Mode
 * loads the font but breaks the variable weight axis, rendering everything
 * at the thinnest weight). Uses rendering measurement instead of the Font
 * Loading API alone, which can't detect a loaded-but-broken font.
 * The page renders with Inter (and a metric-matched fallback while it loads);
 * the system font stack is switched on only when Inter turns out broken, so
 * a working font never causes a second layout change.
 */
if (document.fonts?.load) {
  Promise.all([document.fonts.load('400 16px Inter'), document.fonts.load('800 16px Inter')])
    .then(() => {
      if (!isFontWorking('Inter')) {
        document.documentElement.classList.add('system-font');
      }
    })
    .catch(() => {
      document.documentElement.classList.add('system-font');
    });
}

/**
 * Non-root paths without hash are invalid — redirect to 404.
 */
if (window.location.pathname !== '/') {
  window.location.replace('/#/404');
}

/**
 * Mount the application into the DOM.
 */
render(<App />, document.getElementById('app'));  
