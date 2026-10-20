// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import PrefetchLink from '@/components/PrefetchLink';
import S from './Footer.module.scss';
import lnk from '@/styles/ds/link.module.scss';
import { t } from '@/i18n';
import Logo from '@/assets/logo-share.svg?react';
import GithubIcon from '@/assets/icons/github-fill.svg?react';

const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'footer.privacyPolicy' },
  { href: '/terms-of-use', label: 'footer.termsOfUse' },
  { href: '/open-source-licenses', label: 'footer.openSourceLicenses' }
];

/**
 * Application footer (Section / 07): brand column with the legal note and a
 * column of legal links plus the source code link, on the 4|8 grid.
 * @returns {import('preact').JSX.Element} The footer component.
 */
export default function Footer () {
  return (
    <footer className={S.footer}>
      <div className={S.inner}>
        <div className={S.brand}>
          <Logo className={S.logo} role='img' aria-label={t('header.logoAlt')} />
          <p className={S.copyright}>
            {t('footer.copyright', { year: new Date().getFullYear() }).replace('Inc. ', 'Inc.\n')}
          </p>
        </div>

        <div className={S.links}>
          <nav className={S.legal} aria-label={t('footer.legalNav')}>
            {LEGAL_LINKS.map(({ href, label }) => (
              <PrefetchLink key={href} className={`${lnk.link} ${S.link}`} href={href}>
                {t(label)}
              </PrefetchLink>
            ))}
          </nav>

          <a
            className={`${lnk.link} ${S.link} ${S.github}`}
            href='https://github.com/twofas/2fas-share'
            target='_blank'
            rel='noopener noreferrer'
          >
            <GithubIcon />
            <span>{t('v2.footer.githubRepository')}</span>
            <span className='visually-hidden'>{t('nav.newTab')}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
