// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState } from 'preact/hooks';
import AddNewBox from '@/components/AddNewBox';
import ArcsDecor from '@/components/ArcsDecor';
import Benefits from '@/components/WelcomeSection/Benefits';
import PrefetchLink from '@/components/PrefetchLink';
import btn from '@/styles/ds/button.module.scss';
import ArrowIcon from '@/assets/icons/arrow-down-s-line.svg?react';
import { t } from '@/i18n';
import S from './AddNew.module.scss';
import { consumeGeneratorFocus } from '@/utils/generatorFocus';

/**
 * Page for creating a new secure share: the full generator view
 * (Section / 01 Hero, generator, Window=Expanded).
 * @returns {import('preact').JSX.Element} The add new page.
 */
export default function AddNew() {
  // Arrived through a "create" CTA: start with focus in the content field.
  // "Create new link" is handled inside the generator window (M-28).
  const [focusFromCta] = useState(consumeGeneratorFocus);

  return (
    <main id='content' className={S.page}>
      <ArcsDecor />

      <section className={S.section} aria-labelledby='generator-title'>
        <header className={S.heading}>
          <h1 id='generator-title' className={S.title}>{t('v2.addNew.title')}</h1>
          <p className={S.lead}>{t('v2.addNew.subtitle')}</p>
        </header>

        <AddNewBox variant='full' focusOnMount={focusFromCta} />

        <div className={S.after}>
          <Benefits className={S.benefits} centered />
          <PrefetchLink href='/' className={`${btn.secondary} ${S.more}`}>
            {t('generator.moreAbout')}
            <ArrowIcon aria-hidden='true' />
          </PrefetchLink>
        </div>
      </section>
    </main>
  );
}
