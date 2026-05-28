// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState } from 'preact/hooks';
import { FRONTEND_URL } from '@/env';
import { createSecret } from '@/api/client';
import { toBase64, toBase64Url } from '@/crypto/encoding';
import {
  generateNonce,
  generateSalt,
  generateRandomKey,
  deriveKeyFromPassword,
  encryptData
} from '@/crypto/encrypt';
import PrefetchLink from '@/components/PrefetchLink';
import B from '@/styles/box-sections.module.scss';
import C from '@/styles/controls.module.scss';
import S from '../AddNewBox.module.scss';
import bS from '@/styles/buttons.module.scss';
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage';
import { t } from '@/i18n';

/**
 * Form for creating a new secure share (custom/text content type).
 * Handles client-side encryption (AES-256-GCM) and API submission.
 * @param {Object} props
 * @param {(result: {link: string, expiration: number, oneTimeAccess: boolean, password: string}) => void} props.onSuccess - Called with the share result on success.
 * @returns {import('preact').JSX.Element} The add new form.
 */
export default function AddNewForm({ onSuccess }) {
  const [text, setText] = useState('');
  const [expiration, setExpiration] = useState(1800);
  const [oneTimeAccess, setOneTimeAccess] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate form fields before submission.
   * @returns {boolean} True if all fields are valid.
   */
  const validate = () => {
    const newErrors = {};

    if (!text.trim()) {
      newErrors.content = t('addForm.errorContentRequired');
    }

    if (usePassword && password.trim().length < 8) {
      newErrors.password = t('addForm.errorPasswordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Encrypt the form data and submit it to the API.
   * On success, calls onSuccess with the generated share link.
   * @param {Event} e - The submit event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const data = { contentType: 'custom', contentVersion: 1, content: { text } };
      let shareKey, type, urlSecret;
      const nonce = generateNonce();

      if (password.trim()) {
        type = 'v1p';
        const salt = generateSalt();
        shareKey = await deriveKeyFromPassword(password.trim(), salt);
        urlSecret = toBase64Url(salt);
      } else {
        type = 'v1k';
        shareKey = generateRandomKey();
        urlSecret = toBase64Url(shareKey);
      }

      const encrypted = await encryptData(shareKey, nonce, data);

      const result = await createSecret({
        data: toBase64(encrypted),
        validForSeconds: expiration,
        singleUse: oneTimeAccess
      });

      const link = `${FRONTEND_URL}/#/${result.id}/${type}/${toBase64Url(nonce)}/${urlSecret}`;
      onSuccess({ link, expiration, oneTimeAccess, password: password.trim() });
    } catch (err) {
      setErrors({ submit: t('addForm.errorSubmit') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={B.noteSection}>
        <div className={B.noteHeader}>
          <h6>{t('addForm.secureNote')}</h6>
        </div>
        <textarea
          id='secure-note'
          className={B.noteTextarea}
          placeholder={t('addForm.notePlaceholder')}
          value={text}
          onInput={(e) => setText(e.target.value)}
        />
      </div>
      <div className={`${S.errorWrap} ${S.errorNote} ${errors.content ? S.errorVisible : ''}`}>
        <ErrorMessage className={S.errorInner}>{errors.content}</ErrorMessage>
      </div>

      <div className={B.optionRow}>
        <div className={B.optionText}>
          <h6 className={B.optionTitle}>{t('addForm.expirationTitle')}</h6>
          <p className={B.optionDesc}>
            {t('addForm.expirationDesc')}
          </p>
        </div>
        <div className={C.selectWrapper}>
          <select
            className={C.expirationSelect}
            value={expiration}
            onChange={(e) => setExpiration(Number(e.target.value))}
          >
            <option value={300}>{t('expiry.5min')}</option>
            <option value={1800}>{t('expiry.30min')}</option>
            <option value={3600}>{t('expiry.1hour')}</option>
            <option disabled>──────────</option>
            <option value={86400}>{t('expiry.1day')}</option>
            <option value={604800}>{t('expiry.7days')}</option>
            <option value={2592000}>{t('expiry.30days')}</option>
          </select>
        </div>
      </div>

      <div className={B.optionRow}>
        <div className={B.optionText}>
          <h6 className={B.optionTitle}>{t('addForm.oneTimeAccessTitle')}</h6>
          <p className={B.optionDesc}>
            {t('addForm.oneTimeAccessDesc')}
          </p>
        </div>
        <label className={C.toggle}>
          <input
            type='checkbox'
            className={C.toggleInput}
            checked={oneTimeAccess}
            onChange={(e) => setOneTimeAccess(e.target.checked)}
          />
          <span className={C.toggleTrack} />
        </label>
      </div>

      <div className={B.optionBlock}>
        <div className={B.optionRow}>
          <div className={B.optionText}>
            <h6 className={B.optionTitle}>{t('addForm.passwordTitle')}</h6>
            <p className={B.optionDesc}>
              {t('addForm.passwordDesc')}
            </p>
          </div>
          <label className={C.toggle}>
            <input
              type='checkbox'
              className={C.toggleInput}
              checked={usePassword}
              onChange={(e) => {
                setUsePassword(e.target.checked);

                if (!e.target.checked) {
                  setPassword('');
                  setShowPassword(false);
                  setErrors((prev) => {
                    const { password: _, ...rest } = prev;
                    return rest;
                  });
                }
              }}
            />
            <span className={C.toggleTrack} />
          </label>
        </div>
        <div className={`${B.passwordCollapse} ${usePassword ? B.expanded : ''}`}>
          <div className={B.passwordCollapseInner}>
            <div className={C.passwordField}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={C.passwordInput}
                placeholder={t('addForm.passwordPlaceholder')}
                value={password}
                onInput={(e) => setPassword(e.target.value)}
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
            <div className={`${S.errorWrap} ${errors.password ? S.errorVisible : ''}`}>
              <ErrorMessage className={`${S.errorInner} ${S.errorField}`}>{errors.password}</ErrorMessage>
            </div>
          </div>
        </div>
      </div>

      <button
        type='submit'
        className={`${bS.btn} ${bS.fW}`}
        disabled={isSubmitting}
      >
        {isSubmitting ? t('addForm.submitting') : t('addForm.submit')}
      </button>

      {(() => {
        const sentence = t('legal.share');
        const terms = t('legal.termsOfUse');
        const privacy = t('legal.privacyPolicy');
        const [beforeTerms, afterTermsRaw] = sentence.split(terms);
        const [betweenLinks, afterPrivacy] = afterTermsRaw.split(privacy);

        return (
          <p className={S.addBoxLegalConsent}>
            {beforeTerms}
            <PrefetchLink href='/terms-of-use'>{terms}</PrefetchLink>
            {betweenLinks}
            <PrefetchLink href='/privacy-policy'>{privacy}</PrefetchLink>
            {afterPrivacy}
          </p>
        );
      })()}

      <div className={`${S.errorWrap} ${errors.submit ? S.errorVisible : ''}`}>
        <ErrorMessage className={`${S.errorInner} ${S.errorSubmit}`}>{errors.submit}</ErrorMessage>
      </div>
    </form>
  );
}
