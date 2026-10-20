// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useEffect } from 'preact/hooks';
import { WindowCard, WindowSection, WindowFooter, FieldHeader } from '@/components/Window';
import { Medallion, InfoRow, AlertCard } from '../Parts';
import ConsentNote from './consent';
import EyeIcon from '@/assets/icons/eye-line.svg?react';
import EyeOffIcon from '@/assets/icons/eye-off-line.svg?react';
import ExclamationIcon from '@/assets/icons/exclamation-mark.svg?react';
import ShieldIcon from '@/assets/icons/shield-keyhole-line.svg?react';
import AlertIcon from '@/assets/icons/alert-line.svg?react';
import btn from '@/styles/ds/button.module.scss';
import field from '@/styles/ds/field.module.scss';
import fb from '@/styles/ds/feedback.module.scss';
import S from '../SharedDataBox.module.scss';
import { runArcsLight } from '@/components/ArcsDecor';
import { t } from '@/i18n';

const INPUT_ID = 'shared-password';
const MESSAGE_ID = 'shared-password-message';
const ALERT_ID = 'shared-password-alert';

/**
 * SharedDataBox - password entry view (Recipient / window, State=Password
 * and Password error). A link with a password starts here: the first sending
 * of the password fetches the data, every sending decrypts it.
 * @param {Object} props - Component props.
 * @param {function} props.onPasswordSubmit - Callback to submit password for decryption.
 * @param {string} props.decryptError - Error message from failed decryption attempt.
 * @param {number} [props.decryptAttempt] - Counter of failed decryption attempts.
 * @param {boolean} props.loading - Whether the request or decryption is in progress.
 * @param {boolean} [props.fetched] - Whether the data was already fetched (the consent was given).
 * @param {Object} [props.secretMeta] - Secret metadata; a one-time link shows the warning after the fetch.
 * @returns {import('preact').JSX.Element} The password entry view.
 */
export default function SharedDataBoxPassword (props) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const inputRef = useRef(null);

  // After a failed attempt, focus goes back to the field; the password stays.
  useEffect(() => {
    if (props.decryptAttempt) {
      inputRef.current?.focus();
    }
  }, [props.decryptAttempt]);

  /**
   * Validate the password and submit for decryption.
   */
  const handleContinue = () => {
    if (props.loading) {
      return;
    }

    setAttempt((n) => n + 1);

    if (!password.trim()) {
      setError(t('password.errorRequired'));
      inputRef.current?.focus();
      return;
    }

    if (password.trim().length < 8) {
      setError(t('password.errorMinLength'));
      inputRef.current?.focus();
      return;
    }

    setError('');
    props.onPasswordSubmit(password.trim());
  };

  const wrongPassword = !error && props.decryptError;
  const displayError = error || props.decryptError;
  const keepTabAlert = props.fetched && props.secretMeta?.singleUse;
  const describedBy = keepTabAlert ? `${MESSAGE_ID} ${ALERT_ID}` : MESSAGE_ID;

  return (
    <form
      className={S.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        handleContinue();
      }}
    >
      <WindowCard>
        <WindowSection className={`${S.dialogRow} ${S.header}`}>
          <FieldHeader
            htmlFor={INPUT_ID}
            title={t('recipient.passwordLabel')}
            caption={t('recipient.passwordCaption')}
            star
          />

          <div>
            <div className={field.control}>
              <input
                ref={inputRef}
                id={INPUT_ID}
                type={showPassword ? 'text' : 'password'}
                className={field.input}
                placeholder={t('password.placeholder')}
                aria-invalid={displayError ? 'true' : undefined}
                aria-describedby={describedBy}
                autoComplete='current-password'
                value={password}
                onInput={(e) => setPassword(e.target.value)}
                readOnly={props.loading}
              />
              <button
                type='button'
                className={field.adornment}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={t('recipient.showPassword')}
                aria-pressed={showPassword ? 'true' : 'false'}
              >
                {showPassword ? <EyeOffIcon aria-hidden='true' /> : <EyeIcon aria-hidden='true' />}
              </button>
            </div>

            {displayError ? (
              <div id={MESSAGE_ID} className={field.message}>
                <div className={field.messageRow}>
                  <Medallion
                    key={attempt}
                    icon={ExclamationIcon}
                    tone='error'
                    variant='solid'
                    size={24}
                    className={attempt > 1 ? fb.bump : undefined}
                  />
                  <p className={`${field.messageText} ${S.errorText}`}>
                    <span className={field.messageTitle}>
                      <span className='visually-hidden'>{t('recipient.errorPrefix')} </span>
                      {wrongPassword ? t('recipient.wrongPasswordTitle') : displayError}
                    </span>
                    {wrongPassword && <span className={field.messageBody}>{t('recipient.wrongPasswordBody')}</span>}
                  </p>
                </div>
              </div>
            ) : (
              <p id={MESSAGE_ID} className={`${field.message} ${field.hint}`}>{t('recipient.passwordHint')}</p>
            )}
          </div>
        </WindowSection>

        <WindowSection className={S.rows}>
          <InfoRow
            icon={ShieldIcon}
            title={t('recipient.privacyTitle')}
            body={t('recipient.privacyBody')}
          />

          {keepTabAlert && (
            <AlertCard
              id={ALERT_ID}
              icon={AlertIcon}
              tone='warning'
              title={t('recipient.keepTabTitle')}
              body={t('recipient.keepTabBody')}
            />
          )}
        </WindowSection>
      </WindowCard>

      <WindowFooter className={S.footer}>
        <button
          type='submit'
          className={`${btn.cta} ${btn.ctaBig}`}
          onMouseEnter={() => runArcsLight({ throttle: true })}
          aria-busy={props.loading ? 'true' : undefined}
          aria-disabled={props.loading ? 'true' : undefined}
        >
          {t('recipient.openNote')}
        </button>

        {!props.fetched && <ConsentNote />}
      </WindowFooter>
    </form>
  );
}
