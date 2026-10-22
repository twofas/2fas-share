// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { Fragment } from 'preact';
import DocumentLayout from '@/components/DocumentLayout';
import D from '@/components/DocumentLayout/DocumentLayout.module.scss';
import S from './OpenSourceLicenses.module.scss';
import lnk from '@/styles/ds/link.module.scss';
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
 * Render a package path so it wraps only after a slash (Figma: the path
 * breaks at its segments, never inside one).
 * @param {string} pkg Package name or Go import path.
 * @returns {import('preact').JSX.Element[]} Segments with break opportunities.
 */
function packagePath (pkg) {
  const parts = pkg.split('/');

  return parts.map((part, i) => (
    <Fragment key={i}>
      <span className={S.segment}>{part}{i < parts.length - 1 && '/'}</span>
      {i < parts.length - 1 && <wbr />}
    </Fragment>
  ));
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
    <DocumentLayout
      current='/open-source-licenses'
      title={t('openSourceLicenses.title')}
      meta={<p className={D.lead}>{t('v2.openSourceLicenses.intro')}</p>}
    >
      <section className={S.section}>
        <h2>{t('openSourceLicenses.backendSection')}</h2>
        <p className={S.sectionDesc}>{t('openSourceLicenses.backendDesc')}</p>

        <table className={S.table} role='table'>
          <thead role='rowgroup'>
            <tr className={S.row} role='row'>
              <th scope='col' role='columnheader' className={S.colPackage}>
                {t('openSourceLicenses.colPackage')}
              </th>
              <th scope='col' role='columnheader' className={S.colSource}>
                {t('openSourceLicenses.colSource')}
              </th>
            </tr>
          </thead>
          <tbody role='rowgroup'>
            {sortedBackend.map((dep) => (
              <tr key={dep.package} className={S.row} role='row'>
                <th scope='row' role='rowheader' className={S.colPackage}>{packagePath(dep.package)}</th>
                <td role='cell' className={S.colSource}>
                  <a
                    className={`${lnk.link} ${lnk.linkAccent} ${S.sourceLink}`}
                    href={backendUrl(dep.package)}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {t('openSourceLicenses.viewSource')}
                    <span className='visually-hidden'> {t('nav.newTab')}</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={S.section}>
        <h2>{t('openSourceLicenses.frontendSection')}</h2>
        <p className={S.sectionDesc}>{t('v2.openSourceLicenses.frontendDesc')}</p>

        <table className={S.table} role='table'>
          <thead role='rowgroup'>
            <tr className={S.row} role='row'>
              <th scope='col' role='columnheader' className={S.colPackage}>
                {t('openSourceLicenses.colPackage')}
              </th>
              <th scope='col' role='columnheader' className={S.colVersion}>
                {t('openSourceLicenses.colVersion')}
              </th>
              <th scope='col' role='columnheader' className={S.colSource}>
                {t('openSourceLicenses.colSource')}
              </th>
            </tr>
          </thead>
          <tbody role='rowgroup'>
            {sortedFrontend.map((dep) => {
              const url = cleanLink(dep.link);
              const version = cleanVersion(dep.installedVersion || dep.definedVersion);

              return (
                <tr key={dep.name} className={S.row} role='row'>
                  <th scope='row' role='rowheader' className={S.colPackage}>{packagePath(dep.name)}</th>
                  <td role='cell' className={S.colVersion}>{version || '—'}</td>
                  <td role='cell' className={S.colSource}>
                    {url
                      ? (
                        <a
                          className={`${lnk.link} ${lnk.linkAccent} ${S.sourceLink}`}
                          href={url}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {t('openSourceLicenses.viewSource')}
                          <span className='visually-hidden'> {t('nav.newTab')}</span>
                        </a>
                      )
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </DocumentLayout>
  );
}
