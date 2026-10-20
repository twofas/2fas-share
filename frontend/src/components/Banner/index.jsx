// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef } from 'preact/hooks';
import { useInView } from '@/utils/inView';
import PrefetchLink from '@/components/PrefetchLink';
import Benefits from '@/components/WelcomeSection/Benefits';
import { t } from '@/i18n';
import btn from '@/styles/ds/button.module.scss';
import S from './Banner.module.scss';
import { requestGeneratorFocus } from '@/utils/generatorFocus';

/**
 * Section / 06 Final CTA: the three benefits, a two-tone heading (first word
 * in text/primary, the rest in text/secondary), the lead and the big CTA.
 * @returns {import('preact').JSX.Element} The banner component.
 */
export default function Banner () {
  const ref = useRef(null);
  const visible = useInView(ref, 0.25);
  const [first, ...rest] = t('v2.banner.title').split(' ');

  return (
    <section ref={ref} className={`${S.banner} ${visible ? S.visible : ''}`} aria-labelledby='final-cta-title'>
      <div className={S.card}>
        <div className={S.content}>
          <div className={S.benefits}>
            <Benefits />
          </div>
          <div className={S.copy}>
            <h2 id='final-cta-title' className={S.title}>
              {first}
              {rest.length > 0 && <span className={S.titleRest}> {rest.join(' ')}</span>}
            </h2>
            <p className={S.lead}>{t('v2.banner.subtitle')}</p>
          </div>
          <div className={S.action}>
            <PrefetchLink href='/add' className={`${btn.cta} ${btn.ctaBig} ${S.cta}`} onClick={requestGeneratorFocus}>
              {t('v2.header.shareSecurely')}
            </PrefetchLink>
          </div>
        </div>
      </div>
    </section>
  );
}
