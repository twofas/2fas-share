// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState } from 'preact/hooks';
import CheckIcon from '@/assets/check.svg?react';
import S from './ContentTypes.module.scss';
import { t } from '@/i18n';

/**
 * Secure note content type view - displays name and text body.
 * @param {Object} props - Component props.
 * @param {Object} props.content - Secure note data.
 * @param {string} [props.content.name] - Note title.
 * @param {string} [props.content.text] - Note text body.
 * @returns {import('preact').JSX.Element} The secure note content view.
 */
export default function ContentSecureNote ({ content }) {
  const [copied, setCopied] = useState(false);

  /**
   * Copy the note text to the clipboard.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS context)
    }
  };

  return (
    <>
      {content.name && (
        <div className={S.dataRow}>
          <span className={S.rowLabel}>{t('content.name')}</span>
          <span className={S.rowValue}>{content.name}</span>
        </div>
      )}

      {content.text && (
        <div className={S.dataRow}>
          <span className={S.rowLabel}>{t('content.note')}</span>
          <span className={S.rowValue}>{content.text}</span>
          <div className={S.rowActions}>
            <button
              type='button'
              className={S.copyButton}
              onClick={handleCopy}
              aria-label={t('common.copyToClipboard')}
            >
              {copied ? <CheckIcon className={S.checkIcon} /> : <span className={S.copyIcon} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
