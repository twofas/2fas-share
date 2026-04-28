// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { t } from '@/i18n';
import S from './HowToUse.module.scss';
import Htu1 from '@/assets/htu-1.svg?react';
import Htu2 from '@/assets/htu-2.svg?react';
import Htu3 from '@/assets/htu-3.svg?react';
import Htu4 from '@/assets/htu-4.svg?react';

/**
 * @type {Array<{number: string, icon: Function, titleKey: string, descKey: string}>}
 */
const STEPS = [
  { number: '01', icon: Htu1, titleKey: 'howToUse.step1Title', descKey: 'howToUse.step1Desc' },
  { number: '02', icon: Htu2, titleKey: 'howToUse.step2Title', descKey: 'howToUse.step2Desc' },
  { number: '03', icon: Htu3, titleKey: 'howToUse.step3Title', descKey: 'howToUse.step3Desc' },
  { number: '04', icon: Htu4, titleKey: 'howToUse.step4Title', descKey: 'howToUse.step4Desc' }
];

/**
 * How to use section with step-by-step cards.
 * @returns {import('preact').JSX.Element} The how to use component.
 */
export default function HowToUse () {
  return (
    <section className={S.howToUse}>
      <div className={S.howToUseLeft}>
        <div className={S.howToUsePill}>
          <span className={S.howToUsePillDot} />
          <span className={S.howToUsePillText}>{t('howToUse.pill')}</span>
        </div>

        <h2 className={S.howToUseTitle}>
          {t('howToUse.title')}
        </h2>

        <p className={S.howToUseSubtitle}>
          {t('howToUse.subtitle')}
        </p>
      </div>

      <div className={S.howToUseCards}>
        {STEPS.map(({ number, icon: Icon, titleKey, descKey }) => (
          <div className={S.howToUseCard} key={number}>
            <div className={S.howToUseCardHead}>
              <span className={S.howToUseCardNumber}>{number}</span>
              <Icon className={S.howToUseCardIcon} aria-hidden='true' />
            </div>

            <div className={S.howToUseCardBody}>
              <h3 className={S.howToUseCardTitle}>{t(titleKey)}</h3>
              <p className={S.howToUseCardDesc}>{t(descKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
