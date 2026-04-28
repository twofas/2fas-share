// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState } from 'preact/hooks';
import CheckIcon from '@/assets/check.svg?react';
import FieldRow from './FieldRow';
import S from './ContentTypes.module.scss';
import normalizeUrl from '@/utils/normalizeUrl';
import { t } from '@/i18n';

/**
 * Copy button for a single URI entry.
 * @param {Object} props - Component props.
 * @param {string} props.uri - The URI to copy.
 * @returns {import('preact').JSX.Element} Copy button or "Copied" indicator.
 */
function UriCopyButton ({ uri }) {
  const [copied, setCopied] = useState(false);

  /**
   * Copy the URI to the clipboard.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <button
      type='button'
      className={S.copyButton}
      onClick={handleCopy}
      aria-label={t('common.copyToClipboard')}
    >
      {copied ? <CheckIcon className={S.checkIcon} /> : <span className={S.copyIcon} />}
    </button>
  );
}

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
    <>
      <FieldRow label={t('content.name')} value={content.name} />
      <FieldRow label={t('content.username')} value={content.username} />
      <FieldRow
        label={t('content.password')}
        value={content.password}
        sensitive
        maskedValue={'●'.repeat(8)}
      />

      {uris.length > 0 && (
        <div className={S.dataRow}>
          <span className={S.rowLabel}>{t('content.urls')}</span>
          <div className={S.uriList}>
            {uris.map((entry, index) => {
              let href = null;

              try {
                href = normalizeUrl(entry.text);
              } catch {
                href = null;
              }

              return (
                <div key={`${entry.text}-${index}`} className={S.uriRow}>
                  {href ? (
                    <a
                      href={href}
                      title={entry.text}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={S.uriLink}
                    >
                      {entry.text}
                    </a>
                  ) : (
                    <span className={S.uriText} title={entry.text}>
                      {entry.text}
                    </span>
                  )}
                  <UriCopyButton uri={entry.text} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <FieldRow label={t('content.notes')} value={content.notes} />
    </>
  );
}
