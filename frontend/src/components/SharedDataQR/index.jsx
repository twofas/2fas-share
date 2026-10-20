// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useRef, useEffect } from 'preact/hooks';
import QRCode from 'qrcode';
import { Window } from '@/components/Window';
import S from './SharedDataQR.module.scss';
import { t } from '@/i18n';

/**
 * Small window with a QR code of the current page URL, to open the link on a
 * phone (desktop only).
 * @param {Object} props - Component props.
 * @param {boolean} [props.hidden] - Whether to animate out and hide the QR code.
 * @param {string} [props.className] - Placement class from the page.
 * @returns {import('preact').JSX.Element} QR code window with title and description.
 */
export default function SharedDataQR ({ hidden, className }) {
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
    <Window
      as='aside'
      className={`${S.qr}${hidden ? ` ${S.hidden}` : ''}${className ? ` ${className}` : ''}`}
      aria-hidden={hidden ? 'true' : undefined}
      aria-labelledby='shared-data-qr-title'
    >
      <div className={S.card}>
        <div className={S.tile}>
          <canvas ref={canvasRef} />
        </div>

        <div className={S.text}>
          <p id='shared-data-qr-title' className={S.title}>{t('qr.title')}</p>
          <p className={S.description}>{t('qr.description')}</p>
        </div>
      </div>
    </Window>
  );
}
