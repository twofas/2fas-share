// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useEffect } from 'preact/hooks';
import QRCode from 'qrcode';
import S from './SharedDataQR.module.scss';
import { t } from '@/i18n';

/**
 * Recipient / phone code (BEHAVIOR-SPEC 59.3): the code of the current link
 * (the whole URL, the part after # included) for opening the note on a
 * phone. It takes the place of the note slot or the password field while
 * "Show code" is on, so it looks like the "Encrypted note" field: a 104 px
 * code with black modules on a white tile in both themes, and a caption that
 * warns about screen sharing.
 * @param {Object} props - Component props.
 * @param {string} props.id - Id, for the aria-controls of the "Show code" button.
 * @param {string} [props.className] - Extra class.
 * @returns {import('preact').JSX.Element} The code panel.
 */
export default function SharedDataQR ({ id, className }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let active = true;

    QRCode.toString(window.location.href, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 0,
      color: { dark: '#000000', light: '#ffffff' }
    }).then((svg) => {
      if (active) {
        setSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      }
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <div id={id} className={`${S.panel}${className ? ` ${className}` : ''}`}>
      <div className={S.tile}>
        {src && <img src={src} alt={t('recipient.phoneCodeAlt')} width='104' height='104' />}
      </div>

      <div className={S.caption}>
        <p className={S.title}>{t('recipient.phoneCodeTitle')}</p>
        <p className={S.body}>{t('recipient.phoneCodeBody')}</p>
      </div>
    </div>
  );
}
