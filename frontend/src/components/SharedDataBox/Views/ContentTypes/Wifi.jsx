// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import FieldRow from './FieldRow';
import WifiQr from './WifiQr';
import { t } from '@/i18n';

/**
 * Wifi content type view - displays a QR code and network credentials as field rows.
 * @param {Object} props - Component props.
 * @param {Object} props.content - Wifi data.
 * @param {string} [props.content.name] - Network label.
 * @param {string} [props.content.ssid] - Network SSID.
 * @param {string} [props.content.password] - Network password.
 * @param {string} [props.content.securityType] - Security type (WPA2, WPA3, etc.).
 * @param {boolean} [props.content.hidden] - Whether the network is hidden.
 * @param {string} [props.content.notes] - Additional notes.
 * @returns {import('preact').JSX.Element} The wifi content view.
 */
export default function ContentWifi ({ content }) {
  return (
    <>
      <WifiQr content={content} />
      <FieldRow label={t('content.name')} value={content.name} />
      <FieldRow label={t('content.ssid')} value={content.ssid} />
      <FieldRow
        label={t('content.password')}
        value={content.password}
        sensitive
        maskedValue={'●'.repeat(8)}
      />
      <FieldRow label={t('content.securityType')} value={content.securityType} />

      {content.hidden && (
        <FieldRow label={t('content.hiddenNetwork')} value={t('common.yes')} />
      )}

      <FieldRow label={t('content.notes')} value={content.notes} />
    </>
  );
}
