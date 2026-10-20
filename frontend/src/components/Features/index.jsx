// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef } from 'preact/hooks';
import { useInView } from '@/utils/inView';
import { t } from '@/i18n';
import Star from '@/assets/star.svg?react';
import Ray1 from '@/assets/icons/ray-1.svg?react';
import Ray2 from '@/assets/icons/ray-2.svg?react';
import Ray3 from '@/assets/icons/ray-3.svg?react';
import Ray4 from '@/assets/icons/ray-4.svg?react';
import S from './Features.module.scss';

const GITHUB_URL = 'https://github.com/twofas/2fas-share';

/**
 * @type {Array<{key: string, icon: Function, iconClass?: string}>}
 */
const FEATURES = [
  { key: 'oneTime', icon: Ray1 },
  { key: 'expiry', icon: Ray2, iconClass: S.raySmall },
  { key: 'password', icon: Ray3 },
  { key: 'openSource', icon: Ray4 }
];

/**
 * Eyebrow with the star mark.
 * @param {object} props - Component props.
 * @param {string} props.className - Placement class.
 * @returns {import('preact').JSX.Element} Eyebrow.
 */
function Eyebrow ({ className }) {
  return (
    <p className={className}>
      <Star aria-hidden='true' />
      {t('features.eyebrow')}
    </p>
  );
}

/**
 * Description of the open source row with the GitHub link (new tab).
 * @returns {import('preact').JSX.Element} Description content.
 */
function OpenSourceDesc () {
  return (
    <>
      {t('features.openSourceDesc')}{' '}
      <a className={S.link} href={GITHUB_URL} target='_blank' rel='noopener noreferrer'>
        {t('features.openSourceLink')}
        <span className={S.arrow} aria-hidden='true'>{' →'}</span>
        <span className='visually-hidden'>{t('nav.newTab')}</span>
      </a>
    </>
  );
}

/**
 * Section / 05, features part: "Four things you get right away" on the
 * violet band, four rows with a heading, a description and a ray mark.
 * The eyebrow sits above the heading below 1024 px and in the aside of the
 * rows from 1024 px (one of the two is display: none).
 * @returns {import('preact').JSX.Element} The features section.
 */
export default function Features () {
  const headRef = useRef(null);
  const bodyRef = useRef(null);
  const headVisible = useInView(headRef);
  const bodyVisible = useInView(bodyRef, 0.1);

  return (
    <section className={S.features} aria-labelledby='features-title'>
      <div ref={headRef} className={`${S.head} ${headVisible ? S.visible : ''}`}>
        <div className={S.headInner}>
          <div className={S.headCopy}>
            <Eyebrow className={`${S.eyebrow} ${S.eyebrowTop}`} />
            <h2 id='features-title' className={S.title}>{t('features.title')}</h2>
          </div>
        </div>
      </div>

      <div ref={bodyRef} className={`${S.body} ${bodyVisible ? S.visible : ''}`}>
        <div className={S.bodyInner}>
          <Eyebrow className={`${S.eyebrow} ${S.aside}`} />

          <ul className={S.list}>
            {FEATURES.map(({ key, icon: Icon, iconClass }, i) => (
              <li key={key} className={S.row} style={{ '--i': i }}>
                <div className={S.rowText}>
                  <h3 className={S.rowTitle}>{t(`features.${key}Title`)}</h3>
                  <p className={S.rowDesc}>
                    {key === 'openSource' ? <OpenSourceDesc /> : t(`features.${key}Desc`)}
                  </p>
                </div>
                <Icon className={`${S.ray} ${iconClass || ''}`} aria-hidden='true' />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
