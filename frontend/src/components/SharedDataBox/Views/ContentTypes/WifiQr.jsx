// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef, useEffect } from 'preact/hooks';
import QRCode from 'qrcode';
import S from './ContentTypes.module.scss';
import { t } from '@/i18n';

/**
 * Maps WiFi security type values to the WIFI: URI protocol type parameter.
 * Matches iOS PaymentCardUtilityInteractor and 2fas-pass-browser-extension.
 * @type {Object<string, string>}
 */
const WIFI_URI_TYPE_MAP = {
  none: 'nopass',
  wep: 'WEP',
  wpa: 'WPA',
  wpa2: 'WPA',
  wpa3: 'WPA'
};

/**
 * Escapes special characters in a WiFi URI string value.
 * Characters \, ;, ,, ", : must be backslash-escaped per the WIFI: URI spec.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeWifiString (str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/"/g, '\\"')
    .replace(/:/g, '\\:');
}

/**
 * Builds a WIFI: URI string for QR code generation.
 * Format: WIFI:T:{type};S:{ssid};P:{password};H:{hidden};;
 * @param {Object} content - WiFi content data.
 * @param {string} content.ssid - Network SSID.
 * @param {string} [content.password] - Network password.
 * @param {string} [content.securityType] - Security type (none, wep, wpa, wpa2, wpa3).
 * @param {boolean} [content.hidden] - Whether the network is hidden.
 * @returns {string} The WIFI: URI string.
 */
function buildWifiUri (content) {
  const type = WIFI_URI_TYPE_MAP[content.securityType] || 'WPA';
  let uri = `WIFI:T:${type};S:${escapeWifiString(content.ssid)};`;

  if (content.securityType !== 'none' && content.password) {
    uri += `P:${escapeWifiString(content.password)};`;
  }

  if (content.hidden) {
    uri += 'H:true;';
  }

  uri += ';';

  return uri;
}

/**
 * Renders a QR code for a WiFi network, allowing users to scan and connect.
 * Only renders when SSID is present.
 * @param {Object} props - Component props.
 * @param {Object} props.content - WiFi content data.
 * @param {string} props.content.ssid - Network SSID.
 * @param {string} [props.content.password] - Network password.
 * @param {string} [props.content.securityType] - Security type.
 * @param {boolean} [props.content.hidden] - Whether the network is hidden.
 * @returns {import('preact').JSX.Element|null} The QR code block, or null if no SSID.
 */
export default function WifiQr ({ content }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!content.ssid || !canvasRef.current) {
      return;
    }

    const uri = buildWifiUri(content);

    QRCode.toCanvas(canvasRef.current, uri, {
      width: 200,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  }, [content]);

  if (!content.ssid) {
    return null;
  }

  return (
    <div className={S.wifiQr}>
      <div className={S.wifiQrCanvas}>
        <canvas ref={canvasRef} />
      </div>
      <p className={S.wifiQrLabel}>{t('content.wifiQr')}</p>
    </div>
  );
}
