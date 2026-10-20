// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { t } from '@/i18n';

/**
 * Move focus to the page's <main id="content">. The app routes on the hash,
 * so the link cannot use "#content" as its target.
 * @param {MouseEvent} e Click event.
 */
function skipToContent (e) {
  e.preventDefault();

  // The pre-render SEO fallback keeps a hidden <main>; take the rendered one.
  const main = [...document.querySelectorAll('main')].find(el => el.getClientRects().length > 0);

  if (!main) {
    return;
  }

  main.id = 'content';
  main.tabIndex = -1;
  main.focus();
}

/**
 * "Skip to content": the first element of every page, visible on focus.
 * @returns {import('preact').JSX.Element} Skip link.
 */
export default function SkipLink () {
  return (
    <a className='skip-link' href='#/' onClick={skipToContent}>
      {t('nav.skip')}
    </a>
  );
}
