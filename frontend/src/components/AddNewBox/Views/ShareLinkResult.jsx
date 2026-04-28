// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useEffect } from 'preact/hooks';
import confetti from '@/utils/confetti';
import GlitchText from '@/components/GlitchText';
import CheckIcon from '@/assets/check.svg?react';
import CopyIcon from '@/assets/copy.svg?react';
import S from '../AddNewBox.module.scss';
import bS from '@/styles/buttons.module.scss';
import { t } from '@/i18n';

/** @type {Record<number, string>} Expiration value → translation key. */
const EXPIRATION_LABEL_KEYS = {
  300: 'expiry.5min',
  1800: 'expiry.30min',
  3600: 'expiry.1hour',
  86400: 'expiry.1day',
  604800: 'expiry.7days',
  2592000: 'expiry.30days'
};

/**
 * Displays the generated share link with settings summary and copy actions.
 * @param {Object} props
 * @param {string} props.link - The generated share link.
 * @param {number} props.expiration - Expiration time in seconds.
 * @param {boolean} props.oneTimeAccess - Whether one-time access is enabled.
 * @param {string} props.password - The password, if set.
 * @returns {import('preact').JSX.Element} The share link result view.
 */
export default function ShareLinkResult({ link, expiration, oneTimeAccess, password }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  useEffect(() => {
    confetti();
  }, []);

  /**
   * Copy a value to the clipboard and flash a copied state.
   * @param {string} value - The text to copy.
   * @param {(v: boolean) => void} setter - State setter for the copied flag.
   */
  const copyToClipboard = async (value, setter) => {
    await navigator.clipboard.writeText(value);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className={S.resultSection}>
      <div className={S.resultSectionSettings}>
        <span className={S.resultSectionSettingsHeading}>{t('result.settingsTitle')}</span>

        <div className={S.resultSectionSettingsRow}>
          <div className={S.resultSectionSettingsText}>
            <span className={S.resultSectionSettingsTitle}>{t('result.expirationTitle')}</span>
            <span className={S.resultSectionSettingsDesc}>
              {t('result.expirationDesc')}
            </span>
          </div>
          <span className={S.resultSectionSettingsValue}>{t(EXPIRATION_LABEL_KEYS[expiration] || 'expiry.1hour')}</span>
        </div>

        {oneTimeAccess && (
          <div className={S.resultSectionSettingsRow}>
            <div className={S.resultSectionSettingsText}>
              <span className={S.resultSectionSettingsTitle}>{t('result.oneTimeAccessTitle')}</span>
              <span className={S.resultSectionSettingsDesc}>
                {t('result.oneTimeAccessDesc')}
              </span>
            </div>
            <CheckIcon className={S.resultSectionSettingsCheck} />
          </div>
        )}

        {password && (
          <div className={S.resultSectionSettingsRow}>
            <div className={S.resultSectionSettingsText}>
              <span className={S.resultSectionSettingsTitle}>{t('result.passwordTitle')}</span>
              <span className={S.resultSectionSettingsDesc}>*********************</span>
            </div>
            <button
              type='button'
              className={S.resultSectionSettingsCopy}
              onClick={() => copyToClipboard(password, setCopiedPassword)}
              aria-label={t('result.copyPassword')}
            >
              {copiedPassword ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        )}
      </div>

      <h6 className={S.resultSectionHeading}>{t('result.title')}</h6>

      <div
        className={S.resultSectionLink}
        onPointerEnter={() => setLinkHovered(true)}
        onPointerLeave={() => setLinkHovered(false)}
      >
        <div className={S.resultSectionLinkUrl}>
          <GlitchText text={link} revealed={linkHovered} />
        </div>
      </div>

      <button
        type='button'
        className={`${bS.btn} ${bS.fW}`}
        onClick={() => copyToClipboard(link, setCopiedLink)}
      >
        {copiedLink ? t('common.copied') : t('result.copyShareLink')}
      </button>
    </div>
  );
}
