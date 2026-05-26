// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { createElement } from 'preact';

/**
 * Lazy-load a component with an explicit `.preload()` method that shares state
 * with the rendered component. Calling preload() (e.g. on link hover) starts
 * the chunk download; once it resolves, rendering the lazy component is
 * synchronous and bypasses Suspense entirely — no fallback flash on click.
 * @param {() => Promise<{default: import('preact').ComponentType}>} loader Dynamic import factory.
 * @returns {import('preact').ComponentType & {preload: () => Promise<void>}} Lazy component with preload.
 */
function lazyWithPreload (loader) {
  let promise;
  let module;
  let error;

  /**
   * Start (or re-use) the chunk download. Resolved value is cached in closure.
   * @returns {Promise<void>} Promise that resolves when the module is ready.
   */
  function preload () {
    if (!promise) {
      promise = loader().then(
        m => { module = m.default || m; },
        e => { error = e; }
      );
    }
    return promise;
  }

  /**
   * @param {object} props Component props forwarded to the loaded module.
   * @returns {import('preact').VNode} Rendered component once loaded.
   */
  function Lazy (props) {
    if (error) {
      throw error;
    }

    if (!module) {
      throw preload();
    }

    return createElement(module, props);
  }

  Lazy.preload = preload;
  Lazy.displayName = 'Lazy';

  return Lazy;
}

export const AddNew = lazyWithPreload(() => import('./pages/AddNew'));
export const TermsOfUse = lazyWithPreload(() => import('./pages/TermsOfUse'));
export const PrivacyPolicy = lazyWithPreload(() => import('./pages/PrivacyPolicy'));
export const OpenSourceLicenses = lazyWithPreload(() => import('./pages/OpenSourceLicenses'));
export const ValidatedRoute = lazyWithPreload(() => import('./components/ValidatedRoute'));
export const NotFound = lazyWithPreload(() => import('./pages/NotFound'));

const byHref = {
  '/add': AddNew,
  '/terms-of-use': TermsOfUse,
  '/privacy-policy': PrivacyPolicy,
  '/open-source-licenses': OpenSourceLicenses
};

/**
 * Preload the chunk associated with a wouter route href, if any.
 * No-op for unknown hrefs (e.g. '/', external, or shared-data links).
 * @param {string} href Wouter-style route path.
 */
export function preloadRoute (href) {
  byHref[href]?.preload();
}
