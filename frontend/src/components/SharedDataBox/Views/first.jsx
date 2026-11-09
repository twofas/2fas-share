// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

<<<<<<< HEAD
import PrefetchLink from '@/components/PrefetchLink';
import bS from '@/styles/buttons.module.scss';
import Sparkle from '@/assets/decor2.svg?react';
=======
import { WindowCard, WindowSection, WindowFooter, FieldHeader } from '@/components/Window';
import { Medallion, InfoRow } from '../Parts';
import ConsentNote from './consent';
import { useCodeSwap, ShowCodeButton, CodeSwap } from './phoneCode';
import LockIcon from '@/assets/icons/lock-line.svg?react';
import ShieldIcon from '@/assets/icons/shield-keyhole-line.svg?react';
import btn from '@/styles/ds/button.module.scss';
>>>>>>> origin/develop
import S from '../SharedDataBox.module.scss';
import { runArcsLight } from '@/components/ArcsDecor';
import { t } from '@/i18n';

/**
 * SharedDataBox - first view (Recipient / window, State=Intro, links without
 * a password): the closed note, the privacy row, the CTA "Open note" that
 * fetches the data and the consent sentence under it. On a computer the
 * field header has "Show code", which swaps the slot for the code for a
 * phone (BEHAVIOR-SPEC 59.3).
 * @param {object} props - Component props.
 * @param {Function} props.onContinue - Called when the continue button is clicked.
 * @param {boolean} props.loading - Whether the API request is in progress.
 * @param {boolean} [props.offerCode] - Whether the code for a phone is offered (a computer, before the fetch).
 * @returns {import('preact').JSX.Element} The first view.
 */
export default function SharedDataBoxFirst (props) {
  const swap = useCodeSwap(Boolean(props.offerCode));

  /**
   * Continue unless the request is already running.
   */
  const handleContinue = () => {
    if (!props.loading) {
      props.onContinue();
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

  return (
    <>
      <WindowCard className={S.card}>
        <WindowSection className={`${S.dialogRow} ${S.header}`}>
          <FieldHeader
            title={t('content.note')}
            caption={t('recipient.introCaption')}
            star
          >
            {props.offerCode && <ShowCodeButton shown={swap.shown} onClick={swap.toggle} />}
          </FieldHeader>

          <CodeSwap swap={swap} offered={Boolean(props.offerCode)}>
            <div className={S.slot}>
              <Medallion icon={LockIcon} />
              <p className={S.slotLabel}>{t('recipient.encryptedNote')}</p>
            </div>
          </CodeSwap>
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
          onPointerEnter={handlePointerEnter}
          aria-busy={props.loading ? 'true' : undefined}
          aria-disabled={props.loading ? 'true' : undefined}
        >
          {t('recipient.openNote')}
        </button>

<<<<<<< HEAD
      <p className={S.sharedDataBoxLegalConsent}>
        {beforeTerms}
        <PrefetchLink href='/terms-of-use'>{termsText}</PrefetchLink>
        {betweenLinks}
        <PrefetchLink href='/privacy-policy'>{privacyText}</PrefetchLink>
        {afterPrivacy}
      </p>
=======
        <ConsentNote />
      </WindowFooter>
>>>>>>> origin/develop
    </>
  );
}
