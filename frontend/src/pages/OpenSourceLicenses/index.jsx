// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import S from './OpenSourceLicenses.module.scss';
import Decors from '../../components/Decors';
import { t } from '@/i18n';
import frontendLicenses from '../../../open-source-licenses.json';
import backendLicenses from '../../../../api/licenses.json';

/**
 * Normalize a `repository.url`-style string into a browsable HTTPS URL.
 * Handles `git+https://...`, `git://...`, and trailing `.git`.
 * @param {string} url Raw link from package metadata.
 * @returns {string} Cleaned URL safe for an `href`.
 */
function cleanLink (url) {
  if (!url) {
    return '';
  }

  return url
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '');
}

/**
 * Strip semver range prefixes so the rendered version is plain.
 * @param {string} version Defined version (e.g. `^1.2.3`).
 * @returns {string} Bare version, or empty string when unknown.
 */
function cleanVersion (version) {
  if (!version || version === 'n/a') {
    return '';
  }

  return version.replace(/^[\^~>=<]+/, '');
}

/**
 * Build a pkg.go.dev URL for any Go module path.
 * @param {string} pkg Go import path.
 * @returns {string} Documentation URL.
 */
function backendUrl (pkg) {
  return `https://pkg.go.dev/${pkg}`;
}

/**
 * Open Source Licenses page listing third-party dependencies for both
 * the Go backend and the frontend (npm).
 * @returns {import('preact').JSX.Element} The licenses page.
 */
export default function OpenSourceLicenses () {
  const sortedFrontend = [...frontendLicenses].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const sortedBackend = [...backendLicenses].sort((a, b) =>
    a.package.localeCompare(b.package)
  );

  return (
    <main className={S.licenses}>
      <Decors />

      <div className='page-header'>
        <h1>{t('openSourceLicenses.title')}</h1>
        <p className={S.intro}>{t('openSourceLicenses.intro')}</p>
      </div>

      <article className={`${S.licensesContent} page-box`}>
        <section className={S.section}>
          <h2>{t('openSourceLicenses.backendSection')}</h2>
          <p className={S.sectionDesc}>
            {t('openSourceLicenses.backendDesc')}
          </p>

          <div className={S.tableWrap}>
            <table className={S.table}>
              <thead>
                <tr>
                  <th scope='col'>{t('openSourceLicenses.colPackage')}</th>
                  <th scope='col' className={S.colSource}>
                    {t('openSourceLicenses.colSource')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedBackend.map((dep) => (
                  <tr key={dep.package}>
                    <td>
                      <span className={S.pkg}>{dep.package}</span>
                    </td>
                    <td className={S.colSource}>
                      <a
                        className={S.sourceLink}
                        href={backendUrl(dep.package)}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {t('openSourceLicenses.viewSource')}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={S.section}>
          <h2>{t('openSourceLicenses.frontendSection')}</h2>
          <p className={S.sectionDesc}>
            {t('openSourceLicenses.frontendDesc')}
          </p>

          <div className={S.tableWrap}>
            <table className={S.table}>
              <thead>
                <tr>
                  <th scope='col'>{t('openSourceLicenses.colPackage')}</th>
                  <th scope='col'>{t('openSourceLicenses.colVersion')}</th>
                  <th scope='col' className={S.colSource}>
                    {t('openSourceLicenses.colSource')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedFrontend.map((dep) => {
                  const url = cleanLink(dep.link);
                  const version = cleanVersion(dep.definedVersion);

                  return (
                    <tr key={dep.name}>
                      <td>
                        <span className={S.pkg}>{dep.name}</span>
                      </td>
                      <td className={S.versionCell}>
                        {version || '—'}
                      </td>
                      <td className={S.colSource}>
                        {url
                          ? (
                            <a
                              className={S.sourceLink}
                              href={url}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              {t('openSourceLicenses.viewSource')}
                            </a>
                          )
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </article>
    </main>
  );
}
