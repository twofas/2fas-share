// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useId } from 'preact/hooks';
import { CopyButton } from '../../Parts';
import EyeIcon from '@/assets/icons/eye-line.svg?react';
import EyeOffIcon from '@/assets/icons/eye-off-line.svg?react';
import field from '@/styles/ds/field.module.scss';
import S from './ContentTypes.module.scss';
import { t } from '@/i18n';

const DEFAULT_MASK = '●●●';

/**
 * A labeled read-only field (Field / password look, readonly): the value,
 * an optional eye toggle for sensitive values and a copy button.
 * @param {Object} props - Component props.
 * @param {string} props.label - Field label text.
 * @param {string} props.value - Field value to display.
 * @param {boolean} [props.sensitive=false] - Whether to mask the value by default.
 * @param {string} [props.maskedValue] - Custom placeholder shown when hidden; defaults to 3 dots.
 * @param {boolean} [props.multiline=false] - Keep line breaks (notes).
 * @param {boolean} [props.copy=true] - Show the copy button.
 * @returns {import('preact').JSX.Element|null} The field row, or null if value is empty.
 */
export default function FieldRow ({ label, value, sensitive = false, maskedValue, multiline = false, copy = true }) {
  const [visible, setVisible] = useState(!sensitive);
  const labelId = useId();

  if (!value) {
    return null;
  }

  const hiddenDisplay = maskedValue ?? DEFAULT_MASK;

  return (
    <div className={S.row}>
      <span id={labelId} className={S.rowLabel}>{label}</span>
      <div className={`${S.box} ${multiline ? S.boxMultiline : ''}`} role='group' aria-labelledby={labelId}>
        <span className={`${S.rowValue} ${!visible ? S.rowMasked : ''}`}>
          {visible ? value : hiddenDisplay}
        </span>
        <div className={S.rowActions}>
          {sensitive && (
            <button
              type='button'
              className={field.adornment}
              onClick={() => setVisible(!visible)}
              aria-label={t('common.toggleVisibility')}
              aria-pressed={visible ? 'true' : 'false'}
            >
              {visible ? <EyeOffIcon aria-hidden='true' /> : <EyeIcon aria-hidden='true' />}
            </button>
          )}
          {copy && <CopyButton value={value} kind='adornment' />}
        </div>
      </div>
    </div>
  );
}
