// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import field from '@/styles/ds/field.module.scss';
import fb from '@/styles/ds/feedback.module.scss';
import ExclamationIcon from '@/assets/icons/exclamation-mark.svg?react';
import { t } from '@/i18n';

/**
 * Field / message, Tone=Error: a 24 px solid error medallion and the message
 * title, under a field that points at it with aria-describedby. A repeated
 * failed attempt does not re-enter the message, only bumps the medallion.
 * @param {Object} props
 * @param {string} props.id - Id referenced by aria-describedby.
 * @param {string} props.children - Message text.
 * @param {number} [props.attempt=1] - Failed attempt number; from 2 up the medallion bumps.
 * @param {string} [props.className] - Extra class.
 * @returns {import('preact').JSX.Element} The message.
 */
export default function FieldMessage({ id, children, attempt = 1, className }) {
  return (
    <p id={id} className={`${field.message} ${className || ''}`}>
      <span className={field.messageRow}>
        <span
          key={attempt}
          className={`${fb.medallion} ${fb.size24} ${fb.solid} ${fb.error} ${attempt > 1 ? fb.bump : ''}`}
          aria-hidden='true'
        >
          <ExclamationIcon />
        </span>
        <span className={field.messageText}>
          <span className={field.messageTitle}>
            <span className='visually-hidden'>{t('common.errorPrefix')} </span>
            {children}
          </span>
        </span>
      </span>
    </p>
  );
}
