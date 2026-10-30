// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import field from '@/styles/ds/field.module.scss';
import fb from '@/styles/ds/feedback.module.scss';
import ErrorIcon from '@/assets/icons/error-warning-line.svg?react';
import { t } from '@/i18n';
import usePresence from './usePresence';

/**
 * Field / message, Tone=Error (Figma 1475:30203): a 20 px outline
 * error-warning-line icon beside the first line of the title, and an optional
 * Body/xs line under it, below a field that points at it with
 * aria-describedby. It opens in `expand` and, with `open`, closes the same way
 * in reverse (MOTION.md M-06). A repeated failed attempt does not re-enter the
 * message, only bumps the icon.
 * @param {object} props - Component props.
 * @param {string} props.id - Id referenced by aria-describedby.
 * @param {import('preact').ComponentChildren} props.children - Message title.
 * @param {import('preact').ComponentChildren} [props.body] - Secondary line under the title.
 * @param {number} [props.attempt=1] - Failed attempt number; from 2 up the icon bumps.
 * @param {boolean} [props.open=true] - False collapses the message, keeping its last text.
 * @param {string} [props.className] - Extra class.
 * @returns {import('preact').JSX.Element|null} The message.
 */
export default function FieldMessage ({ id, children, body, attempt = 1, open = true, className }) {
  const { present, closing, content } = usePresence(open, { children, body });

  if (!present) {
    return null;
  }

  return (
    <p
      id={closing ? undefined : id}
      className={`${field.message} ${className || ''}`}
      data-closing={closing ? '' : undefined}
      aria-hidden={closing ? 'true' : undefined}
    >
      <span className={field.messageRow}>
        <span key={attempt} className={`${field.messageIcon} ${attempt > 1 ? fb.bump : ''}`} aria-hidden='true'>
          <ErrorIcon />
        </span>
        <span className={field.messageText}>
          <span className={field.messageTitle}>
            <span className='visually-hidden'>{t('common.errorPrefix')} </span>
            {content.children}
          </span>
          {content.body && <span className={field.messageBody}>{content.body}</span>}
        </span>
      </span>
    </p>
  );
}
