// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { Link } from 'wouter-preact';
import { t } from '@/i18n';
import S from './WelcomeSection.module.scss';
import bS from '@/styles/buttons.module.scss';
import Ws1 from '@/assets/ws-1.svg?react';
import Ws2 from '@/assets/ws-2.svg?react';
import Ws3 from '@/assets/ws-3.svg?react';

/**
 * Welcome hero section with animated concentric arcs, centered content,
 * and floating pills with dots aligned to the arc lines.
 * @returns {import('preact').JSX.Element} The welcome section component.
 */
export default function WelcomeSection () {
  return (
    <section className={S.welcome}>
      <div className={S.welcomeCircles} aria-hidden='true'>
        <Ws3 className={`${S.welcomeCircle} ${S.outer}`} />
        <Ws2 className={`${S.welcomeCircle} ${S.middle}`} />
        <Ws1 className={`${S.welcomeCircle} ${S.inner}`} />
      </div>

      <div className={S.welcomeContent}>
        <h1 className={S.welcomeTitle}>{t('welcome.title')}</h1>
        <p className={S.welcomeSubtitle}>
          {t('welcome.subtitle')}
        </p>
        <Link
          href='/add'
          className={`${bS.btnHero} ${S.welcomeCta}`}
        >
          {t('header.shareSecurely')}
        </Link>
      </div>

      <div className={S.welcomePills} aria-hidden='true'>
        <div className={`${S.welcomePill} ${S.topRight}`}>
          <span className={S.welcomePillDot} />
          <span className={S.welcomePillText}>{t('welcome.noAccounts')}</span>
        </div>
        <div className={`${S.welcomePill} ${S.bottomRight}`}>
          <span className={S.welcomePillDot} />
          <span className={S.welcomePillText}>{t('welcome.private')}</span>
        </div>
        <div className={`${S.welcomePill} ${S.left}`}>
          <span className={S.welcomePillText}>{t('welcome.freeToUse')}</span>
          <span className={S.welcomePillDot} />
        </div>
      </div>
    </section>
  );
}
