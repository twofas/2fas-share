// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useEffect, useRef, useState } from 'preact/hooks';
import { createHiddenLink } from './dust';
import btn from '@/styles/ds/button.module.scss';
import S from './HiddenLink.module.scss';
import EyeIcon from '@/assets/icons/eye-line.svg?react';
import EyeOffIcon from '@/assets/icons/eye-off-line.svg?react';
import { t } from '@/i18n';

/**
 * Centre of an element in the coordinates of the field.
 * @param {HTMLElement} el - The element.
 * @param {HTMLElement} field - The field.
 * @returns {{x: number, y: number}} Point.
 */
function centreIn (el, field) {
  const r = el.getBoundingClientRect();
  const f = field.getBoundingClientRect();

  return { x: r.left + r.width / 2 - f.left, y: r.top + r.height / 2 - f.top };
}

/**
 * Field / link (BEHAVIOR-SPEC 53): the address with its secret parts (id,
 * type, nonce, key) covered by dust from the first frame. The origin and the
 * slashes stay visible. While hidden every secret character is an empty box
 * of one width; the secret lives only in JavaScript. The eye (or a click on
 * the dust) reveals it with a ripple; the eye again hides it. No hover or
 * focus reveal. The copy button is passed in as children and sits above the eye.
 * @param {object} props - Component props.
 * @param {string} props.link - The full share link.
 * @param {{current: ?{reveal: () => void, select: () => void}}} [props.apiRef] - Filled with
 *   `reveal()` (as the eye, when hidden) and `select()` (focus the field, select the address).
 * @param {import('preact').ComponentChildren} [props.children] - The copy button.
 * @param {string} [props.className] - Extra class on the field.
 * @returns {import('preact').JSX.Element} The link field.
 */
export default function HiddenLink ({ link, apiRef, children, className }) {
  const fieldRef = useRef(null);
  const textRef = useRef(null);
  const canvasRef = useRef(null);
  const eyeRef = useRef(null);
  const engineRef = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const engine = createHiddenLink({
      field: fieldRef.current,
      text: textRef.current,
      canvas: canvasRef.current,
      link,
      hiddenSuffix: t('v2.result.linkHidden'),
      onChange: setShown
    });

    engineRef.current = engine;

    if (apiRef) {
      apiRef.current = {
        reveal () {
          if (!engine.shown()) {
            engine.toggle(true, centreIn(eyeRef.current, fieldRef.current));
          }
        },
        select () {
          // The field takes focus only for this (Copy failed): tabindex -1
          // while focused, so a click on the dust never moves focus.
          const fieldEl = fieldRef.current;

          fieldEl.tabIndex = -1;
          fieldEl.addEventListener('blur', () => fieldEl.removeAttribute('tabindex'), { once: true });
          fieldEl.focus({ preventScroll: true });
          const range = document.createRange();
          const selection = window.getSelection();

          range.selectNodeContents(textRef.current);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      };
    }

    return () => {
      engine.destroy();
      engineRef.current = null;

      if (apiRef) {
        apiRef.current = null;
      }
    };
  }, [link]); // eslint-disable-line react-hooks/exhaustive-deps

  /** The eye: reveal or hide from the eye; focus stays on the button. */
  const onEye = () => {
    const engine = engineRef.current;

    engine?.toggle(!engine.shown(), centreIn(eyeRef.current, fieldRef.current));
  };

  /**
   * A click on the dust reveals from the click point; focus does not move.
   * @param {MouseEvent} e - Click event.
   */
  const onDust = (e) => {
    const engine = engineRef.current;

    if (!engine || engine.shown()) {
      return;
    }

    const f = fieldRef.current.getBoundingClientRect();

    engine.toggle(true, { x: e.clientX - f.left, y: e.clientY - f.top });
  };

  /**
   * While hidden, pressing on the dust keeps focus where it was (there is no
   * text to select yet).
   * @param {MouseEvent} e - Mousedown event.
   */
  const keepFocus = (e) => {
    if (engineRef.current && !engineRef.current.shown()) {
      e.preventDefault();
    }
  };

  return (
    <div ref={fieldRef} className={`${S.field} ${className || ''}`}>
      {/* The address; its accessible name carries the origin while hidden. */}
      <p ref={textRef} className={S.text} role='img' onMouseDown={keepFocus} onClick={onDust} />
      <canvas ref={canvasRef} className={S.canvas} aria-hidden='true' />
      {children}
      <button
        ref={eyeRef}
        type='button'
        className={`${btn.icon} ${S.eye}`}
        aria-pressed={shown ? 'true' : 'false'}
        aria-label={shown ? t('v2.result.hideLink') : t('v2.result.showLink')}
        onClick={onEye}
      >
        {shown ? <EyeOffIcon aria-hidden='true' /> : <EyeIcon aria-hidden='true' />}
      </button>
    </div>
  );
}
