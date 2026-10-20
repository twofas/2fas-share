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
import MarkX from '@/assets/icons/mark-x.svg?react';
import MarkDash from '@/assets/icons/mark-dash.svg?react';
import MarkBurst from '@/assets/icons/mark-burst.svg?react';
import S from './EncryptionBand.module.scss';

/**
 * @type {Array<{number: string, icon: Function, key: string}>}
 */
const STAGES = [
  { number: '01', icon: Star, key: 'step1' },
  { number: '02', icon: MarkX, key: 'step2' },
  { number: '03', icon: MarkDash, key: 'step3' },
  { number: '04', icon: MarkBurst, key: 'step4' }
];

/**
 * Section / 04 Encryption, accent band: why not even 2FAS can read the
 * content, with the four stages of the key's path. Target of the "Security"
 * navigation link.
 * @returns {import('preact').JSX.Element} The encryption band.
 */
export default function EncryptionBand () {
  const headRef = useRef(null);
  const bodyRef = useRef(null);
  const headVisible = useInView(headRef);
  const bodyVisible = useInView(bodyRef, 0.1);

  return (
    <section id='security' className={S.band} aria-labelledby='security-title' tabIndex={-1}>
      <div ref={headRef} className={`${S.head} ${headVisible ? S.visible : ''}`}>
        <div className={S.headInner}>
          <h2 id='security-title' className={S.title}>
            {t('encryption.title')}
          </h2>
          <p className={S.eyebrow}>
            <Star aria-hidden='true' />
            {t('encryption.eyebrow')}
          </p>
        </div>
      </div>

      <div ref={bodyRef} className={`${S.body} ${bodyVisible ? S.visible : ''}`}>
        <div className={S.bodyInner}>
          <div className={S.text}>
            <p className={S.lead}>{t('encryption.lead')}</p>
            <p className={S.leadNote}>{t('encryption.leadNote')}</p>
          </div>

          <div className={S.panel}>
            <ol className={S.stages}>
              {STAGES.map(({ number, icon: Icon, key }, i) => (
                <li key={key} className={S.stage} style={{ '--i': i }}>
                  <div className={S.stageTop}>
                    <span className={S.tile} aria-hidden='true'><Icon /></span>
                    <span className={S.number} aria-hidden='true'>{number}</span>
                  </div>
                  <h3 className={S.stageTitle}>{t(`encryption.${key}Title`)}</h3>
                  <p className={S.stageDesc}>{t(`encryption.${key}Desc`)}</p>
                </li>
              ))}
            </ol>
            <p className={S.note}>{t('encryption.note')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
