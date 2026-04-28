// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef, useEffect } from 'preact/hooks';
import QRCode from 'qrcode';
import QrCorner from '@/assets/qr-corner.svg?react';
import S from './SharedDataQR.module.scss';
import { t } from '@/i18n';

/**
 * Renders a QR code encoding the current page URL with decorative corner brackets.
 * @param {Object} props - Component props.
 * @param {boolean} [props.hidden] - Whether to animate out and hide the QR code.
 * @returns {import('preact').JSX.Element} QR code canvas with title, corners, and subtitle
 */
export default function SharedDataQR ({ hidden }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, window.location.href, {
        width: 128,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    }
  }, []);

  return (
    <div class={`${S.sharedDataQr}${hidden ? ` ${S.hidden}` : ''}`}>
      <p class={S.sharedDataQrTitle}>{t('qr.title')}</p>

      <div class={S.sharedDataQrArea}>
        <canvas ref={canvasRef} />
        <QrCorner class={`${S.sharedDataQrAreaCorner} ${S.tL}`} />
        <QrCorner class={`${S.sharedDataQrAreaCorner} ${S.tR}`} />
        <QrCorner class={`${S.sharedDataQrAreaCorner} ${S.bL}`} />
        <QrCorner class={`${S.sharedDataQrAreaCorner} ${S.bR}`} />
      </div>

      <p class={S.sharedDataQrDescription}>
        {t('qr.description')}
      </p>
    </div>
  );
}
