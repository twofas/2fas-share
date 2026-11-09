// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import PrefetchLink from '@/components/PrefetchLink';
import link from '@/styles/ds/link.module.scss';
import S from '../SharedDataBox.module.scss';
import { t } from '@/i18n';

/**
 * Consent to the terms under the CTA that fetches the data ("By clicking
 * Open note, you agree to our Terms of Use and Privacy Policy."), with links
 * to both documents.
 * @returns {import('preact').JSX.Element} Consent sentence.
 */
export default function ConsentNote () {
  const sentence = t('recipient.consentOpenNote');
  const termsText = t('legal.termsOfUse');
  const privacyText = t('legal.privacyPolicy');
  const [beforeTerms, afterTerms = ''] = sentence.split(termsText);
  const [betweenLinks, afterPrivacy = ''] = afterTerms.split(privacyText);

  return (
    <p className={S.consent}>
      {beforeTerms}
      <PrefetchLink className={`${link.link} ${link.linkAccent} ${S.inlineTarget}`} href='/terms-of-use'>{termsText}</PrefetchLink>
      {betweenLinks}
      <PrefetchLink className={`${link.link} ${link.linkAccent} ${S.inlineTarget}`} href='/privacy-policy'>{privacyText}</PrefetchLink>
      {afterPrivacy}
    </p>
  );
}
