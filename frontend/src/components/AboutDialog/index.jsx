// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useEffect, useRef } from 'preact/hooks';
import S from './AboutDialog.module.scss';
import btn from '@/styles/ds/button.module.scss';
import lnk from '@/styles/ds/link.module.scss';
import fb from '@/styles/ds/feedback.module.scss';
import { t } from '@/i18n';
import CloseIcon from '@/assets/icons/close-line.svg?react';
import AlertIcon from '@/assets/icons/alert-line.svg?react';

const OPEN_EVENT = 'about:open';
const STEPS = ['about.step1', 'about.step2', 'about.step3', 'about.step4'];

/**
 * Open the "What is this page?" window from anywhere on the recipient page.
 */
export function openAboutDialog () {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Dialog / about: explains the recipient page without leaving the link.
 * Native <dialog> opened with showModal(), so Esc closes it and the page
 * behind is inert; focus starts on the heading and returns to the opener.
 * @returns {import('preact').JSX.Element} The dialog.
 */
export default function AboutDialog () {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    /** Show the dialog and remember which control opened it. */
    const open = () => {
      const dialog = dialogRef.current;

      if (!dialog || dialog.open) {
        return;
      }

      openerRef.current = document.activeElement;
      dialog.showModal();
      titleRef.current?.focus();
    };

    window.addEventListener(OPEN_EVENT, open);

    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  /** Close the dialog; focus goes back to the opener. */
  const close = () => {
    dialogRef.current?.close();
  };

  /** Return focus to the control that opened the dialog. */
  const onClose = () => {
    openerRef.current?.focus?.();
  };

  /**
   * Close on a click on the dimmed backdrop (outside the window).
   * @param {MouseEvent} e Click event.
   */
  const onClick = e => {
    if (e.target === dialogRef.current) {
      close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={S.dialog}
      aria-labelledby='about-title'
      onClose={onClose}
      onClick={onClick}
    >
      <div className={S.card}>
        <div className={S.header}>
          <h2 id='about-title' ref={titleRef} tabIndex={-1} className={S.title}>
            {t('about.title')}
          </h2>
          <button type='button' className={`${btn.icon} ${S.close}`} aria-label={t('about.close')} onClick={close}>
            <CloseIcon />
          </button>
        </div>

        <p className={S.lead}>{t('about.lead')}</p>

        <ol className={S.steps}>
          {STEPS.map(key => <li key={key}>{t(key)}</li>)}
        </ol>

        <div className={`${fb.alert} ${fb.alertWarning}`}>
          <span className={`${fb.medallion} ${fb.size40} ${fb.solid} ${fb.accent}`} aria-hidden='true'>
            <AlertIcon />
          </span>
          <div className={fb.alertText}>
            <p className={fb.alertTitle}>
              <span className='visually-hidden'>{t('recipient.warningPrefix')} </span>
              {t('about.warningTitle')}
            </p>
            <p className={fb.alertBody}>{t('about.warningBody')}</p>
          </div>
        </div>
      </div>

      <div className={S.footer}>
        <button type='button' className={`${btn.cta} ${btn.ctaBig} ${S.back}`} onClick={close}>
          {t('about.back')}
        </button>
        <a
          className={`${lnk.link} ${lnk.linkAccent} ${S.github}`}
          href='https://github.com/twofas/2fas-share'
          target='_blank'
          rel='noopener noreferrer'
        >
          {t('v2.footer.githubRepository')}
          <span className='visually-hidden'>{t('nav.newTab')}</span>
        </a>
      </div>
    </dialog>
  );
}
