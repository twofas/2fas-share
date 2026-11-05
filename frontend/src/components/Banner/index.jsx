// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef } from 'preact/hooks';
import { useParallax } from '@/utils/parallax';
import { useInView } from '@/utils/inView';
import PrefetchLink from '@/components/PrefetchLink';
import { t } from '@/i18n';
import S from './Banner.module.scss';
import bS from '@/styles/buttons.module.scss';
import Decor from '@/assets/decor.svg?react';

/**
 * CTA banner section with decorative cross elements and a share button.
 * Animations trigger once the section scrolls into view.
 * @returns {import('preact').JSX.Element} The banner component.
 */
export default function Banner () {
  const bannerRef = useRef(null);
  useParallax(bannerRef);
  const visible = useInView(bannerRef, 0.25);

  return (
    <div className='container'>
      <section className={`${S.banner} ${visible ? S.visible : ''}`} ref={bannerRef}>
        <div className={S.bannerDecors} aria-hidden='true'>
          <Decor className={`${S.bannerDecor} ${S.small} ${S.p1}`} data-dx='3' data-dy='-3' />
          <Decor className={`${S.bannerDecor} ${S.large} ${S.p2}`} data-dx='-6' data-dy='6' />
          <Decor className={`${S.bannerDecor} ${S.medium} ${S.p3}`} data-dx='-4' data-dy='-4' />
          <Decor className={`${S.bannerDecor} ${S.small} ${S.p4}`} data-dx='3' data-dy='3' />
          <Decor className={`${S.bannerDecor} ${S.large} ${S.p5}`} data-dx='6' data-dy='-6' />
        </div>

        <div className={S.bannerContent}>
          <h2 className={S.bannerTitle}>{t('banner.title')}</h2>
          <p className={S.bannerSubtitle}>{t('banner.subtitle')}</p>
          <PrefetchLink
            href='/add'
            className={`${bS.btnHero} ${S.bannerCta}`}
          >
            {t('header.shareSecurely')}
          </PrefetchLink>
        </div>
      </section>
    </div>
  );
}
