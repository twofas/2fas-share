// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useCallback } from 'preact/hooks';
import { Window } from '@/components/Window';
import { motionMs, motionEasing } from '@/components/Window/motion';
import { runArcsLight } from '@/components/ArcsDecor';
import { prefersReducedMotion } from '@/utils/reducedMotion';
import AddNewForm from './Views/AddNewForm';
import ShareLinkResult from './Views/ShareLinkResult';
import S from './AddNewBox.module.scss';
import { t } from '@/i18n';

/** @enum {string} */
const VIEWS = { FORM: 'form', RESULT: 'result' };

// Fallbacks when the motion tokens are missing (motion/duration/layout,
// motion/easing/standard).
const LAYOUT_MS = 480;
const EASING = 'cubic-bezier(0.4, 0, 0.6, 1)';
// The new content rises 8 px as it fades in (M-28).
const RISE = '0 0.5rem';

/**
 * Generator window (Generator / dialog): the form (Empty, Creating, Error,
 * Custom) and the result (Ready, Copied) inside one glass window.
 * @param {object} props - Component props.
 * @param {'hero'|'full'} [props.variant='hero'] - Home hero or the full generator view (/add).
 * @param {boolean} [props.focusOnMount] - Focus the content field on mount.
 * @param {string} [props.className] - Extra class on the window.
 * @returns {import('preact').JSX.Element} The add new box component.
 */
export default function AddNewBox ({ variant = 'hero', focusOnMount = false, className }) {
  const [view, setView] = useState(VIEWS.FORM);
  const [shareResult, setShareResult] = useState(null);
  // A new Empty form after "Create new link"; it starts with focus in the field.
  const [formKey, setFormKey] = useState(0);
  // role="status" region present from the start: "Link ready.", "Link copied".
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
   * Change the view in the window (MOTION.md M-28): the old content fades out
   * in a third of motion/duration/layout (160 ms), then the window takes the
   * new height while the new content fades in rising 8 px (320 ms), on
   * motion/easing/standard. Reduced motion swaps at once.
   * @param {() => void} apply - State changes that render the next view.
   */
  const changeView = useCallback(async (apply) => {
    const content = contentRef.current;
    const win = content?.parentElement;

    if (!content || !win || animatingRef.current || prefersReducedMotion()) {
      apply();
      return;
    }

    animatingRef.current = true;
    const layout = motionMs('layout', LAYOUT_MS);
    const out = layout / 3;
    const enter = layout - out;
    const easing = motionEasing('standard', EASING);

    try {
      const from = win.getBoundingClientRect().height;

      await content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: out, easing, fill: 'forwards' }).finished;

      apply();
      // Let the next view render before measuring it.
      await new Promise((r) => requestAnimationFrame(r));

      const to = win.getBoundingClientRect().height;

      if (Math.abs(to - from) > 0.5) {
        win.style.overflow = 'clip';
        win.animate([{ blockSize: `${from}px` }, { blockSize: `${to}px` }], { duration: enter, easing })
          .finished.finally(() => { win.style.overflow = ''; });
      }

      await content.animate(
        [{ opacity: 0, translate: RISE }, { opacity: 1, translate: '0 0' }],
        { duration: enter, easing }
      ).finished;
    } finally {
      content.getAnimations().forEach((a) => a.cancel());
      animatingRef.current = false;
    }
  }, []);

  /**
   * Handle successful form submission.
   * @param {object} result - The share result data.
   * @param {string} result.link - The generated share link.
   * @param {number} result.expiration - Expiration time in seconds.
   * @param {boolean} result.oneTimeAccess - Whether one-time access is enabled.
   * @param {string} result.password - The password, if set.
   */
  const handleSuccess = useCallback(async (result) => {
    announce(t('v2.result.title'));
    runArcsLight('ready');
    await changeView(() => {
      setShareResult(result);
      setView(VIEWS.RESULT);
    });
  }, [changeView, announce]);

  /**
   * "Create new link": back to a new Empty form, the same motion in reverse
   * order of content (M-28); nothing is remembered from the last link.
   */
  const handleReset = useCallback(() => changeView(() => {
    setFormKey((k) => k + 1);
    setView(VIEWS.FORM);
    setShareResult(null);
  }), [changeView]);

  return (
    <Window
      as='div'
      className={`${S.window} ${variant === 'full' ? S.full : S.hero} ${className || ''}`}
    >
      <div ref={contentRef} className={S.content}>
        {view === VIEWS.FORM ? (
          <AddNewForm
            key={formKey}
            onSuccess={handleSuccess}
            focusOnMount={focusOnMount || formKey > 0}
            labelledBy={variant === 'full' ? 'generator-title' : 'hero-title'}
            announce={announce}
          />
        ) : (
          <ShareLinkResult
            link={shareResult.link}
            expiration={shareResult.expiration}
            oneTimeAccess={shareResult.oneTimeAccess}
            password={shareResult.password}
            onReset={handleReset}
            announce={announce}
          />
        )}
      </div>
      <span role='status' className='visually-hidden'>{status}</span>
    </Window>
  );
}
