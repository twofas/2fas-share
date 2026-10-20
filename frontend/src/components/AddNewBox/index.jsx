// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useCallback } from 'preact/hooks';
import { Window } from '@/components/Window';
import { runArcsLight } from '@/components/ArcsDecor';
import { prefersReducedMotion } from '@/utils/reducedMotion';
import AddNewForm from './Views/AddNewForm';
import ShareLinkResult from './Views/ShareLinkResult';
import S from './AddNewBox.module.scss';
import { t } from '@/i18n';

/** @enum {string} */
const VIEWS = { FORM: 'form', RESULT: 'result' };

// Rebuilding the window into Ready takes motion/duration/layout (480 ms):
// a third to fade the form out, the rest to bring the result in.
const LAYOUT_MS = 480;
const EASING = 'cubic-bezier(0.4, 0, 0.6, 1)';

/**
 * Ask the page that hosts the generator to remount it in the Empty state.
 */
const requestReset = () => window.dispatchEvent(new Event('resetAddForm'));

/**
 * Generator window (Generator / dialog): the form (Empty, Creating, Error,
 * Custom) and the result (Ready, Copied) inside one glass window.
 * @param {Object} props
 * @param {'hero'|'full'} [props.variant='hero'] - Home hero or the full generator view (/add).
 * @param {boolean} [props.focusOnMount] - Focus the content field on mount (after "Create new link").
 * @param {string} [props.className] - Extra class on the window.
 * @returns {import('preact').JSX.Element} The add new box component.
 */
export default function AddNewBox({ variant = 'hero', focusOnMount = false, className }) {
  const [view, setView] = useState(VIEWS.FORM);
  const [shareResult, setShareResult] = useState(null);
  // role="status" region present from the start: "Link created", "Copied".
  const [status, setStatus] = useState('');

  /**
   * Announce a message; clearing first makes a repeated text be read again.
   * @param {string} text - Message for the status region.
   */
  const announce = useCallback((text) => {
    setStatus('');
    requestAnimationFrame(() => setStatus(text));
  }, []);
  const contentRef = useRef(null);
  const animatingRef = useRef(false);

  /**
   * Switch the view: fade the current content out, swap it and fade the new
   * one in (480 ms in total). The window keeps its height.
   * @param {string} nextView - The view to switch to.
   */
  const changeView = useCallback(async (nextView) => {
    const content = contentRef.current;
    const win = content?.parentElement;

    // Ready keeps the height of the form window, so the hero does not jump;
    // the lock is released when the viewport changes.
    if (win) {
      win.style.minHeight = `${win.offsetHeight}px`;
      window.addEventListener('resize', () => { win.style.minHeight = ''; }, { once: true });
    }

    if (!content || animatingRef.current || prefersReducedMotion()) {
      setView(nextView);
      return;
    }

    animatingRef.current = true;

    try {
      await content.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: LAYOUT_MS / 3, easing: EASING, fill: 'forwards' }
      ).finished;

      setView(nextView);

      await new Promise((r) => requestAnimationFrame(r));

      await content.animate(
        [{ opacity: 0, transform: 'translateY(0.5rem)' }, { opacity: 1, transform: 'none' }],
        { duration: (LAYOUT_MS * 2) / 3, easing: EASING }
      ).finished;
    } finally {
      content.getAnimations().forEach((a) => a.cancel());
      animatingRef.current = false;
    }
  }, []);

  /**
   * Handle successful form submission.
   * @param {Object} result - The share result data.
   * @param {string} result.link - The generated share link.
   * @param {number} result.expiration - Expiration time in seconds.
   * @param {boolean} result.oneTimeAccess - Whether one-time access is enabled.
   * @param {string} result.password - The password, if set.
   */
  const handleSuccess = useCallback(async (result) => {
    setShareResult(result);
    announce(t('v2.result.title'));
    runArcsLight();
    await changeView(VIEWS.RESULT);
  }, [changeView, announce]);

  return (
    <Window
      as='div'
      className={`${S.window} ${variant === 'full' ? S.full : S.hero} ${className || ''}`}
    >
      <div ref={contentRef} className={S.content}>
        {view === VIEWS.FORM ? (
          <AddNewForm
            onSuccess={handleSuccess}
            focusOnMount={focusOnMount}
            labelledBy={variant === 'full' ? 'generator-title' : 'hero-title'}
          />
        ) : (
          <ShareLinkResult
            link={shareResult.link}
            expiration={shareResult.expiration}
            oneTimeAccess={shareResult.oneTimeAccess}
            password={shareResult.password}
            onReset={requestReset}
            announce={announce}
          />
        )}
      </div>
      <span role='status' className='visually-hidden'>{status}</span>
    </Window>
  );
}
