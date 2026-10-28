// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useEffect, useState } from 'preact/hooks';
import { prefersReducedMotion } from './reducedMotion';

// Keep in sync with the inline script in index.html, which applies the stored
// theme before the first paint.
export const THEME_STORAGE_KEY = '2fas-share-theme';

/**
 * System dark-mode media query.
 * @returns {MediaQueryList} The prefers-color-scheme: dark query.
 */
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

/**
 * Read the theme the page shows right now: the one pinned on :root, otherwise
 * the system preference.
 * @returns {'light'|'dark'} Active theme.
 */
export function getActiveTheme () {
  const pinned = document.documentElement.dataset.theme;

  if (pinned === 'light' || pinned === 'dark') {
    return pinned;
  }

  return darkQuery().matches ? 'dark' : 'light';
}

/**
 * Pin a theme on :root and remember it for the next visit. The whole page
 * cross-fades as one image (View Transitions API), with element transitions
 * switched off for the swap, so every element changes at the same pace.
 * Without the API, or with reduced motion, the switch is instant.
 * @param {'light'|'dark'} theme Theme to apply.
 */
export function setTheme (theme) {
  const root = document.documentElement;

  /** Apply the theme and persist the choice. */
  const apply = () => {
    root.dataset.theme = theme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies.
    }

    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  };

  root.classList.add('theme-switching');

  /** Give element transitions back once the swap has been painted. */
  const done = () => {
    root.classList.remove('theme-switching');
  };

  if (document.startViewTransition && !prefersReducedMotion()) {
    document.startViewTransition(apply).finished.finally(done);
    return;
  }

  apply();
  requestAnimationFrame(() => requestAnimationFrame(done));
}

let tabsSynced = false;

/**
 * Follow a theme picked in another tab of the page (the storage event fires
 * only in the other tabs). The theme is set at once, without the View
 * Transition of a click; a cleared storage returns to the system theme.
 */
function syncThemeAcrossTabs () {
  if (tabsSynced) {
    return;
  }

  tabsSynced = true;
  window.addEventListener('storage', e => {
    if (e.key !== THEME_STORAGE_KEY && e.key !== null) {
      return;
    }

    const root = document.documentElement;

    if (e.newValue === 'light' || e.newValue === 'dark') {
      root.dataset.theme = e.newValue;
    } else {
      delete root.dataset.theme;
    }

    window.dispatchEvent(new CustomEvent('themechange', { detail: getActiveTheme() }));
  });
}

/**
 * Active theme as state, following the system until the user picks one.
 * @returns {['light'|'dark', () => void]} Theme and a toggle function.
 */
export function useTheme () {
  const [theme, setThemeState] = useState(getActiveTheme);

  useEffect(() => {
    /** Re-read the active theme after a system or user change. */
    const sync = () => {
      setThemeState(getActiveTheme());
    };
    const query = darkQuery();

    syncThemeAcrossTabs();
    query.addEventListener('change', sync);
    window.addEventListener('themechange', sync);

    return () => {
      query.removeEventListener('change', sync);
      window.removeEventListener('themechange', sync);
    };
  }, []);

  /** Switch to the other theme and remember the choice. */
  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return [theme, toggle];
}
