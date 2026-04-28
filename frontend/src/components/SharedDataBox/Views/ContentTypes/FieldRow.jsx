// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState } from 'preact/hooks';
import CheckIcon from '@/assets/check.svg?react';
import C from '@/styles/controls.module.scss';
import S from './ContentTypes.module.scss';
import { t } from '@/i18n';

const DEFAULT_MASK = '●●●';

/**
 * A labeled field row with inline label-value layout, optional masking, and copy.
 * @param {Object} props - Component props.
 * @param {string} props.label - Field label text.
 * @param {string} props.value - Field value to display.
 * @param {boolean} [props.sensitive=false] - Whether to mask the value by default.
 * @param {string} [props.maskedValue] - Custom placeholder shown when hidden; defaults to 3 dots.
 * @returns {import('preact').JSX.Element|null} The field row, or null if value is empty.
 */
export default function FieldRow ({ label, value, sensitive = false, maskedValue }) {
  const [visible, setVisible] = useState(!sensitive);
  const [copied, setCopied] = useState(false);

  if (!value) {
    return null;
  }

  const hiddenDisplay = maskedValue ?? DEFAULT_MASK;

  /**
   * Copy the field value to the clipboard.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS context)
    }
  };

  return (
    <div className={S.dataRow}>
      <span className={S.rowLabel}>{label}</span>
      <span className={S.rowValue}>
        {visible ? value : hiddenDisplay}
      </span>
      <div className={S.rowActions}>
        {sensitive && (
          <button
            type='button'
            className={C.eyeButton}
            onClick={() => setVisible(!visible)}
            aria-label={t('common.toggleVisibility')}
          >
            <span className={C.eyeIcon} />
          </button>
        )}
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
