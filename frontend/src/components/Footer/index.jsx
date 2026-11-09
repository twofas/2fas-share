// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import PrefetchLink from '@/components/PrefetchLink';
<<<<<<< HEAD
=======
import { useHashLocation } from 'wouter-preact/use-hash-location';
>>>>>>> origin/develop
import S from './Footer.module.scss';
import lnk from '@/styles/ds/link.module.scss';
import { t } from '@/i18n';
import Logo from '@/assets/logo-share.svg?react';
import GithubIcon from '@/assets/icons/github-fill.svg?react';
import { isRecipientLayout } from '@/utils/validateShareParams';

const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'footer.privacyPolicy' },
  { href: '/terms-of-use', label: 'footer.termsOfUse' },
  { href: '/open-source-licenses', label: 'footer.openSourceLicenses' }
];

/**
 * Application footer (Section / 07): brand column with the legal note and a
 * column of legal links plus the source code link, on the 4|8 grid. The focus
 * views (the full generator and the recipient page) have no 4|8 line, so the
 * footer drops its vertical line there (BEHAVIOR-SPEC 51.1).
 * @returns {import('preact').JSX.Element} The footer component.
 */
export default function Footer () {
  const [location] = useHashLocation();
  const focusView = location === '/add' || isRecipientLayout(location);

  return (
    <footer className={`${S.footer} ${focusView ? S.focusView : ''}`}>
      <div className={S.inner}>
        <div className={S.brand}>
          <Logo className={S.logo} role='img' aria-label={t('header.logoAlt')} />
          <p className={S.copyright}>
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>

<<<<<<< HEAD
            <nav className={S.footerLinks}>
              <PrefetchLink
                className={S.footerLink}
                href='/privacy-policy'
              >
                {t('footer.privacyPolicy')}
              </PrefetchLink>

              <PrefetchLink
                className={S.footerLink}
                href='/terms-of-use'
              >
                {t('footer.termsOfUse')}
              </PrefetchLink>

              <PrefetchLink
                className={S.footerLink}
                href='/open-source-licenses'
              >
                {t('footer.openSourceLicenses')}
              </PrefetchLink>
            </nav>
          </div>

          <div className={S.footerRight}>
            <a
              className={S.footerGithub}
              href='https://github.com/twofas/2fas-share'
              target='_blank'
              rel='noopener noreferrer'
            >
              <GithubIcon className={S.footerGithubIcon} aria-hidden='true' />
              <span>{t('footer.githubRepository')}</span>
            </a>

            <p className={S.footerCopyright}>
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
=======
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
>>>>>>> origin/develop
        </div>
      </div>
    </footer>
  );
}
