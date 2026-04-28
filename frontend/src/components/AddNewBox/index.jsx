// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useCallback } from 'preact/hooks';
import AddNewForm from './Views/AddNewForm';
import ShareLinkResult from './Views/ShareLinkResult';
import S from './AddNewBox.module.scss';

/** @enum {string} */
const VIEWS = { FORM: 'form', RESULT: 'result' };

/**
 * Add New box component — orchestrates the form and result views
 * with animated transitions (fade out → height → fade in).
 * @returns {import('preact').JSX.Element} The add new box component.
 */
export default function AddNewBox() {
  const [view, setView] = useState(VIEWS.FORM);
  const [shareResult, setShareResult] = useState(null);
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  const animatingRef = useRef(false);

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
   * Handle successful form submission.
   * @param {Object} result - The share result data.
   * @param {string} result.link - The generated share link.
   * @param {number} result.expiration - Expiration time in seconds.
   * @param {boolean} result.oneTimeAccess - Whether one-time access is enabled.
   * @param {string} result.password - The password, if set.
   */
  const handleSuccess = useCallback(async (result) => {
    setShareResult(result);
    await changeView(VIEWS.RESULT);
  }, [changeView]);

  return (
    <section
      ref={boxRef}
      className={view === VIEWS.FORM ? `page-box ${S.addBoxForm}` : `page-box ${S.addBoxResult}`}
    >
      <div ref={contentRef}>
        {view === VIEWS.FORM ? (
          <AddNewForm onSuccess={handleSuccess} />
        ) : (
          <ShareLinkResult
            link={shareResult.link}
            expiration={shareResult.expiration}
            oneTimeAccess={shareResult.oneTimeAccess}
            password={shareResult.password}
          />
        )}
      </div>
    </section>
  );
}
