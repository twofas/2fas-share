// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import { getSecret } from '@/api/client';
import { fromBase64Url } from '@/crypto/encoding';
import { deriveKeyFromPassword, decryptData } from '@/crypto/encrypt';
import { prefersReducedMotion } from '@/utils/reducedMotion';
import { openInApp } from '@/utils/openInApp';
import { isMobileOrTablet } from '@/utils/device';
import SharedDataBoxFirst from './Views/first';
import SharedDataBoxPassword from './Views/password';
import SharedDataBoxData from './Views/data';
import { ErrorContent } from './Views/error';
import W from '@/components/Window/Window.module.scss';
import btn from '@/styles/ds/button.module.scss';
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
  [SHARED_VIEWS.ERROR]: ErrorContent
};

/**
 * Recipient state of the window for the page heading.
 * @param {string} view - Current view.
 * @param {string} decryptError - Error of the last decryption attempt.
 * @param {Object} [secretMeta] - Secret metadata once fetched.
 * @returns {'intro'|'password'|'passwordError'|'revealed'|'revealedOnce'|'unavailable'} State.
 */
function recipientState (view, decryptError, secretMeta) {
  switch (view) {
    case SHARED_VIEWS.PASSWORD:
      return decryptError ? 'passwordError' : 'password';
    case SHARED_VIEWS.DATA:
      return secretMeta?.singleUse ? 'revealedOnce' : 'revealed';
    case SHARED_VIEWS.ERROR:
      return 'unavailable';
    default:
      return 'intro';
  }
}

/**
 * Shared data box that renders the correct view based on state. A link
 * without a password (v1k) starts in Intro; a link with a password (v1p)
 * starts in Password and the first sending of the password fetches the data.
 * @param {Object} props - Component props.
 * @param {string} props.id - Secret identifier for API fetch.
 * @param {string} props.type - Share type (v1p or v1k).
 * @param {string} props.nonce - Base64URL-encoded nonce from URL.
 * @param {string} props.urlSecret - Base64URL-encoded key (v1k) or salt (v1p) from URL.
 * @param {function} [props.onSecretMeta] - Called with secret metadata ({ singleUse, expiresAt, createdAt }) after API fetch.
 * @param {function} [props.onError] - Called when an unrecoverable error occurs (API failure, non-password decryption error).
 * @param {function} [props.onReveal] - Called when decrypted data is successfully revealed.
 * @param {Object} [props.secretMeta] - Secret metadata ({ singleUse, createdAt, validUntil }) once fetched.
 * @param {function} [props.onStateChange] - Called with the recipient state (and the content type once revealed) when it changes.
 * @returns {import('preact').JSX.Element} The shared data box.
 */
export default function SharedDataBox (props) {
  const [view, setView] = useState(props.type === 'v1p' ? SHARED_VIEWS.PASSWORD : SHARED_VIEWS.FIRST);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [decryptedData, setDecryptedData] = useState(null);
  const [decryptError, setDecryptError] = useState('');
  const [decryptAttempt, setDecryptAttempt] = useState(0);
  const encryptedDataRef = useRef(null);
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  const animatingRef = useRef(false);
  const ViewComponent = VIEW_COMPONENTS[view];
  const state = recipientState(view, decryptError, props.secretMeta);
  const onStateChange = props.onStateChange;

  useEffect(() => {
    if (onStateChange) {
      onStateChange(state, decryptedData?.contentType);
    }
  }, [state, onStateChange, decryptedData]);

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
        el.style.overflow = 'clip';
        await el.animate(
          [{ height: `${fromHeight}px` }, { height: `${toHeight}px` }],
          { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }
        ).finished;
        el.style.overflow = '';
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
   * Fetches the encrypted data from the API (GET /secret/{id}) and passes
   * the metadata up. For a one-time link the server deletes it here.
   * @returns {Promise<void>}
   */
  const fetchSecret = useCallback(async () => {
    const data = await getSecret(props.id);
    encryptedDataRef.current = data;
    setFetched(true);

    if (props.onSecretMeta) {
      props.onSecretMeta({
        singleUse: data.singleUse,
        createdAt: data.createdAt,
        validUntil: data.validUntil
      });
    }
  }, [props.id]);

  /**
   * Unrecoverable error (fetch failed, non-password decryption error): the
   * window shows the Unavailable state.
   */
  const showError = useCallback(() => {
    if (props.onError) {
      props.onError();
    }

    changeView(SHARED_VIEWS.ERROR);
  }, [changeView]);

  /**
   * Intro (v1k): fetches the encrypted data, decrypts it with the key from
   * the link, then shows the data.
   */
  const fetchAndContinue = useCallback(async () => {
    setLoading(true);

    try {
      await fetchSecret();

      const keyBytes = fromBase64Url(props.urlSecret);
      const result = await decrypt(keyBytes);
      setDecryptedData(result);
      await changeView(SHARED_VIEWS.DATA);

      if (props.onReveal) {
        props.onReveal();
      }
    } catch {
      showError();
    } finally {
      setLoading(false);
    }
  }, [props.nonce, props.urlSecret, fetchSecret, changeView, showError]);

  /**
   * Handle password submission (v1p): the first sending fetches the data,
   * then the key is derived from password + salt and the data decrypted.
   * On success, transitions to DATA view. On a wrong password, sets
   * decryptError and stays (the data stays in memory for the next attempt).
   * @param {string} password - User-entered password.
   */
  const handlePasswordSubmit = useCallback(async (password) => {
    setLoading(true);

    if (!encryptedDataRef.current) {
      try {
        await fetchSecret();
      } catch {
        setLoading(false);
        showError();
        return;
      }
    }

    try {
      const salt = fromBase64Url(props.urlSecret);
      const keyBytes = await deriveKeyFromPassword(password, salt);
      const result = await decrypt(keyBytes);
      setDecryptError('');
      setDecryptedData(result);
      await changeView(SHARED_VIEWS.DATA);

      if (props.onReveal) {
        props.onReveal();
      }
    } catch (err) {
      if (err.message === 'Decryption failed') {
        setDecryptError(t('recipient.wrongPasswordTitle'));
        setDecryptAttempt((n) => n + 1);
      } else {
        showError();
      }
    } finally {
      setLoading(false);
    }
  }, [props.nonce, props.urlSecret, fetchSecret, changeView, showError]);

  const beforeFetch = !fetched && (view === SHARED_VIEWS.FIRST || view === SHARED_VIEWS.PASSWORD);
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
      <section ref={boxRef} className={`${W.window} ${S.box}`}>
        <div ref={contentRef} className={S.content}>
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
            decryptAttempt={decryptAttempt}
            fetched={fetched}
            secretMeta={props.secretMeta}
          />
        </div>
      </section>

      {beforeFetch && isMobileOrTablet && (
        <a
          className={`${btn.secondary} ${btn.secondaryBig} ${S.openInApp}`}
          href={appLink}
          onClick={handleOpenInApp}
        >
          {openInAppLabel}
        </a>
      )}

      {beforeFetch && (
        <div id='twofas-pass-extension-container' className={S.extensionContainer}></div>
      )}
    </>
  );
}
