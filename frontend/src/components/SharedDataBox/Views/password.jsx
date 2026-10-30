// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useEffect } from 'preact/hooks';
import { WindowCard, WindowSection, WindowFooter, FieldHeader } from '@/components/Window';
import { InfoRow, AlertCard } from '../Parts';
import ConsentNote from './consent';
import FieldMessage from '@/components/AddNewBox/Views/FieldMessage';
import { useCodeSwap, ShowCodeButton, CodeSwap } from './phoneCode';
import EyeIcon from '@/assets/icons/eye-line.svg?react';
import EyeOffIcon from '@/assets/icons/eye-off-line.svg?react';
import ShieldIcon from '@/assets/icons/shield-keyhole-line.svg?react';
import AlertIcon from '@/assets/icons/alert-line.svg?react';
import btn from '@/styles/ds/button.module.scss';
import field from '@/styles/ds/field.module.scss';
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
 * @param {object} props - Component props.
 * @param {Function} props.onPasswordSubmit - Callback to submit password for decryption.
 * @param {string} props.decryptError - Error message from failed decryption attempt.
 * @param {number} [props.decryptAttempt] - Counter of failed decryption attempts.
 * @param {boolean} props.loading - Whether the request or decryption is in progress.
 * @param {boolean} [props.fetched] - Whether the data was already fetched (the consent was given).
 * @param {object} [props.secretMeta] - Secret metadata; a one-time link shows the warning after the fetch.
 * @param {Function} [props.onClearError] - Clears the wrong-password error of the last attempt (typing).
 * @param {boolean} [props.offerCode] - Whether the code for a phone is offered (a computer, before the fetch).
 * @returns {import('preact').JSX.Element} The password entry view.
 */
export default function SharedDataBoxPassword (props) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  // Errors in a row since the field was last edited: from the second one the
  // icon pulses instead of a new entrance (MOTION M-34).
  const [errorCount, setErrorCount] = useState(0);
  const inputRef = useRef(null);
  const swap = useCodeSwap(Boolean(props.offerCode));

  // After a failed attempt, focus goes back to the field; the password stays.
  useEffect(() => {
    if (props.decryptAttempt) {
      setErrorCount((n) => n + 1);
      inputRef.current?.focus();
    }
  }, [props.decryptAttempt]);

  /**
   * A local check failed: the message under the field, focus in the field
   * (the code panel gives the field back first, so the message shows).
   * @param {string} message - Error text.
   * @returns {Promise<void>} Resolves when the message is set.
   */
  const fail = async (message) => {
    await swap.close();
    setError(message);
    setErrorCount((n) => n + 1);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  /**
   * Typing clears the error (MOTION M-34, M-06 reversed).
   * @param {InputEvent} e - Input event.
   */
  const handleInput = (e) => {
    setPassword(e.target.value);

    if (error || props.decryptError) {
      setError('');
      setErrorCount(0);
      props.onClearError?.();
    }
  };

  /**
   * The light run of the CTA, for a mouse only (MOTION M-19).
   * @param {PointerEvent} e - Pointer event.
   */
  const handlePointerEnter = (e) => {
    if (e.pointerType === 'mouse') {
      runArcsLight('cta');
    }
  };

  /**
   * Validate the password and submit for decryption.
   */
  const handleContinue = () => {
    if (props.loading) {
      return;
    }

    if (!password.trim()) {
      fail(t('password.errorRequired'));
      return;
    }

    if (password.trim().length < 8) {
      fail(t('password.errorMinLength'));
      return;
    }

    setError('');
    // The code hides together with the change of the button to Loading.
    swap.close();
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
      <WindowCard className={S.card}>
        <WindowSection className={`${S.dialogRow} ${S.header}`}>
          <FieldHeader
            htmlFor={INPUT_ID}
            title={t('recipient.passwordLabel')}
            caption={t('recipient.passwordCaption')}
            star
          >
            {props.offerCode && <ShowCodeButton shown={swap.shown} onClick={swap.toggle} />}
          </FieldHeader>

          <CodeSwap swap={swap} offered={Boolean(props.offerCode)}>
            <div className={field.arc}>
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
                  onInput={handleInput}
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
            </div>

            {/* Typing closes the message in reverse (M-06); the hint comes back. */}
            <FieldMessage
              id={MESSAGE_ID}
              open={Boolean(displayError)}
              attempt={Math.max(errorCount, 1)}
              body={wrongPassword ? t('recipient.wrongPasswordBody') : undefined}
            >
              {wrongPassword ? t('recipient.wrongPasswordTitle') : displayError}
            </FieldMessage>

            {!displayError && (
              <p id={MESSAGE_ID} className={`${field.message} ${field.hint}`}>{t('recipient.passwordHint')}</p>
            )}
          </CodeSwap>
        </WindowSection>

        {/* The warning appears after an action (a wrong password on a one-time
            link): the section is a polite live region, so the added alert is
            announced (ACCESSIBILITY 17, alerts; AC 71). */}
        <WindowSection className={S.rows} aria-live='polite'>
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
          onPointerEnter={handlePointerEnter}
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
