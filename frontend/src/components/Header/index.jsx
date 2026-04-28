// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import S from './Header.module.scss';
import bS from '@/styles/buttons.module.scss';
import { Link } from 'wouter-preact';
import { useHashLocation } from 'wouter-preact/use-hash-location';
import { useState, useEffect, useRef } from 'preact/hooks';
import { t } from '@/i18n';

const FADE_MS = 150;
const RESIZE_MS = 200;

/**
 * Application header with logo and navigation.
 * @returns {import('preact').JSX.Element} The header component.
 */
export default function Header () {
  const [location] = useHashLocation();
  const isHome = location === '/';
  const [shownIsHome, setShownIsHome] = useState(isHome);
  const [fading, setFading] = useState(false);
  const prevIsHome = useRef(isHome);
  const textRef = useRef(null);

  useEffect(() => {
    if (prevIsHome.current === isHome) {
      return;
    }

    prevIsHome.current = isHome;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShownIsHome(isHome);
      return;
    }

    const link = textRef.current.parentElement;
    const startWidth = link.offsetWidth;
    link.style.width = `${startWidth}px`;

    setFading(true);

    let t2, t3;

    const t1 = setTimeout(() => {
      setShownIsHome(isHome);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          link.style.transition = 'none';
          link.style.width = 'auto';
          const endWidth = link.offsetWidth;
          link.style.width = `${startWidth}px`;
          void link.offsetHeight;

          link.style.transition = 'width 0.2s ease';
          link.style.width = `${endWidth}px`;

          t2 = setTimeout(() => {
            setFading(false);
            link.style.transition = '';

            t3 = setTimeout(() => {
              link.style.width = '';
            }, FADE_MS);
          }, RESIZE_MS);
        });
      });
    }, FADE_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      link.style.width = '';
      link.style.transition = '';
      setFading(false);
      setShownIsHome(isHome);
    };
  }, [isHome]);

  return (
    <header className={S.header}>
      <div className={S.headerLogo}>
        <img src="/images/logo-light.svg" alt={t('header.logoAlt')} className='theme-light' />
        <img src="/images/logo-dark.svg" alt={t('header.logoAlt')} className='theme-dark' />
      </div>
      <Link
        href={isHome ? '/add' : '/'}
        className={bS.btnGhost}
      >
        <span
          ref={textRef}
          className={`${S.headerBtnText}${fading ? ` ${S.fading}` : ''}`}
        >
          {shownIsHome ? t('header.shareSecurely') : t('header.aboutShare')}
        </span>
      </Link>
    </header>
  );
}
