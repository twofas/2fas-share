// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import PrefetchLink from '@/components/PrefetchLink';
import S from './Footer.module.scss';
import { t } from '@/i18n';
import GithubIcon from '@/assets/github.svg?react';

/**
 * Application footer with legal links and copyright notice.
 * @returns {import('preact').JSX.Element} The footer component.
 */
export default function Footer () {
  return (
    <footer className={S.footer}>
      <div className='container'>
        <div className={S.footerContent}>
          <div className={S.footerSection}>
            <p className={S.footerHeading}>{t('footer.termsTitle')}</p>

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
        </div>
      </div>
    </footer>
  );
}
