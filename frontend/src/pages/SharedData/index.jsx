// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import S from './SharedData.module.scss';
import SharedDataBox from '../../components/SharedDataBox';
import { AnnounceContext } from '../../components/SharedDataBox/Parts/context';
import SharedDataQR from '../../components/SharedDataQR';
import ArcsDecor, { runArcsLight } from '@/components/ArcsDecor';
import { RecipientHeading, TrustNote, StatusRegion } from './parts';
import { isMobileOrTablet } from '@/utils/device';

/** Delay between clearing and filling the status region, so a repeated message is announced again. */
const ANNOUNCE_GAP_MS = 100;

/**
 * Shared data page (Section / 10 Recipient). One <h1> above the window in
 * every state; the states change only the heading and the window interior.
 * A page-level role="status" region announces the copy and the last 5 minutes.
 * @param {Object} props - Component props.
 * @param {Object} props.params - Route parameters (id, type, nonce, key).
 * @returns {import('preact').JSX.Element} The shared data page.
 */
export default function SharedData (props) {
  const { id, type, nonce, key } = props.params;
  const [hideQR, setHideQR] = useState(false);
  const [secretMeta, setSecretMeta] = useState(null);
  const [state, setState] = useState(type === 'v1p' ? 'password' : 'intro');
  const [contentType, setContentType] = useState(null);

  /**
   * Track the recipient state and, once revealed, the content type.
   * @param {string} next - Recipient state.
   * @param {string} [type] - Content type of the revealed data.
   */
  const handleStateChange = useCallback((next, type) => {
    setState(next);
    setContentType(type || null);
  }, []);
  const [status, setStatus] = useState('');
  const headingRef = useRef(null);
  const statusTimers = useRef([]);

  useEffect(() => () => statusTimers.current.forEach(clearTimeout), []);

  // Warn before leaving the page once a one-time link was fetched (it is
  // already deleted on the server).
  useEffect(() => {
    if (!secretMeta?.singleUse || state === 'unavailable') {
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
  }, [secretMeta, state]);

  /**
   * Put a message in the status region, then clear it.
   * @param {string} message - Text to announce.
   * @param {number} [duration=2000] - How long the text stays in the region.
   */
  const announce = useCallback((message, duration = 2000) => {
    statusTimers.current.forEach(clearTimeout);
    setStatus('');
    statusTimers.current = [
      setTimeout(() => setStatus(message), ANNOUNCE_GAP_MS),
      setTimeout(() => setStatus(''), ANNOUNCE_GAP_MS + duration)
    ];
  }, []);

  /**
   * Handle secret metadata received from SharedDataBox after the API fetch.
   * @param {Object} meta - Secret metadata.
   * @param {boolean} meta.singleUse - Whether the secret is single-use.
   * @param {string} [meta.createdAt] - ISO date when the link was created.
   * @param {string} [meta.validUntil] - ISO date when the link expires.
   */
  const handleSecretMeta = useCallback((meta) => {
    if (meta.singleUse) {
      setHideQR(true);
    }

    setSecretMeta(meta);
  }, []);

  /**
   * Unrecoverable error: the window turns to Unavailable; the QR goes away.
   */
  const handleError = useCallback(() => {
    setHideQR(true);
  }, []);

  /**
   * The content is revealed: the button that had focus is gone, so focus
   * goes to the page heading; the arcs light up.
   */
  const handleReveal = useCallback(() => {
    // Two frames: the heading text of the revealed state is rendered first.
    requestAnimationFrame(() => requestAnimationFrame(() => headingRef.current?.focus()));
    runArcsLight();
  }, []);

  return (
    <AnnounceContext.Provider value={announce}>
      <main id='content' className={S.page}>
        <ArcsDecor />

        <div className={S.column}>
          <RecipientHeading ref={headingRef} state={state} contentType={contentType} />

          <SharedDataBox
            type={type}
            id={id}
            nonce={nonce}
            urlSecret={key}
            secretMeta={secretMeta}
            onSecretMeta={handleSecretMeta}
            onError={handleError}
            onReveal={handleReveal}
            onStateChange={handleStateChange}
          />

          <TrustNote />

          {!isMobileOrTablet && <SharedDataQR hidden={hideQR} className={S.qr} />}
        </div>

        <StatusRegion message={status} />
      </main>
    </AnnounceContext.Provider>
  );
}
