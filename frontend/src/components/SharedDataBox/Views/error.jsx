// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import PrefetchLink from '@/components/PrefetchLink';
import { Window, WindowCard, WindowSection, WindowFooter } from '@/components/Window';
import { Medallion, InfoRow } from '../Parts';
import CloseIcon from '@/assets/icons/close-line.svg?react';
import UnlinkIcon from '@/assets/icons/link-unlink-m.svg?react';
import LinkIcon from '@/assets/icons/link.svg?react';
import MailIcon from '@/assets/icons/mail-line.svg?react';
import AlertIcon from '@/assets/icons/alert-line.svg?react';
import btn from '@/styles/ds/button.module.scss';
import S from '../SharedDataBox.module.scss';
import { t } from '@/i18n';

/** Content of the two error states (Recipient / window Unavailable, Broken). */
const VARIANTS = {
  unavailable: {
    medallion: { icon: CloseIcon },
    title: 'recipient.unavailableTitle',
    body: 'recipient.unavailableBody',
    rows: [
      { icon: MailIcon, title: 'recipient.askSenderTitle', body: 'recipient.askSenderBody' },
      { icon: AlertIcon, tone: 'accent', variant: 'solid', title: 'recipient.someoneElseTitle', body: 'recipient.someoneElseBody' }
    ]
  },
  broken: {
    medallion: { icon: UnlinkIcon, tone: 'accent', variant: 'solid' },
    title: 'recipient.brokenTitle',
    body: 'recipient.brokenBody',
    rows: [
      { icon: LinkIcon, tone: 'info', title: 'recipient.copyAgainTitle', body: 'recipient.copyAgainBody' },
      { icon: MailIcon, title: 'recipient.didntHelpTitle', body: 'recipient.didntHelpBody' }
    ]
  },
  // A path that is not a note link (BEHAVIOR-SPEC 59.8): the layout of
  // Broken with the production texts, no hint rows of its own.
  notFound: {
    medallion: { icon: UnlinkIcon, tone: 'accent', variant: 'solid' },
    title: 'notFound.title',
    body: 'notFound.description',
    rows: []
  }
};

/**
 * Interior of the error window (Recipient / window, State=Unavailable or
 * Broken): a dashed slot with a medallion, two hint rows and the secondary
 * action to create your own link.
 * @param {Object} props - Component props.
 * @param {'unavailable'|'broken'|'notFound'} [props.variant='unavailable'] - Which error state.
 * @returns {import('preact').JSX.Element} Card and footer.
 */
export function ErrorContent ({ variant = 'unavailable' }) {
  const v = VARIANTS[variant] || VARIANTS.unavailable;

  return (
    <>
      <WindowCard className={S.card}>
        <WindowSection>
          <div className={`${S.slot} ${S.slotEmpty}`}>
            <Medallion {...v.medallion} />
            <div className={S.slotText}>
              <p className={S.slotLabel}>{t(v.title)}</p>
              <p className={S.slotBody}>{t(v.body)}</p>
            </div>
          </div>
        </WindowSection>

        {v.rows.map((row) => (
          <WindowSection key={row.title} className={S.rows}>
            <InfoRow
              icon={row.icon}
              tone={row.tone}
              variant={row.variant}
              title={t(row.title)}
              body={t(row.body)}
            />
          </WindowSection>
        ))}
      </WindowCard>

      <WindowFooter className={S.footer}>
        <p>
          <PrefetchLink className={`${btn.secondary} ${btn.secondaryBig} ${S.createButton}`} href='/add'>
            {t('recipient.createOwnLink')}
          </PrefetchLink>
        </p>
      </WindowFooter>
    </>
  );
}

/**
 * SharedDataBox - standalone error window (the Broken page, where no
 * SharedDataBox is mounted).
 * @param {Object} props - Component props.
 * @param {'unavailable'|'broken'|'notFound'} [props.variant='unavailable'] - Which error state.
 * @returns {import('preact').JSX.Element} The error window.
 */
export default function SharedDataBoxError ({ variant = 'unavailable' }) {
  return (
    <Window className={S.box}>
      <ErrorContent variant={variant} />
    </Window>
  );
}
