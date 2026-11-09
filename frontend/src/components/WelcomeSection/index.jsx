// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

<<<<<<< HEAD
import PrefetchLink from '@/components/PrefetchLink';
=======
import ArcsDecor from '@/components/ArcsDecor';
import AddNewBox from '@/components/AddNewBox';
import Benefits from './Benefits';
>>>>>>> origin/develop
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

<<<<<<< HEAD
      <div className={S.welcomeContent}>
        <h1 className={S.welcomeTitle}>{t('welcome.title')}</h1>
        <p className={S.welcomeSubtitle}>
          {t('welcome.subtitle')}
        </p>
        <PrefetchLink
          href='/add'
          className={`${bS.btnHero} ${S.welcomeCta}`}
        >
          {t('header.shareSecurely')}
        </PrefetchLink>
      </div>
=======
      <div className={S.inner}>
        <div className={S.copy}>
          <Benefits className={S.benefits} />
          <h1 id='hero-title' className={S.title}>
            {t('welcome.titleStart')}{' '}
            <span className={S.titleEnd}>{t('welcome.titleEnd')}</span>
          </h1>
          <p className={S.lead}>{t('v2.welcome.subtitle')}</p>
        </div>
>>>>>>> origin/develop

        <div className={S.place}>
          <AddNewBox variant='hero' />
        </div>
      </div>
    </section>
  );
}
