// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { forwardRef } from 'preact/compat';
import { openAboutDialog } from '@/components/AboutDialog';
import link from '@/styles/ds/link.module.scss';
import S from './SharedData.module.scss';
import { t } from '@/i18n';

/** 2FAS Pass content types with a heading of their own when revealed. */
const TYPE_HEADINGS = ['login', 'paymentCard', 'wifi', 'secureNote'];

/** Heading lines per recipient state (Figma Recipient / 1440 / *). */
export const HEADINGS = {
  intro: ['recipient.headingIntro1', 'recipient.headingIntro2'],
  password: ['recipient.headingPassword1', 'recipient.headingPassword2'],
  passwordError: ['recipient.headingPassword1', 'recipient.headingPassword2'],
  revealed: ['recipient.headingRevealed1', 'recipient.headingRevealed2'],
  revealedOnce: ['recipient.headingOnce1', 'recipient.headingOnce2'],
  unavailable: ['recipient.headingUnavailable1', 'recipient.headingUnavailable2'],
  broken: ['recipient.headingBroken1', 'recipient.headingBroken2']
};

/**
 * The one <h1> of the recipient page, above the window, in every state:
 * two-tone, the first line in text/primary, the second in text/secondary.
 * tabindex="-1" so focus can move here after the content is revealed.
 * @param {object} props - Component props.
 * @param {keyof HEADINGS} props.state - Recipient state.
 * @param {string} [props.contentType] - Content type of the revealed data.
 * @param {import('preact').Ref<HTMLHeadingElement>} ref - Heading ref.
 * @returns {import('preact').JSX.Element} Heading.
 */
function RecipientHeadingInner ({ state, contentType }, ref) {
  let [primary, secondary] = HEADINGS[state] || HEADINGS.intro;

  // 2FAS Pass items name their type: "Login / from the sender." and so on.
  if (state === 'revealed' && TYPE_HEADINGS.includes(contentType)) {
    primary = `recipient.headingType.${contentType}`;
  }

  return (
    <h1 ref={ref} tabIndex={-1} className={S.heading}>
      <span className={S.headingPrimary}>{t(primary)}</span>{' '}
      <span className={S.headingSecondary}>{t(secondary)}</span>
    </h1>
  );
}

export const RecipientHeading = forwardRef(RecipientHeadingInner);

/**
 * Recipient / trust note under the window: one sentence and a link-styled
 * button that opens Dialog / about without leaving the page.
 * @returns {import('preact').JSX.Element} Trust note.
 */
export function TrustNote () {
  return (
    <p className={S.trust}>
      <span>{t('recipient.trustNote')}</span>{' '}
      <button type='button' className={`${link.link} ${link.linkAccent} ${S.trustLink}`} onClick={openAboutDialog}>
        {t('about.title')}
      </button>
    </p>
  );
}

/**
 * Page-level live region, in the DOM from page load (outside any view that
 * remounts): "Content copied" and the last-5-minutes message, no focus move.
 * @param {object} props - Component props.
 * @param {string} props.message - Current message (empty when idle).
 * @returns {import('preact').JSX.Element} Status region.
 */
export function StatusRegion ({ message }) {
  return <p role='status' className='visually-hidden'>{message}</p>;
}
