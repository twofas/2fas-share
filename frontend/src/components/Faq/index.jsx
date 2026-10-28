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
import AddIcon from '@/assets/icons/add-fill.svg?react';
import SubtractIcon from '@/assets/icons/subtract-fill.svg?react';
import acc from '@/styles/ds/accordion.module.scss';
import S from './Faq.module.scss';

const QUESTIONS = [1, 2, 3, 4, 5, 6, 7];

/**
 * Section / 05, FAQ part: native <details> rows (Accordion / FAQ row), the
 * first one open. The <h4> is the only child of <summary>, so the questions
 * stay in the heading outline; the +/− mark sits inside it, hidden from
 * assistive technology. Target of the "FAQ" navigation link.
 * @returns {import('preact').JSX.Element} The FAQ section.
 */
export default function Faq () {
  const ref = useRef(null);
  const visible = useInView(ref);

  return (
    <section
      ref={ref}
      id='faq'
      className={`${S.faq} ${visible ? S.visible : ''}`}
      aria-labelledby='faq-title'
      tabIndex={-1}
    >
      <div className={S.inner}>
        <p className={S.eyebrow}>
          <Star aria-hidden='true' />
          {t('faq.eyebrow')}
        </p>

        <div className={S.main}>
          <div className={S.head}>
            <h3 id='faq-title' className={S.title}>{t('faq.title')}</h3>
          </div>

          <div className={S.list}>
            {QUESTIONS.map((n, i) => (
              <details key={n} className={`${acc.row} ${S.row}`} open={n === 1} style={{ '--i': i }}>
                <summary className={acc.summary}>
                  <h4 className={`${acc.question} ${S.question}`}>
                    <span>{t(`faq.q${n}`)}</span>
                    <span className={acc.icon} aria-hidden='true'>
                      <AddIcon />
                      <SubtractIcon />
                    </span>
                  </h4>
                </summary>
                <div className={`${acc.answer} ${S.answer}`}>
                  {t(`faq.a${n}`).split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
