// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import ArcsDecor from '@/components/ArcsDecor';
import AddNewBox from '@/components/AddNewBox';
import Benefits from './Benefits';
import { t } from '@/i18n';
import S from './WelcomeSection.module.scss';

/**
 * Section / 01 Hero, generator: the headline column and the generator window
 * over the background circles. The window sits above the text below 768 px
 * (Mobile layout) and beside it from 768 px.
 * @returns {import('preact').JSX.Element} The welcome section component.
 */
export default function WelcomeSection () {
  return (
    <section id='hero' className={S.hero} aria-labelledby='hero-title'>
      <ArcsDecor />

      <div className={S.inner}>
        <div className={S.copy}>
          <Benefits className={S.benefits} />
          <h1 id='hero-title' className={S.title}>
            {t('welcome.titleStart')}{' '}
            <span className={S.titleEnd}>{t('welcome.titleEnd')}</span>{' '}
            <span className={S.titleTail}>{t('welcome.titleTail')}</span>
          </h1>
          <p className={S.lead}>{t('v2.welcome.subtitle')}</p>
        </div>

        <div className={S.place}>
          <AddNewBox variant='hero' />
        </div>
      </div>
    </section>
  );
}
