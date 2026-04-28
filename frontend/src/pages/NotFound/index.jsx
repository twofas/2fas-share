// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import S from './NotFound.module.scss';
import Decors from '../../components/Decors';
import Decor2 from '@/assets/decor2.svg?react';
import { t } from '@/i18n';

/**
 * 404 catch-all page for unmatched routes.
 * @returns {import('preact').JSX.Element} The not found page.
 */
export default function NotFound () {
  return (
    <main className={S.notFound}>
      <Decors />

      <div className={S.notFoundContent}>
        <img src="/images/404.svg" alt="" />
        <Decor2 className={S.decor2} />
        <h2>{t('notFound.title')}</h2>
        <p>{t('notFound.description')}</p>
      </div>
    </main>
  );
}
