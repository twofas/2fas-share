// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import ArcsDecor from '@/components/ArcsDecor';
import SharedDataBoxError from '@/components/SharedDataBox/Views/error';
import { TrustNote } from '@/pages/SharedData/parts';
import S from '@/pages/SharedData/SharedData.module.scss';
import { t } from '@/i18n';

/**
 * 404 catch-all page for unmatched routes (BEHAVIOR-SPEC 59.8): "Page not
 * found" and "The page you are looking for doesn't exist or has been
 * moved." in the layout of Broken (no frame of its own): the heading on the
 * page axis, the window with the empty slot and "Create your own link", the
 * trust note under it.
 * @returns {import('preact').JSX.Element} The not found page.
 */
export default function NotFound () {
  return (
    <main id='content' className={S.page}>
      <ArcsDecor />

      <div className={S.column}>
        <h1 className={S.heading}>
          <span className={S.headingPrimary}>{t('notFound.title')}</span>
        </h1>
        <SharedDataBoxError variant='notFound' />
        <TrustNote />
      </div>
    </main>
  );
}
