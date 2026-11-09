// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import ArcsDecor from '@/components/ArcsDecor';
import SharedDataBoxError from '@/components/SharedDataBox/Views/error';
import { RecipientHeading, TrustNote, StatusRegion } from './parts';
import S from './SharedData.module.scss';

/**
 * Recipient page for a link that fails validation (Figma Recipient / Broken):
 * the same DOM order as every other state (h1, window, trust note).
 * @returns {import('preact').JSX.Element} The broken link page.
 */
export default function SharedDataBroken () {
  return (
    <main id='content' className={S.page}>
      <ArcsDecor />

      <div className={S.column}>
        <RecipientHeading state='broken' />
        <SharedDataBoxError variant='broken' />
        <TrustNote />
      </div>

      <StatusRegion message='' />
    </main>
  );
}
