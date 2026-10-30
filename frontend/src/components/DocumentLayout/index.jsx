// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import PrefetchLink from '@/components/PrefetchLink';
import ArcsDecor from '@/components/ArcsDecor';
import Star from '@/assets/star.svg?react';
import S from './DocumentLayout.module.scss';
import { t } from '@/i18n';

const DOCUMENTS = [
  { href: '/privacy-policy', label: 'footer.privacyPolicy' },
  { href: '/terms-of-use', label: 'footer.termsOfUse' },
  { href: '/open-source-licenses', label: 'footer.openSourceLicenses' }
];

/**
 * Document template (Figma: Section / 11 Document). Arcs behind the heading,
 * the heading on the 4|8 grid (rail: "Documents" eyebrow; content: title and
 * date or lead), then a surface sheet with the document switcher in the rail
 * and the content in the prose column.
 * @param {object} props - Component props.
 * @param {string} props.current - Route of the current document.
 * @param {import('preact').ComponentChildren} props.title - H1 content.
 * @param {import('preact').ComponentChildren} [props.meta] - Date line or lead under the title.
 * @param {string} [props.lang] - Language of the document content (legal texts are English).
 * @param {import('preact').ComponentChildren} props.children - Document content.
 * @returns {import('preact').JSX.Element} Document page.
 */
export default function DocumentLayout ({ current, title, meta, lang, children }) {
  return (
    <main id='content' className={S.page}>
      <ArcsDecor />

      <div className={S.header}>
        <p className={S.eyebrow}>
          <Star className={S.eyebrowStar} aria-hidden='true' focusable='false' />
          <span>{t('documents.label')}</span>
        </p>

        <div className={S.heading} lang={lang}>
          <h1 className={S.title}>{title}</h1>
          {meta}
        </div>
      </div>

      <div className={S.sheet}>
        <div className={S.rail}>
          <nav className={S.switcher} aria-label={t('documents.label')}>
            <ul className={S.switcherCard}>
              {DOCUMENTS.map(({ href, label }) => {
                const isCurrent = href === current;

                return (
                  <li key={href}>
                    <PrefetchLink
                      className={S.item}
                      href={href}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      <span className={S.marker}>
                        {isCurrent && <Star aria-hidden='true' focusable='false' />}
                      </span>
                      <span>{t(label)}</span>
                    </PrefetchLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <article className={S.content} lang={lang}>
          {children}
        </article>
      </div>
    </main>
  );
}
