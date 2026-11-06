// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useId } from 'preact/hooks';
import FieldRow from './FieldRow';
import { SecretField } from '../../Parts';
import S from './ContentTypes.module.scss';
import { t } from '@/i18n';

/**
 * Secure note content type view - the name and the note body with copy.
 * @param {object} props - Component props.
 * @param {object} props.content - Secure note data.
 * @param {string} [props.content.name] - Note title.
 * @param {string} [props.content.text] - Note text body.
 * @returns {import('preact').JSX.Element} The secure note content view.
 */
export default function ContentSecureNote ({ content }) {
  const noteLabelId = useId();

  return (
    <div className={S.fields}>
      <FieldRow label={t('content.name')} value={content.name} />

      {content.text && (
        <div className={S.row}>
          <span id={noteLabelId} className={S.rowLabel}>{t('content.note')}</span>
          <SecretField value={content.text} labelledBy={noteLabelId} />
        </div>
      )}
    </div>
  );
}
