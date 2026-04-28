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
 * Custom content type view - displays free-text note as a single row.
 * @param {Object} props - Component props.
 * @param {Object|string} props.content - The content object with text field, or a legacy string.
 * @param {string} [props.content.text] - The note text.
 * @returns {import('preact').JSX.Element} The custom content view.
 */
export default function ContentCustom ({ content }) {
  const [copied, setCopied] = useState(false);
  const text = typeof content === 'string' ? content : content.text;

  /**
   * Copy the note content to the clipboard.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS context)
    }
  };

  return (
    <div className={S.dataRow}>
      <span className={S.rowLabel}>{t('content.note')}</span>
      <span className={S.rowValue}>{text}</span>
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
  );
}
