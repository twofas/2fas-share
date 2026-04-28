// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { Link } from 'wouter-preact';
import bS from '@/styles/buttons.module.scss';
import Sparkle from '@/assets/decor2.svg?react';
import S from '../SharedDataBox.module.scss';
import { t } from '@/i18n';

/**
 * SharedDataBox - first view with sparkle icon and continue button.
 * @param {Object} props - Component props.
 * @param {function} props.onContinue - Called when the continue button is clicked.
 * @param {boolean} props.loading - Whether the API request is in progress.
 * @returns {import('preact').JSX.Element} The first view.
 */
export default function SharedDataBoxFirst (props) {
  const legalSentence = t('legal.continue');
  const termsText = t('legal.termsOfUse');
  const privacyText = t('legal.privacyPolicy');
  const [beforeTerms, afterTermsRaw] = legalSentence.split(termsText);
  const [betweenLinks, afterPrivacy] = afterTermsRaw.split(privacyText);

  return (
    <>
      <Sparkle className={S.sharedDataBoxSparkle} />

      <div className={S.sharedDataBoxText}>
        <h6>{t('first.description')}</h6>
        <p>{t('first.instruction')}</p>
      </div>

      <div className={S.sharedDataBoxButtons}>
        <button
          className={bS.btn}
          onClick={props.onContinue}
          disabled={props.loading}
        >
          {props.loading ? t('first.loading') : t('first.continue')}
        </button>
      </div>

      <p className={S.sharedDataBoxLegalConsent}>
        {beforeTerms}
        <Link href='/terms-of-use'>{termsText}</Link>
        {betweenLinks}
        <Link href='/privacy-policy'>{privacyText}</Link>
        {afterPrivacy}
      </p>
    </>
  );
}
