// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { t } from '@/i18n';

/**
 * SharedDataBox - error.
 * @returns {import('preact').JSX.Element} The shared data page.
 */
export default function SharedDataBoxError () {
  return (
    <>
      {t('error.text')}
    </>
  );
}
  