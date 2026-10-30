// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

import { useEffect, useRef, useState } from 'preact/hooks';
import { createHiddenLink } from './glitch';
import btn from '@/styles/ds/button.module.scss';
import S from './HiddenLink.module.scss';
import EyeIcon from '@/assets/icons/eye-line.svg?react';
import EyeOffIcon from '@/assets/icons/eye-off-line.svg?react';
import { t } from '@/i18n';

/**
 * Field / link (BEHAVIOR-SPEC 53): the address with its secret parts (id,
 * type, nonce, key) and the slashes between them scrambled by the glitch from
 * the first frame; only the origin stays visible. While hidden every box rolls random
 * characters; the secret lives only in JavaScript. Only the eye reveals it
 * (left to right) and hides it again: no hover, focus or click reveal. The
 * copy button is passed in as children and sits above the eye.
 * @param {object} props - Component props.
 * @param {string} props.link - The full share link.
 * @param {{current: ?{reveal: () => void, select: () => void}}} [props.apiRef] - Filled with
 *   `reveal()` (at once, without the sweep) and `select()` (focus the field, select the address).
 * @param {import('preact').ComponentChildren} [props.children] - The copy button.
 * @param {string} [props.className] - Extra class on the field.
 * @returns {import('preact').JSX.Element} The link field.
 */
export default function HiddenLink ({ link, apiRef, children, className }) {
  const fieldRef = useRef(null);
  const textRef = useRef(null);
  const engineRef = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const engine = createHiddenLink({
      text: textRef.current,
      link,
      hiddenSuffix: t('v2.result.linkHidden'),
      onChange: setShown
    });

    engineRef.current = engine;

    if (apiRef) {
      apiRef.current = {
        reveal () {
          // At once: the address is selected right after.
          engine.toggle(true, true);
        },
        select () {
          // The field takes focus only for this (Copy failed): tabindex -1
          // while focused, so a click on the text never moves focus.
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

  /** The eye: reveal or hide; focus stays on the button. */
  const onEye = () => {
    const engine = engineRef.current;

    engine?.toggle(!engine.shown());
  };

  return (
    <div ref={fieldRef} className={`${S.field} ${className || ''}`}>
      {/* The address; its accessible name carries the origin while hidden. */}
      <p ref={textRef} className={S.text} role='img' />
      {children}
      <button
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
