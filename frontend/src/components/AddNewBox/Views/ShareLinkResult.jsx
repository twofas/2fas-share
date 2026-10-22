// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useEffect, useRef } from 'preact/hooks';
import GlitchText from '@/components/GlitchText';
import { WindowCard, WindowSection, WindowFooter } from '@/components/Window';
import btn from '@/styles/ds/button.module.scss';
import lnk from '@/styles/ds/link.module.scss';
import ctl from '@/styles/ds/controls.module.scss';
import fb from '@/styles/ds/feedback.module.scss';
import S from '../AddNewBox.module.scss';
import Star from '@/assets/star.svg?react';
import CheckIcon from '@/assets/icons/check-line.svg?react';
import CopyIcon from '@/assets/icons/file-copy-line.svg?react';
import TimeIcon from '@/assets/icons/time-line.svg?react';
import EyeIcon from '@/assets/icons/eye-line.svg?react';
import LockIcon from '@/assets/icons/lock-line.svg?react';
import LockOpenIcon from '@/assets/icons/lock-unlock-line.svg?react';
import { t } from '@/i18n';

/** Expiration values with a sentence of their own ("Disappears after 1 hour"). */
const EXPIRATIONS = [300, 1800, 3600, 86400, 604800, 2592000];

/**
 * Generator window in the Ready and Copied states: success medallion, the
 * link in a read-only field, the rules as Chip / fact and the copy actions.
 * @param {Object} props
 * @param {string} props.link - The generated share link.
 * @param {number} props.expiration - Expiration time in seconds.
 * @param {boolean} props.oneTimeAccess - Whether one-time access is enabled.
 * @param {string} props.password - The password, if set.
 * @param {() => void} props.onReset - "Create new link": back to the empty generator.
 * @param {(text: string) => void} props.announce - Write to the window's role="status" region.
 * @returns {import('preact').JSX.Element} The share link result view.
 */
export default function ShareLinkResult({ link, expiration, oneTimeAccess, password, onReset, announce }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const ctaRef = useRef(null);

  // The "Create link" button turned into "Copy link": focus stays on the
  // button (Figma: generator notes); "Link created" goes to role="status".
  useEffect(() => {
    ctaRef.current?.focus({ preventScroll: true });
  }, []);

  /**
   * Copy a value to the clipboard and flash a copied state.
   * @param {string} value - The text to copy.
   * @param {(v: boolean) => void} setter - State setter for the copied flag.
   */
  const copyToClipboard = async (value, setter) => {
    await navigator.clipboard.writeText(value);
    setter(true);
    announce(setter === setCopiedLink ? t('result.linkCopied') : t('common.copied'));
    setTimeout(() => {
      setter(false);
    }, 2000);
  };

  /**
   * Copy the link (CTA and the button in the field).
   * @returns {Promise<void>} Resolves after copying.
   */
  const copyLink = () => copyToClipboard(link, setCopiedLink);

  return (
    <div className={S.view}>
      <WindowCard className={S.card}>
        <WindowSection className={`${S.main} ${S.ready}`}>
          <Star className={S.readyStar} aria-hidden='true' />

          <div className={S.success}>
            <span className={`${fb.medallion} ${fb.size96} ${fb.ring} ${fb.info}`} aria-hidden='true'>
              <CheckIcon />
            </span>
            <h2 className={S.readyTitle}>{t('v2.result.title')}</h2>
            <p className={S.readyCaption}>{t('generator.readyCaption')}</p>
          </div>

          <div className={S.linkField}>
            <div className={S.linkValue}>
              <GlitchText text={link} />
            </div>
            <button
              type='button'
              className={`${btn.icon} ${S.linkCopy}`}
              onClick={copyLink}
              aria-label={t('common.copyToClipboard')}
            >
              {copiedLink ? <CheckIcon aria-hidden='true' /> : <CopyIcon aria-hidden='true' />}
            </button>
          </div>

          <ul className={`${ctl.chips} ${S.facts}`}>
            <li className={ctl.chip}>
              <TimeIcon aria-hidden='true' />
              {t(`generator.disappearsAfterValue.${EXPIRATIONS.includes(expiration) ? expiration : 3600}`)}
            </li>
            {oneTimeAccess && (
              <li className={ctl.chip}>
                <EyeIcon aria-hidden='true' />
                {t('v2.result.oneTimeAccessTitle')}
              </li>
            )}
            {password ? (
              <li className={`${ctl.chip} ${ctl.chipAccent} ${S.chipAction}`}>
                <LockIcon aria-hidden='true' />
                {t('generator.sendPasswordSeparately')}
                <button
                  type='button'
                  className={S.chipButton}
                  onClick={() => copyToClipboard(password, setCopiedPassword)}
                  aria-label={t('result.copyPassword')}
                >
                  {copiedPassword ? <CheckIcon aria-hidden='true' /> : <CopyIcon aria-hidden='true' />}
                </button>
              </li>
            ) : (
              <li className={ctl.chip}>
                <LockOpenIcon aria-hidden='true' />
                {t('generator.noPassword')}
              </li>
            )}
          </ul>
        </WindowSection>
      </WindowCard>

      <WindowFooter className={`${S.footer} ${S.footerReady}`}>
        <button
          ref={ctaRef}
          type='button'
          className={`${btn.cta} ${btn.ctaBig} ${S.cta}`}
          onClick={copyLink}
        >
          {copiedLink ? t('result.linkCopied') : t('result.copyShareLink')}
        </button>
        <button
          type='button'
          className={`${lnk.link} ${lnk.linkAccent} ${S.newLink}`}
          onClick={onReset}
        >
          {t('generator.createNewLink')}
        </button>
      </WindowFooter>
    </div>
  );
}
