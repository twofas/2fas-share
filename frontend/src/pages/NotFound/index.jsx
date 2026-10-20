// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import PrefetchLink from '@/components/PrefetchLink';
import ArcsDecor from '@/components/ArcsDecor';
import S from './NotFound.module.scss';
import btn from '@/styles/ds/button.module.scss';
import fb from '@/styles/ds/feedback.module.scss';
import UnlinkIcon from '@/assets/icons/link-unlink-m.svg?react';
import { t } from '@/i18n';

/**
 * 404 catch-all page for unmatched routes, in the language of the recipient
 * Unavailable state: arcs, a neutral medallion, the title, a lead and the
 * way back to the generator or the home page.
 * @returns {import('preact').JSX.Element} The not found page.
 */
export default function NotFound () {
  return (
    <main className={S.page}>
      <ArcsDecor />

      <div className={S.content}>
        <span
          className={`${fb.medallion} ${fb.size96} ${fb.tint} ${fb.neutral} ${S.medallion}`}
          aria-hidden='true'
        >
          <UnlinkIcon />
        </span>

        <h1 className={S.title}>{t('notFound.title')}</h1>
        <p className={S.lead}>{t('notFound.description')}</p>

        <div className={S.actions}>
          <PrefetchLink className={`${btn.cta} ${btn.ctaBig}`} href='/add'>
            {t('v2.header.shareSecurely')}
          </PrefetchLink>
          <PrefetchLink className={`${btn.secondary} ${btn.secondaryBig}`} href='/'>
            {t('header.aboutShare')}
          </PrefetchLink>
        </div>
      </div>
    </main>
  );
}
