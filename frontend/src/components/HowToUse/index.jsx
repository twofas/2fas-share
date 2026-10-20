// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef } from 'preact/hooks';
import { useInView } from '@/utils/inView';
import { t } from '@/i18n';
import StepPreview from '@/components/StepPreview';
import Star from '@/assets/star.svg?react';
import LockIcon from '@/assets/icons/lock-line.svg?react';
import S from './HowToUse.module.scss';

/**
 * @type {Array<{step: 'content'|'rules'|'password'|'link', titleKey: string, descKey: string, optional?: boolean}>}
 */
const STEPS = [
  { step: 'content', titleKey: 'v2.howToUse.step1Title', descKey: 'v2.howToUse.step1Desc' },
  { step: 'rules', titleKey: 'v2.howToUse.step2Title', descKey: 'v2.howToUse.step2Desc' },
  { step: 'password', titleKey: 'v2.howToUse.step3Title', descKey: 'v2.howToUse.step3Desc', optional: true },
  { step: 'link', titleKey: 'v2.howToUse.step4Title', descKey: 'v2.howToUse.step4Desc' }
];

/**
 * Encryption note with "your browser" in text/primary on the text/secondary
 * line (Figma 03 action-row). The phrase is looked up in the note itself, so
 * a translation without it simply shows the whole note in one colour.
 * @returns {import('preact').ComponentChildren} Note content.
 */
function StepsNote () {
  const note = t('encryption.stepsNote');
  const emphasis = t('howToUse.stepsNoteEmphasis');
  const at = emphasis ? note.indexOf(emphasis) : -1;

  if (at < 0) {
    return note;
  }

  return (
    <>
      {note.slice(0, at)}
      <span className={S.noteEmphasis}>{emphasis}</span>
      {note.slice(at + emphasis.length)}
    </>
  );
}

/**
 * Sections 02 How it works and 03 Four steps: the heading band, four step
 * cards with generator thumbnails and the encryption note. Target of the
 * "How it works" navigation link.
 * @returns {import('preact').JSX.Element} The how to use component.
 */
export default function HowToUse () {
  const headRef = useRef(null);
  const stepsRef = useRef(null);
  const headVisible = useInView(headRef);
  const stepsVisible = useInView(stepsRef, 0.1);

  return (
    <section id='how-it-works' className={S.howToUse} aria-labelledby='how-it-works-title' tabIndex={-1}>
      <div ref={headRef} className={`${S.head} ${headVisible ? S.visible : ''}`}>
        <div className={S.headInner}>
          <p className={S.eyebrow}>
            <Star aria-hidden='true' />
            {t('v2.howToUse.pill')}
          </p>
          <div className={S.headMain}>
            <h2 id='how-it-works-title' className={S.title}>
              {t('v2.howToUse.title')}
            </h2>
          </div>
        </div>
      </div>

      <div ref={stepsRef} className={`${S.steps} ${stepsVisible ? S.visible : ''}`}>
        <div className={S.stepsInner}>
          <ol className={S.list}>
            {STEPS.map(({ step, titleKey, descKey, optional }, i) => (
              <li key={step} className={S.step} style={{ '--i': i }}>
                <div className={S.stepBody}>
                  <StepPreview step={step} play={stepsVisible} className={S.thumb} />
                  <div className={S.stepText}>
                    {optional && <p className={S.optional}>{t('howToUse.optional')}</p>}
                    <h3 className={S.stepTitle}>{t(titleKey)}</h3>
                    <p className={S.stepDesc}>{t(descKey)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <p className={S.note}>
            <span className={S.badge} aria-hidden='true'><LockIcon /></span>
            <span><StepsNote /></span>
          </p>
        </div>
      </div>
    </section>
  );
}
