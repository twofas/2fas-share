// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useCallback } from 'preact/hooks';
import { getSecret } from '@/api/client';
import { fromBase64Url } from '@/crypto/encoding';
import { deriveKeyFromPassword, decryptData } from '@/crypto/encrypt';
import { prefersReducedMotion } from '@/utils/reducedMotion';
import { openInApp } from '@/utils/openInApp';
import { isMobileOrTablet } from '@/utils/device';
import SharedDataBoxFirst from './Views/first';
import SharedDataBoxPassword from './Views/password';
import SharedDataBoxData from './Views/data';
import SharedDataBoxError from './Views/error';
import bS from '@/styles/buttons.module.scss';
import S from './SharedDataBox.module.scss';
import { t } from '@/i18n';

/** @enum {string} */
export const SHARED_VIEWS = {
  FIRST: 'first',
  PASSWORD: 'password',
  DATA: 'data',
  ERROR: 'error'
};

const VIEW_COMPONENTS = {
  [SHARED_VIEWS.FIRST]: SharedDataBoxFirst,
  [SHARED_VIEWS.PASSWORD]: SharedDataBoxPassword,
  [SHARED_VIEWS.DATA]: SharedDataBoxData,
  [SHARED_VIEWS.ERROR]: SharedDataBoxError
};

/**
 * Shared data box that renders the correct view based on state.
 * @param {Object} props - Component props.
 * @param {string} props.id - Secret identifier for API fetch.
 * @param {string} props.type - Share type (v1p or v1k).
 * @param {string} props.nonce - Base64URL-encoded nonce from URL.
 * @param {string} props.urlSecret - Base64URL-encoded key (v1k) or salt (v1p) from URL.
 * @param {function} [props.onSecretMeta] - Called with secret metadata ({ singleUse, expiresAt, createdAt }) after API fetch.
 * @param {function} [props.onError] - Called when an unrecoverable error occurs (API failure, non-password decryption error).
 * @param {function} [props.onReveal] - Called when decrypted data is successfully revealed.
 * @returns {import('preact').JSX.Element} The shared data box.
 */
export default function SharedDataBox (props) {
  const [view, setView] = useState(SHARED_VIEWS.FIRST);
  const [loading, setLoading] = useState(false);
  const [decryptedData, setDecryptedData] = useState(null);
  const [decryptError, setDecryptError] = useState('');
  const encryptedDataRef = useRef(null);
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  const animatingRef = useRef(false);
  const ViewComponent = VIEW_COMPONENTS[view];

  /**
   * Decrypt the stored encrypted data using the provided key bytes.
   * @param {Uint8Array} keyBytes - 256-bit decryption key.
   * @returns {Promise<any>} The decrypted and parsed data.
   */
  const decrypt = async (keyBytes) => {
    const nonceBytes = fromBase64Url(props.nonce);
    const ciphertext = fromBase64Url(encryptedDataRef.current.data);
    return decryptData(keyBytes, nonceBytes, ciphertext);
  };

  /**
   * Changes the view with a 3-step animation:
   * 1. Fade out current view
   * 2. Animate height to fit new view
   * 3. Fade in new view
   * @param {string} nextView - The view to switch to.
   */
  const changeView = useCallback(async (nextView) => {
    const el = boxRef.current;
    const content = contentRef.current;

    if (!el || !content || animatingRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      setView(nextView);
      return;
    }

    animatingRef.current = true;

    try {
      // Step 1: Fade out current view
      await content.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 150, easing: 'ease-in' }
      ).finished;

      content.style.opacity = '0';
      const fromHeight = el.offsetHeight;

      setView(nextView);

      // Wait for render
      await new Promise((r) => requestAnimationFrame(r));

      // Step 2: Animate height
      const toHeight = el.offsetHeight;

      if (fromHeight !== toHeight) {
        await el.animate(
          [{ height: `${fromHeight}px` }, { height: `${toHeight}px` }],
          { duration: 300, easing: 'ease-in-out' }
        ).finished;
      }

      // Step 3: Fade in new view
      content.style.opacity = '';
      await content.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 150, easing: 'ease-out' }
      ).finished;
    } finally {
      animatingRef.current = false;
    }
  }, []);

  /**
   * Fetches encrypted data from the API, decrypts if v1k,
   * then transitions to the appropriate next view.
   */
  const fetchAndContinue = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getSecret(props.id);
      encryptedDataRef.current = data;

      if (props.onSecretMeta) {
        props.onSecretMeta({
          singleUse: data.singleUse,
          createdAt: data.createdAt,
          validUntil: data.validUntil
        });
      }

      if (props.type === 'v1k') {
        const keyBytes = fromBase64Url(props.urlSecret);
        const result = await decrypt(keyBytes);
        setDecryptedData(result);
        await changeView(SHARED_VIEWS.DATA);

        if (props.onReveal) {
          props.onReveal();
        }
      } else {
        await changeView(SHARED_VIEWS.PASSWORD);
      }
    } catch {
      if (props.onError) {
        props.onError();
      }
    } finally {
      setLoading(false);
    }
  }, [props.id, props.type, props.nonce, props.urlSecret, changeView]);

  /**
   * Handle password submission: derive key from password + salt, decrypt data.
   * On success, transitions to DATA view. On failure, sets decryptError.
   * @param {string} password - User-entered password.
   */
  const handlePasswordSubmit = useCallback(async (password) => {
    setLoading(true);
    setDecryptError('');

    try {
      const salt = fromBase64Url(props.urlSecret);
      const keyBytes = await deriveKeyFromPassword(password, salt);
      const result = await decrypt(keyBytes);
      setDecryptedData(result);
      await changeView(SHARED_VIEWS.DATA);

      if (props.onReveal) {
        props.onReveal();
      }
    } catch (err) {
      if (err.message === 'Decryption failed') {
        setDecryptError(t('password.errorWrong'));
      } else if (props.onError) {
        props.onError();
      }
    } finally {
      setLoading(false);
    }
  }, [props.nonce, props.urlSecret, changeView]);

  const appLink = `${import.meta.env.VITE_UNIVERSAL_LINK_PROTOCOL || 'twofaspass'}://share/${props.id}/${props.type}/${props.nonce}/${props.urlSecret}`;
  const openInAppLabel = t('first.openInApp');

  /**
   * Attempt the deep link; fall back to the app store if the app does not respond.
   * @param {Event} e - Click event.
   */
  const handleOpenInApp = useCallback((e) => {
    e.preventDefault();
    openInApp(appLink);
  }, [appLink]);

  return (
    <>
      <section ref={boxRef} className={`page-box ${S.sharedDataBox}`}>
        <div ref={contentRef}>
          <ViewComponent
            setView={changeView}
            views={SHARED_VIEWS}
            id={props.id}
            type={props.type}
            nonce={props.nonce}
            urlSecret={props.urlSecret}
            loading={loading}
            onContinue={fetchAndContinue}
            onPasswordSubmit={handlePasswordSubmit}
            decryptedData={decryptedData}
            decryptError={decryptError}
          />
        </div>
      </section>

      {view === SHARED_VIEWS.FIRST && isMobileOrTablet && (
        <a
          className={`${bS.btnClear} ${S.sharedDataBoxOpenInApp}`}
          href={appLink}
          onClick={handleOpenInApp}
        >
          {openInAppLabel}
        </a>
      )}

      {view === SHARED_VIEWS.FIRST && (
        <div id='twofas-pass-extension-container'></div>
      )}
    </>
  );
}
