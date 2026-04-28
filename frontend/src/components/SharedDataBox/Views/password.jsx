// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState } from 'preact/hooks';
import bS from '@/styles/buttons.module.scss';
import C from '@/styles/controls.module.scss';
import S from '../SharedDataBox.module.scss';
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage';
import { t } from '@/i18n';

/**
 * SharedDataBox - password entry view.
 * @param {Object} props - Component props.
 * @param {function} props.onPasswordSubmit - Callback to submit password for decryption.
 * @param {string} props.decryptError - Error message from failed decryption attempt.
 * @param {boolean} props.loading - Whether decryption is in progress.
 * @returns {import('preact').JSX.Element} The password entry view.
 */
export default function SharedDataBoxPassword (props) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  /**
   * Validate the password and submit for decryption.
   */
  const handleContinue = () => {
    if (!password.trim()) {
      setError(t('password.errorRequired'));
      return;
    }

    if (password.trim().length < 8) {
      setError(t('password.errorMinLength'));
      return;
    }

    setError('');
    props.onPasswordSubmit(password.trim());
  };

  const displayError = error || props.decryptError;

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleContinue();
    }}>
      <div className={S.sharedDataBoxText}>
        <h6>{t('password.description')}</h6>
        <p>{t('password.instruction')}</p>
      </div>

      <div className={`${C.passwordField} ${C.marginBottom}`}>
        <input
          type={showPassword ? 'text' : 'password'}
          className={C.passwordInput}
          placeholder={t('password.placeholder')}
          value={password}
          onInput={(e) => setPassword(e.target.value)}
          disabled={props.loading}
        />
        <button
          type='button'
          className={C.eyeButton}
          onClick={() => setShowPassword(!showPassword)}
          aria-label={t('common.togglePasswordVisibility')}
        >
          <span className={C.eyeIcon} />
        </button>
      </div>
      <div className={`${S.sharedDataBoxErrorWrap} ${displayError ? S.sharedDataBoxErrorVisible : ''}`}>
        <ErrorMessage className={S.sharedDataBoxError}>{displayError}</ErrorMessage>
      </div>

      <button
        type='submit'
        className={`${bS.btn} ${bS.fW}`}
        disabled={props.loading}
      >
        {props.loading ? t('password.decrypting') : t('password.continue')}
      </button>
    </form>
  );
}
