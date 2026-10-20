// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import FieldRow from './FieldRow';
import { CopyButton } from '../../Parts';
import link from '@/styles/ds/link.module.scss';
import S from './ContentTypes.module.scss';
import normalizeUrl from '@/utils/normalizeUrl';
import { t } from '@/i18n';

/**
 * Login content type view - displays login credentials as field rows.
 * @param {Object} props - Component props.
 * @param {Object} props.content - Login data.
 * @param {string} [props.content.name] - Service name.
 * @param {string} [props.content.username] - Username or email.
 * @param {string} [props.content.password] - Password.
 * @param {Array<{text: string, matcher: number}>} [props.content.uris] - Associated URIs.
 * @param {string} [props.content.notes] - Additional notes.
 * @returns {import('preact').JSX.Element} The login content view.
 */
export default function ContentLogin ({ content }) {
  const uris = (content.uris || []).filter((entry) => entry && entry.text);

  return (
    <div className={S.fields}>
      <FieldRow label={t('content.name')} value={content.name} />
      <FieldRow label={t('content.username')} value={content.username} />
      <FieldRow
        label={t('content.password')}
        value={content.password}
        sensitive
        maskedValue={'●'.repeat(8)}
      />

      {uris.length > 0 && (
        <div className={S.row}>
          <span className={S.rowLabel}>{t('content.urls')}</span>
          <ul className={S.uriList}>
            {uris.map((entry, index) => {
              let href = null;

              try {
                href = normalizeUrl(entry.text);
              } catch {
                href = null;
              }

              return (
                <li key={`${entry.text}-${index}`} className={S.box}>
                  {href ? (
                    <a
                      href={href}
                      title={entry.text}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={`${link.link} ${link.linkAccent} ${S.rowValue} ${S.uriLink}`}
                    >
                      {entry.text}
                    </a>
                  ) : (
                    <span className={`${S.rowValue} ${S.uriLink}`} title={entry.text}>
                      {entry.text}
                    </span>
                  )}
                  <div className={S.rowActions}>
                    <CopyButton value={entry.text} kind='adornment' />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <FieldRow label={t('content.notes')} value={content.notes} multiline />
    </div>
  );
}
