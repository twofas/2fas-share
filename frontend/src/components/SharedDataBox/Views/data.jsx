// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import bS from '@/styles/buttons.module.scss';
import ContentCustom from './ContentTypes/Custom';
import ContentLogin from './ContentTypes/Login';
import ContentPaymentCard from './ContentTypes/PaymentCard';
import ContentSecureNote from './ContentTypes/SecureNote';
import ContentWifi from './ContentTypes/Wifi';
import S from './ContentTypes/ContentTypes.module.scss';
import { t } from '@/i18n';

/** @type {Object<string, string>} Content type translation keys. */
const CONTENT_TITLE_KEYS = {
  custom: 'data.contentType.custom',
  login: 'data.contentType.login',
  paymentCard: 'data.contentType.paymentCard',
  secureNote: 'data.contentType.secureNote',
  wifi: 'data.contentType.wifi'
};

/** @type {Object<string, function>} Content type component map. */
const CONTENT_COMPONENTS = {
  custom: ContentCustom,
  login: ContentLogin,
  paymentCard: ContentPaymentCard,
  secureNote: ContentSecureNote,
  wifi: ContentWifi
};

/**
 * SharedDataBox - data display view.
 * Routes to the appropriate content type component based on decrypted data.
 * @param {Object} props - Component props.
 * @param {Object} props.decryptedData - Decrypted payload with contentType, contentVersion, and content.
 * @param {string} props.decryptedData.contentType - The content type identifier.
 * @param {number} props.decryptedData.contentVersion - The content version number.
 * @param {any} props.decryptedData.content - The content data (shape depends on contentType).
 * @returns {import('preact').JSX.Element} The data display view.
 */
export default function SharedDataBoxData (props) {
  const { contentType, contentVersion, content } = props.decryptedData;
  const ContentComponent = CONTENT_COMPONENTS[contentType];
  const title = t(CONTENT_TITLE_KEYS[contentType] || 'data.contentType.fallback');

  return (
    <>
      <div className={S.dataTitle}>
        <h2>{t('data.title')}</h2>
        <p>{t('data.description')}</p>
      </div>

      <div className={S.dataContainer}>
        <div className={S.dataHeader}>
          <h6>{title}</h6>
        </div>

        {ContentComponent ? (
          <ContentComponent content={content} />
        ) : (
          <ContentCustom content={{ text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }} />
        )}
      </div>

      <div id='twofas-pass-be-btn'></div>
    </>
  );
}
