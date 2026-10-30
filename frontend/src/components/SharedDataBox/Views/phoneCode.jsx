// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import SharedDataQR from '@/components/SharedDataQR';
import QrIcon from '@/assets/icons/qr-code-line.svg?react';
import { prefersReducedMotion } from '@/utils/reducedMotion';
import { readMotionTokens } from '../viewMotion';
import btn from '@/styles/ds/button.module.scss';
import S from '../SharedDataBox.module.scss';
import { t } from '@/i18n';

/** Id of the code panel, for aria-controls. */
export const PHONE_CODE_ID = 'shared-phone-code';

/**
 * Wait until Preact has rendered the last state change.
 * @returns {Promise<void>}
 */
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/**
 * State of the code for a phone in the field header (BEHAVIOR-SPEC 59.3,
 * MOTION M-35): hidden by default; "Show code" cross-fades the field into
 * the code panel in `toggle` `standard` while the box follows the height,
 * "Hide code" reverses it. One cross-fade at a time: a click during a
 * running cross-fade is ignored. When the code is no longer offered (the
 * note was fetched) the field comes back at once.
 * @param {boolean} offered - Whether the code is offered (a computer, before the fetch).
 * @returns {{ shown: boolean, fieldHidden: boolean, panelHidden: boolean, toggle: function(): Promise<void>, hide: function(): void, close: function(): Promise<void>, swapRef: import('preact').RefObject<HTMLDivElement>, fieldRef: import('preact').RefObject<HTMLDivElement>, panelRef: import('preact').RefObject<HTMLDivElement> }} Swap state and refs.
 */
export function useCodeSwap (offered) {
  const [shown, setShown] = useState(false);
  const [fieldHidden, setFieldHidden] = useState(false);
  const [panelHidden, setPanelHidden] = useState(true);
  const crossingRef = useRef(false);
  const swapRef = useRef(null);
  const fieldRef = useRef(null);
  const panelRef = useRef(null);

  /**
   * Back to the field at once, without motion.
   */
  const hide = useCallback(() => {
    [swapRef, fieldRef, panelRef].forEach((ref) => {
      ref.current?.getAnimations().forEach((animation) => animation.cancel());
      ref.current?.removeAttribute('style');
    });
    crossingRef.current = false;
    setShown(false);
    setFieldHidden(false);
    setPanelHidden(true);
  }, []);

  useEffect(() => {
    if (!offered) {
      hide();
    }
  }, [offered, hide]);

  /**
   * Show or hide the code with a cross-fade (a jump with reduced motion).
   */
  const toggle = useCallback(async () => {
    if (crossingRef.current) {
      return;
    }

    const show = !shown;
    setShown(show);

    if (prefersReducedMotion()) {
      setFieldHidden(show);
      setPanelHidden(!show);
      return;
    }

    crossingRef.current = true;
    const swap = swapRef.current;
    const fromHeight = swap.offsetHeight;

    // Both in the DOM; the outgoing one leaves the flow, so the box takes
    // the height of the incoming one.
    setFieldHidden(false);
    setPanelHidden(false);
    await nextFrame();

    const from = show ? fieldRef.current : panelRef.current;
    const to = show ? panelRef.current : fieldRef.current;

    if (!crossingRef.current || !from || !to) {
      return;
    }

    Object.assign(from.style, { position: 'absolute', inset: '0 0 auto 0' });
    const toHeight = swap.offsetHeight;
    const { toggle: duration, standard: easing } = readMotionTokens();
    const timing = { duration, easing };

    swap.style.overflow = 'clip';
    const animations = [
      swap.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], timing),
      from.animate([{ opacity: 1 }, { opacity: 0 }], { ...timing, fill: 'forwards' }),
      to.animate([{ opacity: 0 }, { opacity: 1 }], timing)
    ];

    try {
      await Promise.all(animations.map((animation) => animation.finished));
    } catch {
      // Cancelled by hide(): the field is already back.
      return;
    }

    from.removeAttribute('style');
    from.getAnimations().forEach((animation) => animation.cancel());
    swap.removeAttribute('style');
    setFieldHidden(show);
    setPanelHidden(!show);
    crossingRef.current = false;
  }, [shown]);

  /**
   * Give the field back as Hide code does ("Open note" with the code shown,
   * BEHAVIOR-SPEC 59.3): the reversed cross-fade, at once with reduced
   * motion; during a running cross-fade at once.
   * @returns {Promise<void>} Resolves when the field is back.
   */
  const close = useCallback(async () => {
    if (!shown) {
      return;
    }

    if (crossingRef.current) {
      hide();
      return;
    }

    await toggle();
  }, [shown, toggle, hide]);

  return { shown, fieldHidden, panelHidden, toggle, hide, close, swapRef, fieldRef, panelRef };
}

/**
 * "Show code" / "Hide code": Button / secondary Size=Small with the
 * qr-code-line icon after the label, in the field header next to the star.
 * @param {Object} props - Component props.
 * @param {boolean} props.shown - Whether the code is shown.
 * @param {function} props.onClick - Toggle handler.
 * @returns {import('preact').JSX.Element} The button.
 */
export function ShowCodeButton ({ shown, onClick }) {
  return (
    <button
      type='button'
      className={`${btn.secondary} ${S.codeButton}`}
      aria-expanded={shown ? 'true' : 'false'}
      aria-controls={PHONE_CODE_ID}
      onClick={onClick}
    >
      {shown ? t('recipient.hideCode') : t('recipient.showCode')}
      <QrIcon aria-hidden='true' />
    </button>
  );
}

/**
 * The box where the field and the code panel take turns.
 * @param {Object} props - Component props.
 * @param {ReturnType<typeof useCodeSwap>} props.swap - State from useCodeSwap.
 * @param {boolean} props.offered - Whether the code is offered at all.
 * @param {import('preact').ComponentChildren} props.children - The field (note slot or password field).
 * @returns {import('preact').JSX.Element} The swap box.
 */
export function CodeSwap ({ swap, offered, children }) {
  return (
    <div ref={swap.swapRef} className={S.swap}>
      <div ref={swap.fieldRef} hidden={swap.fieldHidden}>
        {children}
      </div>

      {offered && (
        <div ref={swap.panelRef} hidden={swap.panelHidden}>
          <SharedDataQR id={PHONE_CODE_ID} />
        </div>
      )}
    </div>
  );
}
