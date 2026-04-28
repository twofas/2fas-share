// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useEffect } from 'preact/hooks';
import S from './SharedData.module.scss';
import SharedDataBox from '../../components/SharedDataBox';
import SharedDataQR from '../../components/SharedDataQR';
import LinkExpiry from '../../components/LinkExpiry';
import Decors from '../../components/Decors';
import Sparkle from '@/assets/decor2.svg?react';
import confetti from '@/utils/confetti';
import { prefersReducedMotion } from '@/utils/reducedMotion';
import { isMobileOrTablet } from '@/utils/device';
import { t } from '@/i18n';

/**
 * Shared data page.
 * @returns {import('preact').JSX.Element} The shared data page.
 */
export default function SharedData (props) {
  const { id, type, nonce, key } = props.params;
  const [hideQR, setHideQR] = useState(false);
  const [secretMeta, setSecretMeta] = useState(null);
  const [showHeader, setShowHeader] = useState(true);
  const [error, setError] = useState(false);
  const [showError, setShowError] = useState(false);
  const mainRef = useRef(null);
  const headerRef = useRef(null);

  // Warn before leaving page for singleUse links after data is fetched
  useEffect(() => {
    if (!secretMeta?.singleUse || showHeader) {
      return;
    }

    /**
     * Prevent accidental page close/refresh for singleUse shared data.
     * @param {BeforeUnloadEvent} e - The beforeunload event.
     */
    const onBeforeUnload = (e) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [secretMeta, showHeader]);

  /**
   * Handle secret metadata received from SharedDataBox after API fetch.
   * Fades out the header, removes it, then animates main maxHeight.
   * @param {Object} meta - Secret metadata.
   * @param {boolean} meta.singleUse - Whether the secret is single-use.
   * @param {string} [meta.createdAt] - ISO date when the link was created.
   * @param {string} [meta.validUntil] - ISO date when the link expires.
   */
  const handleSecretMeta = async (meta) => {
    if (meta.singleUse) {
      setHideQR(true);
    }

    if (prefersReducedMotion()) {
      setSecretMeta(meta);
      setShowHeader(false);
      return;
    }

    const el = mainRef.current;
    const header = headerRef.current;

    // Step 1: Fade out header
    if (header) {
      await header.animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.95)' }
        ],
        { duration: 200, easing: 'ease-in' }
      ).finished;
    }

    // Step 2: Capture height before DOM change, then update state
    const fromHeight = el ? el.offsetHeight : 0;

    setSecretMeta(meta);
    setShowHeader(false);

    // Step 3: Animate main maxHeight after re-render
    await new Promise((r) => requestAnimationFrame(r));

    if (el) {
      const toHeight = el.offsetHeight;

      if (fromHeight !== toHeight) {
        el.style.overflow = 'hidden';
        el.animate(
          [{ maxHeight: `${fromHeight}px` }, { maxHeight: `${toHeight}px` }],
          { duration: 300, easing: 'ease-in-out' }
        ).onfinish = () => {
          el.style.overflow = '';
        };
      }
    }
  };

  /**
   * Handle unrecoverable error from SharedDataBox.
   * Triggers fade-out animation, then swaps to error display.
   */
  const handleError = () => {
    setError(true);
    setHideQR(true);

    if (prefersReducedMotion()) {
      setShowError(true);
    } else {
      setTimeout(() => setShowError(true), 350);
    }
  };

  return (
    <>
      <main ref={mainRef} className={`${S.sharedData} ${error ? S.errorAnimating : ''}`}>
        <Decors />

        {!showError && (
          <>
            {showHeader && (
              <div ref={headerRef} className='page-header'>
                <h1>{t('sharedData.subtitle1')}<br />{t('sharedData.subtitle2')}</h1>
              </div>
            )}

            {secretMeta && (secretMeta.validUntil || secretMeta.singleUse) && (
              <LinkExpiry
                className='page-content'
                singleUse={secretMeta.singleUse}
                createdAt={secretMeta.createdAt}
                validUntil={secretMeta.validUntil}
              />
            )}

            <SharedDataBox
              type={type}
              id={id}
              nonce={nonce}
              urlSecret={key}
              onSecretMeta={handleSecretMeta}
              onError={handleError}
              onReveal={confetti}
            />
          </>
        )}

        {showError && (
          <div className={S.errorDisplay}>
            <Sparkle className={S.errorSparkle} />
            <h2>{t('sharedData.errorTitle')}</h2>
            <p>{t('sharedData.invalidLink')}</p>
          </div>
        )}
      </main>

      {!isMobileOrTablet && <SharedDataQR hidden={hideQR} />}
    </>
  );
}
