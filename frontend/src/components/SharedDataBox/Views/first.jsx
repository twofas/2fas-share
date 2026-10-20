// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { WindowCard, WindowSection, WindowFooter, FieldHeader } from '@/components/Window';
import { Medallion, InfoRow } from '../Parts';
import ConsentNote from './consent';
import LockIcon from '@/assets/icons/lock-line.svg?react';
import ShieldIcon from '@/assets/icons/shield-keyhole-line.svg?react';
import btn from '@/styles/ds/button.module.scss';
import S from '../SharedDataBox.module.scss';
import { runArcsLight } from '@/components/ArcsDecor';
import { t } from '@/i18n';

/**
 * SharedDataBox - first view (Recipient / window, State=Intro, links without
 * a password): the closed note, the privacy row, the CTA "Open note" that
 * fetches the data and the consent sentence under it.
 * @param {Object} props - Component props.
 * @param {function} props.onContinue - Called when the continue button is clicked.
 * @param {boolean} props.loading - Whether the API request is in progress.
 * @returns {import('preact').JSX.Element} The first view.
 */
export default function SharedDataBoxFirst (props) {
  /**
   * Continue unless the request is already running.
   */
  const handleContinue = () => {
    if (!props.loading) {
      props.onContinue();
    }
  };

  return (
    <>
      <WindowCard>
        <WindowSection className={`${S.dialogRow} ${S.header}`}>
          <FieldHeader
            title={t('content.note')}
            caption={t('recipient.introCaption')}
            star
          />

          <div className={S.slot}>
            <Medallion icon={LockIcon} />
            <p className={S.slotLabel}>{t('recipient.encryptedNote')}</p>
          </div>
        </WindowSection>

        <WindowSection className={S.rows}>
          <InfoRow
            icon={ShieldIcon}
            title={t('recipient.privacyTitle')}
            body={t('recipient.privacyBody')}
          />
        </WindowSection>
      </WindowCard>

      <WindowFooter className={S.footer}>
        <button
          type='button'
          className={`${btn.cta} ${btn.ctaBig}`}
          onClick={handleContinue}
          onMouseEnter={() => runArcsLight({ throttle: true })}
          aria-busy={props.loading ? 'true' : undefined}
          aria-disabled={props.loading ? 'true' : undefined}
        >
          {t('recipient.openNote')}
        </button>

        <ConsentNote />
      </WindowFooter>
    </>
  );
}
