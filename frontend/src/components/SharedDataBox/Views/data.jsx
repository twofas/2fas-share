// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import PrefetchLink from '@/components/PrefetchLink';
import { WindowCard, WindowSection, WindowFooter, FieldHeader } from '@/components/Window';
import LinkExpiry from '@/components/LinkExpiry';
import useCopy from '../Parts/useCopy';
import { AlertCard } from '../Parts';
import { NoteCopyContext } from '../Parts/context';
import AlertIcon from '@/assets/icons/alert-line.svg?react';
import ContentCustom from './ContentTypes/Custom';
import ContentLogin from './ContentTypes/Login';
import ContentPaymentCard from './ContentTypes/PaymentCard';
import ContentSecureNote from './ContentTypes/SecureNote';
import ContentWifi from './ContentTypes/Wifi';
import btn from '@/styles/ds/button.module.scss';
import link from '@/styles/ds/link.module.scss';
import S from '../SharedDataBox.module.scss';
import { t } from '@/i18n';

/** @type {Record<string, string>} Content type translation keys. */
const CONTENT_TITLE_KEYS = {
  custom: 'content.note',
  login: 'data.contentType.login',
  paymentCard: 'data.contentType.paymentCard',
  secureNote: 'data.contentType.secureNote',
  wifi: 'data.contentType.wifi'
};

/** @type {Record<string, Function>} Content type component map. */
const CONTENT_COMPONENTS = {
  custom: ContentCustom,
  login: ContentLogin,
  paymentCard: ContentPaymentCard,
  secureNote: ContentSecureNote,
  wifi: ContentWifi
};

const TITLE_ID = 'shared-data-title';

/**
 * Text copied by the footer CTA: only the note types carry a single text.
 * @param {string} contentType - Content type identifier.
 * @param {any} content - Decrypted content.
 * @returns {string} Text to copy, or an empty string when the type has no single text.
 */
function noteText (contentType, content) {
  if (typeof content === 'string') {
    return content;
  }

  if (contentType === 'custom' || contentType === 'secureNote') {
    return content?.text || '';
  }

  return '';
}

/**
 * Footer CTA copying the whole note: "Copy content" → "Content copied" for
 * 2 s, text only (Figma: no checkmark). The name comes from the visible text (no aria-label);
 * the page status region announces the same text.
 * @param {object} props - Component props.
 * @param {boolean} props.copied - Whether the note was just copied.
 * @param {Function} props.onCopy - Copy handler.
 * @returns {import('preact').JSX.Element} Copy CTA.
 */
function CopyContentButton ({ copied, onCopy }) {
  return (
    <button type='button' className={`${btn.cta} ${btn.ctaBig}`} onClick={onCopy}>
      {copied ? t('recipient.contentCopied') : t('recipient.copyContent')}
    </button>
  );
}

/**
 * SharedDataBox - data display view (Recipient / window, State=Revealed and
 * Revealed once). Routes to the content type component. Focus moves to the
 * page <h1> after the reveal (handled by the page).
 * @param {object} props - Component props.
 * @param {object} props.decryptedData - Decrypted payload with contentType, contentVersion, and content.
 * @param {string} props.decryptedData.contentType - The content type identifier.
 * @param {number} props.decryptedData.contentVersion - The content version number.
 * @param {any} props.decryptedData.content - The content data (shape depends on contentType).
 * @param {object} [props.secretMeta] - Secret metadata ({ singleUse, createdAt, validUntil }).
 * @returns {import('preact').JSX.Element} The data display view.
 */
export default function SharedDataBoxData (props) {
  const { contentType, content } = props.decryptedData;
  const ContentComponent = CONTENT_COMPONENTS[contentType];
  const meta = props.secretMeta || {};
  const isNote = !ContentComponent || contentType === 'custom';
  const titleKey = meta.singleUse && isNote
    ? 'recipient.oneTimeNote'
    : (CONTENT_TITLE_KEYS[contentType] || 'data.contentType.fallback');
  const copyText = noteText(contentType, content);
  const [copied, copy, failures] = useCopy(copyText, t('recipient.contentCopied'));
  const noteCopy = copyText ? { value: copyText, copied, copy, failures } : null;

  return (
    <NoteCopyContext.Provider value={noteCopy}>
      <WindowCard className={S.card}>
        {meta.singleUse && (
          <WindowSection className={S.alertRow}>
            <AlertCard
              icon={AlertIcon}
              tone='warning'
              title={t('recipient.onceAlertTitle')}
              body={t('recipient.onceAlertBody')}
            />
          </WindowSection>
        )}

        <WindowSection className={`${S.dialogRow} ${S.header} ${meta.singleUse ? `${S.afterAlert} ${S.once}` : ''}`}>
          <FieldHeader
            id={TITLE_ID}
            title={t(titleKey)}
            caption={meta.singleUse ? undefined : t('recipient.revealedCaption')}
            star
          />

          {ContentComponent ? (
            <ContentComponent content={content} labelledBy={TITLE_ID} />
          ) : (
            <ContentCustom
              content={{ text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }}
              labelledBy={TITLE_ID}
            />
          )}
        </WindowSection>

        {!meta.singleUse && meta.validUntil && (
          <WindowSection className={S.rows}>
            <LinkExpiry validUntil={meta.validUntil} />
          </WindowSection>
        )}
      </WindowCard>

      <WindowFooter className={S.footer}>
        {copyText && <CopyContentButton copied={copied} onCopy={copy} />}

        <div id='twofas-pass-be-btn'></div>

        <p className={S.createLinkRow}>
          <PrefetchLink className={`${link.link} ${link.linkAccent} ${S.createLink} ${S.inlineTarget}`} href='/add'>
            {t('recipient.createOwnLink')}
          </PrefetchLink>
        </p>
      </WindowFooter>
    </NoteCopyContext.Provider>
  );
}
