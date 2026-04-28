// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import ErrorIcon from '@/assets/error.svg?react';
import S from './ErrorMessage.module.scss';

/**
 * Pill-shaped error message with icon.
 * @param {Object} props
 * @param {import('preact').ComponentChildren} props.children - Error message text.
 * @param {string} [props.className] - Additional CSS class for margins/positioning.
 * @returns {import('preact').JSX.Element} The error message pill.
 */
export default function ErrorMessage({ children, className }) {
  return (
    <div className={`${S.errorMessage}${className ? ` ${className}` : ''}`}>
      <div className={S.errorMessagePill}>
        <ErrorIcon className={S.errorMessageIcon} />
        <span>{children}</span>
      </div>
    </div>
  );
}
